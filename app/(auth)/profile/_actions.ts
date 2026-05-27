"use server";

import { redirect } from "next/navigation";

import { profileSchema } from "@/lib/validation/profile.schema";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit/upstash";
import { deleteUserData } from "@/lib/retention/delete-request";
import { logger } from "@/lib/utils/logger";
import { err, ok, type Result } from "@/lib/errors";

export async function updateProfile(input: unknown): Promise<Result<{ redirectTo: string }>> {
  const correlationId = logger.correlationId();
  const parsed = profileSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return err({
      code: "ValidationError",
      field: String(first?.path[0] ?? ""),
      message: first?.message ?? "Datos inválidos.",
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "Unauthenticated" });

  const rl = await checkRateLimit(`updateProfile:${user.id}`);
  if (!rl.success) return err({ code: "RateLimited", retryAfterSec: rl.retryAfterSec });

  const { error } = await supabase
    .from("profiles")
    .update({
      nombres: parsed.data.nombres,
      apellidos: parsed.data.apellidos,
      facultad: parsed.data.facultad,
      carrera: parsed.data.carrera,
      ciclo: parsed.data.ciclo,
      rango_edad: parsed.data.rango_edad,
      genero: parsed.data.genero || null,
    })
    .eq("id", user.id);

  if (error) {
    logger.error("updateProfile failed", { correlationId, dbCode: error.code });
    return err({ code: "Unexpected", correlationId });
  }

  logger.info("profile updated", { correlationId, userId: user.id });
  redirect("/cuestionario");
  return ok({ redirectTo: "/cuestionario" });
}

/**
 * Self-service deletion (FR-041). El estudiante puede solicitar borrado de
 * su información personal en cualquier momento. Delega en
 * `lib/retention/delete-request.ts` para compartir la lógica con tests y
 * scripts CLI.
 */
export async function requestDataDeletion(): Promise<Result<{ done: true }>> {
  const correlationId = logger.correlationId();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "Unauthenticated" });

  // Rate limit estricto — borrar es destructivo, evitamos retries accidentales.
  const rl = await checkRateLimit(`deleteUserData:${user.id}`);
  if (!rl.success) return err({ code: "RateLimited", retryAfterSec: rl.retryAfterSec });

  const result = await deleteUserData(user.id);
  if (!result.ok) {
    logger.error("requestDataDeletion failed", { correlationId, reason: result.reason });
    return err({ code: "Unexpected", correlationId });
  }

  await supabase.auth.signOut();
  redirect("/");
  return ok({ done: true });
}

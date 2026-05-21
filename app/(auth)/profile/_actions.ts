"use server";

import { redirect } from "next/navigation";

import { profileSchema } from "@/lib/validation/profile.schema";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
 * Self-service deletion (FR-041, Ley 29733).
 * El estudiante puede solicitar borrado de PII en cualquier momento.
 */
export async function requestDataDeletion(): Promise<Result<{ done: true }>> {
  const correlationId = logger.correlationId();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "Unauthenticated" });

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error: updErr } = await admin
    .from("profiles")
    .update({
      email: null,
      nombres: null,
      apellidos: null,
      is_anonymized: true,
      anonymized_at: now,
    })
    .eq("id", user.id);

  if (updErr) {
    logger.error("requestDataDeletion failed", { correlationId, dbCode: updErr.code });
    return err({ code: "Unexpected", correlationId });
  }

  const { error: logErr } = await admin.from("anonymization_log").insert({
    affected_rows: 1,
    cycle_close_date_cutoff: now,
    executor: "user_request",
  });
  if (logErr) {
    logger.warn("anonymization_log insert failed (deletion still happened)", {
      correlationId,
    });
  }

  await supabase.auth.signOut();
  redirect("/");
  return ok({ done: true });
}

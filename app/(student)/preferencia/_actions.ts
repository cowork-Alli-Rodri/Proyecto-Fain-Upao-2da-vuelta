"use server";

import { redirect } from "next/navigation";

import { preferenceSchema } from "@/lib/validation/preference.schema";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit/upstash";
import { verifyTurnstileToken } from "@/lib/auth/turnstile";
import { logger } from "@/lib/utils/logger";
import { err, ok, type Result } from "@/lib/errors";

export async function submitPreference(input: unknown): Promise<Result<{ done: true }>> {
  const correlationId = logger.correlationId();
  const parsed = preferenceSchema.safeParse(input);
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

  // Rate limit
  const rl = await checkRateLimit(`submitPreference:${user.id}`);
  if (!rl.success) return err({ code: "RateLimited", retryAfterSec: rl.retryAfterSec });

  // Turnstile (permisivo si no hay secret)
  if (parsed.data.turnstileToken) {
    const ts = await verifyTurnstileToken(parsed.data.turnstileToken);
    if (!ts.success) return err({ code: "TurnstileFailed" });
  }

  // Verifica que el bloque POST esté cerrado (en v2 ese es el cierre real del cuestionario).
  const { data: profile } = await supabase
    .from("profiles")
    .select("questionnaire_post_completed_at")
    .eq("id", user.id)
    .single();
  const p = profile as
    | { questionnaire_post_completed_at: string | null }
    | null;

  if (!p?.questionnaire_post_completed_at) {
    return err({ code: "QuestionnaireIncomplete" });
  }

  // ¿Ya envió?
  const { data: existing } = await supabase
    .from("preferences")
    .select("id")
    .eq("student_id", user.id)
    .maybeSingle();
  if (existing) {
    return err({ code: "AlreadySubmitted" });
  }

  const { error } = await supabase.from("preferences").insert({
    student_id: user.id,
    candidato_preferido: parsed.data.candidatoPreferido,
    confianza: parsed.data.confianza,
    motivo: parsed.data.motivo?.trim() || null,
  });
  if (error) {
    logger.error("submitPreference insert failed", { correlationId, dbCode: error.code });
    return err({ code: "Unexpected", correlationId });
  }

  logger.info("preference submitted", {
    correlationId,
    candidato: parsed.data.candidatoPreferido,
  });

  // Flow v2: la encuesta final va después de la preferencia.
  redirect("/encuesta-final");
  return ok({ done: true });
}

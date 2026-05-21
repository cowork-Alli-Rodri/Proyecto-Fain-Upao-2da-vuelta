import { createAdminClient } from "../supabase/admin";
import { logger } from "../utils/logger";

/**
 * Self-service deletion (FR-041): anonimización inmediata por solicitud
 * del propio usuario, sin esperar al threshold de retención.
 *
 * Misma lógica que el cron `anonymizeExpired` pero filtrada a un único
 * `user_id`. Las tablas hijas (answers, preferences, consent_events) se
 * conservan: el join hacia profiles ya no contiene PII.
 *
 * El handler convencional (server action `requestDataDeletion`) llama
 * este helper, persiste, cierra la sesión y redirige al usuario.
 */

export type DeleteRequestOutcome =
  | { ok: true; alreadyAnonymized: boolean }
  | { ok: false; reason: string };

export async function deleteUserData(userId: string): Promise<DeleteRequestOutcome> {
  const correlationId = logger.correlationId();
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing, error: readErr } = await admin
    .from("profiles")
    .select("id, is_anonymized")
    .eq("id", userId)
    .maybeSingle();

  if (readErr) {
    logger.error("deleteUserData: read failed", {
      correlationId,
      dbCode: readErr.code,
    });
    return { ok: false, reason: readErr.message };
  }
  if (!existing) {
    return { ok: false, reason: "profile_not_found" };
  }

  const profile = existing as { id: string; is_anonymized: boolean };

  if (profile.is_anonymized) {
    // Ya estaba anonimizado por el cron o un request previo. Idempotente.
    return { ok: true, alreadyAnonymized: true };
  }

  const { error: updErr } = await admin
    .from("profiles")
    .update({
      email: null,
      nombres: null,
      apellidos: null,
      is_anonymized: true,
      anonymized_at: now,
    })
    .eq("id", userId);

  if (updErr) {
    logger.error("deleteUserData: update failed", {
      correlationId,
      dbCode: updErr.code,
    });
    return { ok: false, reason: updErr.message };
  }

  const { error: logErr } = await admin.from("anonymization_log").insert({
    affected_rows: 1,
    cycle_close_date_cutoff: now,
    executor: "user_request",
  });

  if (logErr) {
    logger.warn("deleteUserData: anonymization_log insert failed (deletion still happened)", {
      correlationId,
      dbCode: logErr.code,
    });
  }

  logger.info("deleteUserData: done", { correlationId });
  return { ok: true, alreadyAnonymized: false };
}

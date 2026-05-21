import { createAdminClient } from "../supabase/admin";
import { logger } from "../utils/logger";

/**
 * Política de retención y anonimización (FR-041a/b/c).
 *
 * Cuando se cumplen los 12 meses desde `app_settings.ciclo_cierre_at`, los
 * perfiles con `is_anonymized = false` se anonimizan: se nullifican
 * `email`, `nombres`, `apellidos` y se setea `is_anonymized = true` con
 * `anonymized_at = now()`.
 *
 * Diseño:
 *  - El cron mensual corre como **heartbeat**: si el threshold no se ha
 *    alcanzado todavía, termina sin tocar nada.
 *  - Cuando el threshold se cruza (una sola vez por ciclo), anonimiza
 *    TODOS los perfiles pendientes en una sola pasada.
 *  - Ejecuciones posteriores no afectan nada porque `is_anonymized = true`
 *    filtra todo (idempotencia).
 *
 * Las tablas hijas (answers, preferences, consent_events) NO se tocan: sus
 * filas siguen existiendo y los joins agregados al dashboard siguen
 * contando los registros sin PII.
 */

export type AnonymizeExecutor = "cron" | "admin_manual" | "cli";

export interface AnonymizeOptions {
  executor: AnonymizeExecutor;
  /** Si true, devuelve cuántos perfiles serían afectados sin escribir. */
  dryRun?: boolean;
  /** Inyectable para tests; en producción se usa createAdminClient. */
  client?: ReturnType<typeof createAdminClient>;
}

export type AnonymizeOutcome =
  | { kind: "skipped"; reason: "no_cutoff" | "threshold_not_reached"; cutoffAt: string | null; thresholdAt: string | null }
  | { kind: "done"; affected: number; cutoffAt: string; thresholdAt: string }
  | { kind: "dry_run"; pending: number; cutoffAt: string; thresholdAt: string }
  | { kind: "error"; reason: string };

const RETENTION_MONTHS = 12;

export async function anonymizeExpired(
  opts: AnonymizeOptions,
): Promise<AnonymizeOutcome> {
  const correlationId = logger.correlationId();
  const supabase = opts.client ?? createAdminClient();

  // 1) Leer ciclo_cierre_at
  const { data: settings, error: settingsErr } = await supabase
    .from("app_settings")
    .select("ciclo_cierre_at")
    .eq("id", 1)
    .single();

  if (settingsErr) {
    logger.error("anonymize: failed to read app_settings", {
      correlationId,
      dbCode: settingsErr.code,
    });
    return { kind: "error", reason: `app_settings read failed: ${settingsErr.message}` };
  }

  const cutoffAt = (settings as { ciclo_cierre_at: string | null } | null)?.ciclo_cierre_at ?? null;

  if (!cutoffAt) {
    logger.info("anonymize: no ciclo_cierre_at set, skipping", { correlationId });
    return {
      kind: "skipped",
      reason: "no_cutoff",
      cutoffAt: null,
      thresholdAt: null,
    };
  }

  // 2) Threshold = cutoffAt + 12 meses (en JS para no depender de funciones SQL).
  const cutoffDate = new Date(cutoffAt);
  const thresholdDate = new Date(cutoffDate);
  thresholdDate.setMonth(thresholdDate.getMonth() + RETENTION_MONTHS);
  const thresholdAt = thresholdDate.toISOString();

  if (thresholdDate.getTime() > Date.now()) {
    logger.info("anonymize: threshold not yet reached", {
      correlationId,
      cutoffAt,
      thresholdAt,
    });
    return {
      kind: "skipped",
      reason: "threshold_not_reached",
      cutoffAt,
      thresholdAt,
    };
  }

  // 3) Contar perfiles pendientes
  const { count, error: countErr } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_anonymized", false);

  if (countErr) {
    logger.error("anonymize: failed to count pending profiles", {
      correlationId,
      dbCode: countErr.code,
    });
    return { kind: "error", reason: `count failed: ${countErr.message}` };
  }

  const pending = count ?? 0;

  if (opts.dryRun) {
    return { kind: "dry_run", pending, cutoffAt, thresholdAt };
  }

  if (pending === 0) {
    // Idempotente: no hay nada que hacer pero registramos para audit.
    const { error: logErr } = await supabase.from("anonymization_log").insert({
      affected_rows: 0,
      cycle_close_date_cutoff: cutoffAt,
      executor: opts.executor,
    });
    if (logErr) {
      logger.warn("anonymize: zero pending but log insert failed", {
        correlationId,
        dbCode: logErr.code,
      });
    }
    return { kind: "done", affected: 0, cutoffAt, thresholdAt };
  }

  // 4) Anonimización en una sola UPDATE
  const now = new Date().toISOString();
  const { data: updated, error: updErr } = await supabase
    .from("profiles")
    .update({
      email: null,
      nombres: null,
      apellidos: null,
      is_anonymized: true,
      anonymized_at: now,
    })
    .eq("is_anonymized", false)
    .select("id");

  if (updErr) {
    logger.error("anonymize: bulk update failed", {
      correlationId,
      dbCode: updErr.code,
    });
    return { kind: "error", reason: `update failed: ${updErr.message}` };
  }

  const affected = updated?.length ?? 0;

  // 5) Log de auditoría
  const { error: logErr } = await supabase.from("anonymization_log").insert({
    affected_rows: affected,
    cycle_close_date_cutoff: cutoffAt,
    executor: opts.executor,
  });

  if (logErr) {
    logger.error("anonymize: succeeded but log insert failed", {
      correlationId,
      affected,
      dbCode: logErr.code,
    });
    // No revertimos: las filas ya están anonimizadas, el log perdido es
    // cosmético comparado con el efecto correcto en `profiles`.
  }

  logger.info("anonymize: done", {
    correlationId,
    affected,
    executor: opts.executor,
    cutoffAt,
  });

  return { kind: "done", affected, cutoffAt, thresholdAt };
}

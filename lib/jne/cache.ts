import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";

/**
 * Capa de cache + fallback para el comparador (FR-035).
 *
 * Diseño:
 *  - Los reads del comparador van directo a `candidates`, `plans`,
 *    `plan_dimensions` — Postgres es el cache porque `jneRefresh` solo
 *    escribe cuando la respuesta del JNE pasa Zod. Si JNE se cae, la copia
 *    válida previa permanece intacta automáticamente.
 *  - Este módulo provee helpers para exponer el estado del cache: cuándo
 *    fue el último refresh exitoso, hay incidente abierto, etc.
 */

export interface JneFreshness {
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastAttemptStatus: "success" | "partial" | "failed" | "running" | null;
  candidatesLastSynced: string | null;
  isStale: boolean; // true si > 48h desde último success
}

const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000;

export async function getJneFreshness(): Promise<JneFreshness> {
  const supabase = await createClient();

  const [{ data: lastSuccess }, { data: lastAttempt }, { data: latestCandidate }] =
    await Promise.all([
      supabase
        .from("jne_refresh_log")
        .select("finished_at")
        .eq("status", "success")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("jne_refresh_log")
        .select("started_at, status")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("candidates")
        .select("last_synced_at")
        .order("last_synced_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const lastSuccessAt = (lastSuccess as { finished_at: string | null } | null)?.finished_at ?? null;
  const lastAttemptRow = lastAttempt as { started_at: string; status: string } | null;
  const candidateSync =
    (latestCandidate as { last_synced_at: string } | null)?.last_synced_at ?? null;

  const isStale =
    !lastSuccessAt || Date.now() - new Date(lastSuccessAt).getTime() > STALE_THRESHOLD_MS;

  return {
    lastSuccessAt,
    lastAttemptAt: lastAttemptRow?.started_at ?? null,
    lastAttemptStatus:
      (lastAttemptRow?.status as JneFreshness["lastAttemptStatus"]) ?? null,
    candidatesLastSynced: candidateSync,
    isStale,
  };
}

/**
 * Lectura de las últimas N entradas del log para mostrar en admin.
 * Usa service-role para garantizar acceso aunque las RLS bloqueen al
 * usuario actual (el caller ya validó rol admin).
 */
export async function listJneRefreshLog(limit = 20) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("jne_refresh_log")
    .select(
      "id, triggered_by, started_at, finished_at, status, candidates_updated, dimensions_updated, error_message",
    )
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

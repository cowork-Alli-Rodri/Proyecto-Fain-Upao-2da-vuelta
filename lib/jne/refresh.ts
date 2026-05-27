import { createAdminClient } from "../supabase/admin";
import { logger } from "../utils/logger";
import { createSupabaseTokenStore, JneClient } from "./client";
import {
  JNE_FINALISTAS,
  type JneRefreshSummary,
  type JneRefreshTrigger,
  JneAuthError,
  JneNetworkError,
  JneSchemaError,
  JneTimeoutError,
} from "./types";

/**
 * Orquesta el refresh contra el nuevo servicio JNE
 * (votoinformadoia.jne.gob.pe/ServiciosWeb).
 *
 * El servicio actual ya no expone planes estructurados por dimensión: devuelve
 * un resumen textual generado por IA. Persistimos ese resumen en
 * `candidates.plan_resumen` para que el dashboard/UI muestre el contenido
 * actualizado del JNE sin depender de scraping.
 */

export interface JneRefreshOptions {
  triggeredBy: JneRefreshTrigger;
  client?: JneClient;
}

export type JneRefreshResult =
  | { ok: true; summary: JneRefreshSummary }
  | { ok: false; error: { code: string; message: string }; partial?: JneRefreshSummary };

export async function jneRefresh(opts: JneRefreshOptions): Promise<JneRefreshResult> {
  const startedAt = Date.now();
  const supabase = createAdminClient();
  const client = opts.client ?? new JneClient(createSupabaseTokenStore(supabase));

  const triggeredBy = opts.triggeredBy === "cli" ? "admin" : opts.triggeredBy;
  const { data: logRow, error: logInsErr } = await supabase
    .from("jne_refresh_log")
    .insert({
      triggered_by: triggeredBy,
      status: "running",
    })
    .select("id")
    .single();

  if (logInsErr || !logRow) {
    logger.error("jneRefresh no pudo abrir log", { dbCode: logInsErr?.code });
    return {
      ok: false,
      error: {
        code: "LogInsertFailed",
        message: "No se pudo iniciar el log de refresh JNE.",
      },
    };
  }

  const logId = (logRow as { id: number }).id;

  let candidatesUpdated = 0;
  const failures: { candidate: string; error: string }[] = [];

  for (const [key, finalista] of Object.entries(JNE_FINALISTAS)) {
    try {
      await refreshCandidate(supabase, client, finalista);
      candidatesUpdated++;
    } catch (e) {
      const message = describeError(e);
      logger.error("jneRefresh candidate failed", {
        candidate: key,
        error: message,
      });
      failures.push({ candidate: key, error: message });
    }
  }

  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - startedAt;

  let status: "success" | "partial" | "failed";
  if (failures.length === 0) status = "success";
  else if (candidatesUpdated > 0) status = "partial";
  else status = "failed";

  await supabase
    .from("jne_refresh_log")
    .update({
      finished_at: finishedAt,
      status,
      candidates_updated: candidatesUpdated,
      dimensions_updated: 0,
      error_message:
        failures.length > 0
          ? failures.map((f) => `${f.candidate}: ${f.error}`).join(" | ").slice(0, 1000)
          : null,
    })
    .eq("id", logId);

  const summary: JneRefreshSummary = {
    candidatesUpdated,
    dimensionsUpdated: 0,
    finishedAt,
    durationMs,
  };

  if (status === "success") {
    return { ok: true, summary };
  }

  return {
    ok: false,
    error: {
      code: status === "partial" ? "PartialFailure" : "Failed",
      message:
        status === "partial"
          ? `Algunos candidatos no se actualizaron (${failures.length}/${Object.keys(JNE_FINALISTAS).length}).`
          : "Refresh JNE falló para todos los candidatos.",
    },
    partial: summary,
  };
}

// ============================================================================
// Refresh por candidato
// ============================================================================

async function refreshCandidate(
  supabase: ReturnType<typeof createAdminClient>,
  client: JneClient,
  finalista: (typeof JNE_FINALISTAS)[keyof typeof JNE_FINALISTAS],
): Promise<void> {
  const resumen = await client.getPlanResumen(finalista.idOrganizacionPolitica);

  const { error: candErr } = await supabase
    .from("candidates")
    .upsert(
      {
        id: finalista.idHojaVida,
        id_organizacion_politica: finalista.idOrganizacionPolitica,
        nombre_completo: finalista.nombreCompleto,
        partido: finalista.partido,
        cargo: "Presidente",
        plan_resumen: resumen,
        last_synced_at: new Date().toISOString(),
      } as never,
      { onConflict: "id" },
    );

  if (candErr) {
    throw new Error(`upsert candidates falló: ${candErr.message}`);
  }
}

// ============================================================================
// Helpers
// ============================================================================

function describeError(e: unknown): string {
  if (e instanceof JneAuthError) return `Auth: ${e.message}`;
  if (e instanceof JneSchemaError) return `Schema: ${e.message}`;
  if (e instanceof JneTimeoutError) return `Timeout: ${e.message}`;
  if (e instanceof JneNetworkError) return `Network: ${e.message}`;
  if (e instanceof Error) return e.message;
  return "Error desconocido";
}

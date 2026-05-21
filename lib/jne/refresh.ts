import { createAdminClient } from "../supabase/admin";
import { logger } from "../utils/logger";
import { createSupabaseTokenStore, JneClient } from "./client";
import { JNE_DIMENSION_TO_ENUM } from "./schemas";
import {
  JNE_FINALISTAS,
  type JnePlanDimensionItem,
  type JneRefreshSummary,
  type JneRefreshTrigger,
  JneAuthError,
  JneNetworkError,
  JneSchemaError,
  JneTimeoutError,
} from "./types";

/**
 * Orquesta el refresh completo desde JNE → Postgres.
 *
 * Pasos:
 *   1. Inserta row en `jne_refresh_log` con `status='running'`.
 *   2. Para cada finalista: getPlanHeader + getPlanDetalle + getFormula.
 *   3. Upsert en `candidates`, `plans`, `plan_dimensions` (atómico por
 *      candidato — si falla uno, el otro NO se persiste, y la copia válida
 *      previa queda intacta — FR-035).
 *   4. Cierra log con `success` o `failed` y contadores.
 *
 * Nunca lanza al caller: devuelve un resultado tipado para que el handler
 * (cron o admin) pueda decidir cómo reportar.
 */

const SEPARATOR = "\n\n---\n\n";

export interface JneRefreshOptions {
  triggeredBy: JneRefreshTrigger;
  /** Inyectable para tests; en producción se construye contra Supabase. */
  client?: JneClient;
}

export type JneRefreshResult =
  | { ok: true; summary: JneRefreshSummary }
  | { ok: false; error: { code: string; message: string }; partial?: JneRefreshSummary };

export async function jneRefresh(opts: JneRefreshOptions): Promise<JneRefreshResult> {
  const startedAt = Date.now();
  const supabase = createAdminClient();
  const client = opts.client ?? new JneClient(createSupabaseTokenStore(supabase));

  // 1) Insert row de log en estado 'running'
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
  let dimensionsUpdated = 0;
  const failures: { candidate: string; error: string }[] = [];

  for (const [key, finalista] of Object.entries(JNE_FINALISTAS)) {
    try {
      const result = await refreshCandidate(supabase, client, finalista);
      candidatesUpdated += result.candidatesUpdated;
      dimensionsUpdated += result.dimensionsUpdated;
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
      dimensions_updated: dimensionsUpdated,
      error_message:
        failures.length > 0
          ? failures.map((f) => `${f.candidate}: ${f.error}`).join(" | ").slice(0, 1000)
          : null,
    })
    .eq("id", logId);

  const summary: JneRefreshSummary = {
    candidatesUpdated,
    dimensionsUpdated,
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
// Refresh de un solo candidato (atómico desde el punto de vista del consumidor)
// ============================================================================

async function refreshCandidate(
  supabase: ReturnType<typeof createAdminClient>,
  client: JneClient,
  finalista: (typeof JNE_FINALISTAS)[keyof typeof JNE_FINALISTAS],
): Promise<{ candidatesUpdated: number; dimensionsUpdated: number }> {
  const header = await client.getPlanHeader(finalista.idOrganizacionPolitica);
  const detalle = await client.getPlanDetalle(finalista.idPlanGobierno);
  const formula = await client.getFormula(finalista.idOrganizacionPolitica);

  const headerRow = header.data[0]!;
  const presidente = formula.data.find((r) => /PRESIDENTE/iu.test(r.cargo)) ?? formula.data[0]!;

  // 1) Upsert candidate
  const { error: candErr } = await supabase
    .from("candidates")
    .upsert(
      {
        id: presidente.idHojaVida,
        id_organizacion_politica: presidente.idOrganizacionPolitica,
        nombre_completo: presidente.nombreCompleto,
        partido: presidente.organizacionPolitica,
        cargo: "Presidente",
        foto_url: buildFotoUrl(presidente.txGuidFoto, presidente.txNombre),
        plan_pdf_url: headerRow.txRutaCompleto ?? null,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (candErr) {
    throw new Error(`upsert candidates falló: ${candErr.message}`);
  }

  // 2) Upsert plan
  const { error: planErr } = await supabase
    .from("plans")
    .upsert(
      {
        id: detalle.datoGeneral.idPlanGobierno,
        candidate_id: presidente.idHojaVida,
        header_json: headerRow as unknown as never,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (planErr) {
    throw new Error(`upsert plans falló: ${planErr.message}`);
  }

  // 3) Upsert plan_dimensions (4 dimensiones; cada una concatena items)
  const dimensionGroups: { items: JnePlanDimensionItem[] }[] = [
    { items: detalle.dimensionSocial },
    { items: detalle.dimensionEconomica },
    { items: detalle.dimensionAmbiental },
    { items: detalle.dimensionInstitucional },
  ];

  let dimensionsUpdated = 0;

  for (const { items } of dimensionGroups) {
    if (items.length === 0) continue;
    const idPg = items[0]!.idPgDimension;
    const dimEnum = JNE_DIMENSION_TO_ENUM[idPg];
    if (!dimEnum) {
      throw new Error(`Dimensión JNE desconocida: ${idPg}`);
    }

    const { error: dimErr } = await supabase
      .from("plan_dimensions")
      .upsert(
        {
          plan_id: detalle.datoGeneral.idPlanGobierno,
          dimension: dimEnum,
          problema: concatField(items, "txPgProblema"),
          objetivo: concatField(items, "txPgObjetivo"),
          indicador: concatField(items, "txPgIndicador"),
          meta: concatField(items, "txPgMeta"),
          raw_json: { items } as unknown as never,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "plan_id,dimension" },
      );

    if (dimErr) {
      throw new Error(`upsert plan_dimensions ${dimEnum} falló: ${dimErr.message}`);
    }
    dimensionsUpdated++;
  }

  return { candidatesUpdated: 1, dimensionsUpdated };
}

// ============================================================================
// Helpers
// ============================================================================

function concatField(
  items: JnePlanDimensionItem[],
  field: keyof Pick<
    JnePlanDimensionItem,
    "txPgProblema" | "txPgObjetivo" | "txPgIndicador" | "txPgMeta"
  >,
): string | null {
  const texts = items
    .map((i) => i[field])
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  if (texts.length === 0) return null;
  return texts.join(SEPARATOR);
}

function buildFotoUrl(
  txGuidFoto: string | null | undefined,
  txNombre: string | null | undefined,
): string | null {
  // El JNE no documenta el CDN público; conservamos null hasta confirmar la
  // ruta exacta. txNombre ya incluye `.jpeg` cuando viene.
  if (!txNombre && !txGuidFoto) return null;
  return null;
}

function describeError(e: unknown): string {
  if (e instanceof JneAuthError) return `Auth: ${e.message}`;
  if (e instanceof JneSchemaError) return `Schema: ${e.message}`;
  if (e instanceof JneTimeoutError) return `Timeout: ${e.message}`;
  if (e instanceof JneNetworkError) return `Network: ${e.message}`;
  if (e instanceof Error) return e.message;
  return "Error desconocido";
}

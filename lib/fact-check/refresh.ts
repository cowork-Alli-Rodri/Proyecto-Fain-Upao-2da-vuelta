/**
 * Refresh automático de la galería de fact-checks.
 *
 * Consulta el Google Fact Check Tools API con varios queries de la Segunda
 * Vuelta 2026, filtra verificaciones recientes con veredicto falso/engañoso de
 * medios reconocidos, y publica en `public.fact_checks` solo las URLs que
 * todavía no existen en la tabla (idempotente — sin duplicar entre corridas).
 *
 * Lo consumen:
 *   - El cron `app/api/cron/fact-checks-refresh/route.ts` (Vercel Cron diario).
 *   - El script CLI `scripts/seed-fact-checks-from-google.ts` (seed manual).
 *
 * Decisión de diseño: NO hace upsert porque la tabla no tiene constraint único
 * en `fact_checker_url`. Deduplicamos en memoria y contra la DB (todas las
 * filas, sin importar status) para no resucitar casos que el admin archivó.
 */

import { createAdminClient } from "../supabase/admin";
import { searchFactChecks } from "./google";

type Candidato = "keiko" | "roberto" | "ambos" | "ninguno";

const QUERIES: Array<{ query: string; cand: Candidato }> = [
  { query: "Keiko Fujimori", cand: "keiko" },
  { query: "Fuerza Popular", cand: "keiko" },
  { query: "Roberto Sánchez", cand: "roberto" },
  { query: "Juntos por el Perú", cand: "roberto" },
  { query: "Segunda vuelta Perú 2026", cand: "ambos" },
  { query: "Elecciones Perú 2026", cand: "ninguno" },
];

const FALSE_TOKENS = [
  "falso",
  "false",
  "fake",
  "incorrecto",
  "incorrect",
  "engañoso",
  "enganoso",
  "misleading",
  "mentira",
  "bulo",
  "manipulado",
  "descontextualizado",
];

const MIN_YEAR = 2025;

function isFalseLeaning(rating: string | undefined): boolean {
  if (!rating) return false;
  const lower = rating.toLowerCase();
  return FALSE_TOKENS.some((t) => lower.includes(t));
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

interface FactCheckRow {
  titular_falso: string;
  contexto: string;
  fact_checker_name: string;
  fact_checker_url: string;
  candidato_relacionado: Candidato;
  fecha_origen: string | null;
  status: "published";
  published_at: string;
}

export interface RefreshSummary {
  ok: boolean;
  queriesRun: number;
  candidates: number;
  inserted: number;
  skippedExisting: number;
  error?: string;
}

/**
 * Construye las filas candidatas a partir de los queries de Google.
 * No toca la DB — separable para testear el mapeo de forma aislada.
 */
async function collectCandidates(opts?: {
  fetch?: typeof fetch;
}): Promise<{ rows: FactCheckRow[]; queriesRun: number; error?: string }> {
  const seen = new Set<string>();
  const rows: FactCheckRow[] = [];
  let queriesRun = 0;
  let firstError: string | undefined;

  for (const { query, cand } of QUERIES) {
    const result = await searchFactChecks(query, { pageSize: 20, fetch: opts?.fetch });
    if (!result.ok) {
      firstError ??= result.error;
      continue;
    }
    queriesRun += 1;

    for (const claim of result.claims) {
      for (const review of claim.claimReview ?? []) {
        if (!review.url || !review.title) continue;
        if (seen.has(review.url)) continue;
        if (!isFalseLeaning(review.textualRating)) continue;

        const date = review.reviewDate ?? claim.claimDate;
        if (date && Number(date.slice(0, 4)) < MIN_YEAR) continue;

        const titular = truncate(claim.text ?? review.title, 220);
        if (titular.length < 5) continue;

        const contextoBase = `${review.title}. Veredicto: ${
          review.textualRating ?? "Falso"
        }.${claim.claimant ? ` Atribuida a: ${claim.claimant}.` : ""}`;
        const contexto = truncate(contextoBase, 1000);
        if (contexto.length < 20) continue;

        seen.add(review.url);
        rows.push({
          titular_falso: titular,
          contexto,
          fact_checker_name: truncate(review.publisher?.name ?? "Fact-checker desconocido", 80),
          fact_checker_url: review.url,
          candidato_relacionado: cand,
          fecha_origen: date ? date.slice(0, 10) : null,
          status: "published",
          published_at: new Date().toISOString(),
        });
      }
    }
  }

  return { rows, queriesRun, error: firstError };
}

export async function refreshFactChecks(opts?: { fetch?: typeof fetch }): Promise<RefreshSummary> {
  const { rows, queriesRun, error } = await collectCandidates(opts);

  if (queriesRun === 0) {
    return {
      ok: false,
      queriesRun: 0,
      candidates: 0,
      inserted: 0,
      skippedExisting: 0,
      error: error ?? "Google no devolvió resultados utilizables.",
    };
  }

  if (rows.length === 0) {
    return { ok: true, queriesRun, candidates: 0, inserted: 0, skippedExisting: 0 };
  }

  const supabase = createAdminClient();

  // URLs ya presentes (cualquier status) para no duplicar ni resucitar archivados.
  const { data: existingRaw, error: selectError } = await supabase
    .from("fact_checks" as never)
    .select("fact_checker_url");
  if (selectError) {
    return {
      ok: false,
      queriesRun,
      candidates: rows.length,
      inserted: 0,
      skippedExisting: 0,
      error: `No se pudo leer fact_checks existentes: ${selectError.message}`,
    };
  }

  const existingUrls = new Set(
    ((existingRaw ?? []) as Array<{ fact_checker_url: string }>).map((r) => r.fact_checker_url),
  );
  const toInsert = rows.filter((r) => !existingUrls.has(r.fact_checker_url));
  const skippedExisting = rows.length - toInsert.length;

  if (toInsert.length === 0) {
    return { ok: true, queriesRun, candidates: rows.length, inserted: 0, skippedExisting };
  }

  const { error: insertError } = await supabase
    .from("fact_checks" as never)
    .insert(toInsert as never);
  if (insertError) {
    return {
      ok: false,
      queriesRun,
      candidates: rows.length,
      inserted: 0,
      skippedExisting,
      error: `No se pudo insertar: ${insertError.message}`,
    };
  }

  return {
    ok: true,
    queriesRun,
    candidates: rows.length,
    inserted: toInsert.length,
    skippedExisting,
  };
}

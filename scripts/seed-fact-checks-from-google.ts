/**
 * Seed inicial de fact_checks usando Google Fact Check Tools API en vivo.
 *
 * Consulta varios queries relacionados a la Segunda Vuelta 2026, filtra
 * verificaciones recientes con veredictos falsos/engañosos, y las inserta
 * como `published` en `public.fact_checks` para que la UI de
 * /no-te-dejes-sorprender tenga contenido base si Google falla.
 *
 * Uso:
 *   pnpm exec tsx scripts/seed-fact-checks-from-google.ts
 *
 * Variables requeridas:
 *   GOOGLE_FACT_CHECK_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/supabase/database.types";

const QUERIES: Array<{ query: string; cand: "keiko" | "roberto" | "ambos" | "ninguno" }> = [
  { query: "Keiko Fujimori", cand: "keiko" },
  { query: "Fuerza Popular", cand: "keiko" },
  { query: "Roberto Sánchez", cand: "roberto" },
  { query: "Juntos por el Perú", cand: "roberto" },
  { query: "Segunda vuelta Perú 2026", cand: "ambos" },
  { query: "Elecciones Perú 2026", cand: "ninguno" },
];

interface ClaimReview {
  publisher?: { name?: string; site?: string };
  url?: string;
  title?: string;
  reviewDate?: string;
  textualRating?: string;
  languageCode?: string;
}

interface Claim {
  text?: string;
  claimant?: string;
  claimDate?: string;
  claimReview?: ClaimReview[];
}

interface SearchResponse {
  claims?: Claim[];
}

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

function isFalseLeaning(rating: string | undefined): boolean {
  if (!rating) return false;
  const lower = rating.toLowerCase();
  return FALSE_TOKENS.some((t) => lower.includes(t));
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

async function fetchClaims(apiKey: string, query: string): Promise<Claim[]> {
  const url = new URL("https://factchecktools.googleapis.com/v1alpha1/claims:search");
  url.searchParams.set("query", query);
  url.searchParams.set("languageCode", "es");
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    console.error(`  ! Google API ${res.status} para "${query}"`);
    return [];
  }
  const data = (await res.json()) as SearchResponse;
  return data.claims ?? [];
}

async function main() {
  const apiKey = process.env.GOOGLE_FACT_CHECK_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey) {
    console.error("Falta GOOGLE_FACT_CHECK_API_KEY.");
    process.exit(1);
  }
  if (!url || !key) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Set para deduplicar por URL
  const seen = new Set<string>();
  const rows: Array<{
    titular_falso: string;
    contexto: string;
    fact_checker_name: string;
    fact_checker_url: string;
    candidato_relacionado: "keiko" | "roberto" | "ambos" | "ninguno";
    fecha_origen: string | null;
    status: "published";
    published_at: string;
  }> = [];

  for (const { query, cand } of QUERIES) {
    console.warn(`→ Consultando Google: "${query}"`);
    const claims = await fetchClaims(apiKey, query);
    console.warn(`  ${claims.length} claims devueltos`);

    for (const claim of claims) {
      for (const review of claim.claimReview ?? []) {
        if (!review.url || !review.title) continue;
        if (seen.has(review.url)) continue;
        if (!isFalseLeaning(review.textualRating)) continue;

        // Filtra solo verificaciones de 2025-2026 (recientes para el ciclo electoral)
        const date = review.reviewDate ?? claim.claimDate;
        if (date) {
          const year = Number(date.slice(0, 4));
          if (year < 2025) continue;
        }

        seen.add(review.url);

        const titular = truncate(claim.text ?? review.title, 220);
        const contextoBase = `${review.title}. Veredicto: ${review.textualRating ?? "Falso"}.${claim.claimant ? ` Atribuida a: ${claim.claimant}.` : ""}`;
        const contexto = truncate(contextoBase, 1000);
        if (contexto.length < 20) continue;
        if (titular.length < 5) continue;

        rows.push({
          titular_falso: titular,
          contexto,
          fact_checker_name: truncate(review.publisher?.name ?? "Fact-checker desconocido", 80),
          fact_checker_url: review.url,
          candidato_relacionado: cand,
          fecha_origen: date ? date.slice(0, 10) : null,
          status: "published" as const,
          published_at: new Date().toISOString(),
        });
      }
    }
  }

  if (rows.length === 0) {
    console.warn("No se encontraron fact-checks que cumplan los filtros.");
    return;
  }

  console.warn(`\nInsertando ${rows.length} fact-checks...`);
  // Tabla `fact_checks` no está en database.types.ts; cast a `never` para insertar
  const { error } = await supabase.from("fact_checks" as never).insert(rows as never);
  if (error) {
    console.error("Error al insertar:", error.message);
    process.exit(1);
  }

  console.warn(`OK · ${rows.length} fact-checks publicados.`);
  for (const r of rows.slice(0, 5)) {
    console.warn(`  • [${r.candidato_relacionado}] ${r.titular_falso.slice(0, 70)}...`);
  }
  if (rows.length > 5) console.warn(`  ... y ${rows.length - 5} más.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Cliente del Google Fact Check Tools API.
 *
 * Doc: https://developers.google.com/fact-check/tools/api/reference/rest/v1alpha1/claims/search
 *
 * Endpoint:
 *   GET https://factchecktools.googleapis.com/v1alpha1/claims:search
 *     ?query=<texto>
 *     &languageCode=es
 *     &pageSize=10
 *     &key=<API_KEY>
 *
 * El API es público para llamadas de lectura una vez tienes una API key de
 * Google Cloud (proyecto con Fact Check Tools API habilitada). En este
 * proyecto la key vive en `GOOGLE_FACT_CHECK_API_KEY` (env, server-only).
 */

import { z } from "zod";

const ENDPOINT =
  "https://factchecktools.googleapis.com/v1alpha1/claims:search";

export const FactCheckClaimReviewSchema = z.object({
  publisher: z
    .object({
      name: z.string().optional(),
      site: z.string().optional(),
    })
    .optional(),
  url: z.string().url().optional(),
  title: z.string().optional(),
  reviewDate: z.string().optional(),
  textualRating: z.string().optional(),
  languageCode: z.string().optional(),
});

export const FactCheckClaimSchema = z.object({
  text: z.string().optional(),
  claimant: z.string().optional(),
  claimDate: z.string().optional(),
  claimReview: z.array(FactCheckClaimReviewSchema).optional(),
});

export const FactCheckResponseSchema = z.object({
  claims: z.array(FactCheckClaimSchema).optional(),
  nextPageToken: z.string().optional(),
});

export type FactCheckClaim = z.infer<typeof FactCheckClaimSchema>;
export type FactCheckClaimReview = z.infer<typeof FactCheckClaimReviewSchema>;

/**
 * Veredicto normalizado a partir del `textualRating` libre que cada publisher
 * usa ("Falso", "Verdadero", "Engañoso", "Mostly False", etc.).
 *
 * Mapeamos a 5 categorías para que la UI pueda colorear consistente sin
 * intentar parsear cada idioma/medio.
 */
export type NormalizedVerdict =
  | "false"
  | "mostly_false"
  | "mixed"
  | "mostly_true"
  | "true"
  | "unrated";

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
];
const TRUE_TOKENS = ["verdadero", "true", "cierto", "correcto"];
const MIXED_TOKENS = ["mixto", "mixed", "mezcla", "media", "half", "parcial"];

export function normalizeVerdict(textualRating: string | undefined): NormalizedVerdict {
  if (!textualRating) return "unrated";
  const lower = textualRating.toLowerCase();
  const hasMostly = /mostly|mayormente|principalmente/.test(lower);

  if (FALSE_TOKENS.some((t) => lower.includes(t))) {
    return hasMostly ? "mostly_false" : "false";
  }
  if (TRUE_TOKENS.some((t) => lower.includes(t))) {
    return hasMostly ? "mostly_true" : "true";
  }
  if (MIXED_TOKENS.some((t) => lower.includes(t))) {
    return "mixed";
  }
  return "unrated";
}

export interface FactCheckSearchResult {
  ok: boolean;
  claims: FactCheckClaim[];
  query: string;
  error?: string;
}

export async function searchFactChecks(
  query: string,
  opts: { languageCode?: string; pageSize?: number; fetch?: typeof fetch } = {},
): Promise<FactCheckSearchResult> {
  const apiKey = process.env.GOOGLE_FACT_CHECK_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      claims: [],
      query,
      error:
        "Falta GOOGLE_FACT_CHECK_API_KEY en el entorno. El verificador no puede consultar Google.",
    };
  }

  const trimmed = query.trim();
  if (trimmed.length < 4) {
    return {
      ok: false,
      claims: [],
      query: trimmed,
      error: "Escribe al menos 4 caracteres del titular o frase a verificar.",
    };
  }

  const url = new URL(ENDPOINT);
  url.searchParams.set("query", trimmed);
  url.searchParams.set("languageCode", opts.languageCode ?? "es");
  url.searchParams.set("pageSize", String(opts.pageSize ?? 10));
  url.searchParams.set("key", apiKey);

  const fetchImpl = opts.fetch ?? fetch;
  let raw: unknown;
  try {
    const response = await fetchImpl(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return {
        ok: false,
        claims: [],
        query: trimmed,
        error: `Google respondió HTTP ${response.status}.`,
      };
    }
    raw = await response.json();
  } catch (e) {
    return {
      ok: false,
      claims: [],
      query: trimmed,
      error: e instanceof Error ? e.message : "Error de red consultando Google.",
    };
  }

  const parsed = FactCheckResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      claims: [],
      query: trimmed,
      error: "Respuesta inesperada de Google.",
    };
  }

  return {
    ok: true,
    claims: parsed.data.claims ?? [],
    query: trimmed,
  };
}

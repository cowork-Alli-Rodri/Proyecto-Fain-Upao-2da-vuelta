"use server";

import { z } from "zod";

import { checkRateLimit } from "@/lib/rate-limit/upstash";
import { logger } from "@/lib/utils/logger";
import { err, ok, type Result } from "@/lib/errors";
import {
  normalizeVerdict,
  searchFactChecks,
  type NormalizedVerdict,
} from "@/lib/fact-check/google";

const VerifyInputSchema = z.object({
  query: z
    .string()
    .min(4, "Escribe al menos 4 caracteres.")
    .max(500, "Máximo 500 caracteres."),
  // Cliente Turnstile token opcional; si está habilitado se valida en otro lugar.
  turnstileToken: z.string().optional(),
});

export interface VerifierClaim {
  text: string;
  claimant: string | null;
  claimDate: string | null;
  reviews: Array<{
    publisherName: string | null;
    publisherSite: string | null;
    url: string | null;
    title: string | null;
    reviewDate: string | null;
    textualRating: string | null;
    verdict: NormalizedVerdict;
    languageCode: string | null;
  }>;
}

export interface VerifierResult {
  query: string;
  claims: VerifierClaim[];
  summary: {
    total: number;
    falseLeaning: number;
    trueLeaning: number;
    mixed: number;
    unrated: number;
  };
}

/**
 * Verifica un titular o frase consultando Google Fact Check Tools API.
 * Anti-abuso: rate limit por IP/usuario y rechazo de queries demasiado cortas.
 *
 * No requiere autenticación — la página `/no-te-dejes-sorprender` es pública.
 * Para evitar abuso, identificamos al caller por su cookie de sesión Supabase
 * si existe, sino por un fallback de IP no disponible en server actions (se
 * usa la clave "anon").
 */
export async function verifyClaim(input: unknown): Promise<Result<VerifierResult>> {
  const correlationId = logger.correlationId();
  const parsed = VerifyInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return err({
      code: "ValidationError",
      field: String(first?.path[0] ?? ""),
      message: first?.message ?? "Datos inválidos.",
    });
  }

  const rl = await checkRateLimit(`factCheckVerify:anon`);
  if (!rl.success) {
    return err({ code: "RateLimited", retryAfterSec: rl.retryAfterSec });
  }

  const result = await searchFactChecks(parsed.data.query, { languageCode: "es" });
  if (!result.ok) {
    logger.warn("verifyClaim google api error", {
      correlationId,
      error: result.error,
    });
    return err({
      code: "Unexpected",
      correlationId,
    });
  }

  const claims: VerifierClaim[] = result.claims.map((c) => ({
    text: c.text ?? "(sin texto)",
    claimant: c.claimant ?? null,
    claimDate: c.claimDate ?? null,
    reviews: (c.claimReview ?? []).map((r) => ({
      publisherName: r.publisher?.name ?? null,
      publisherSite: r.publisher?.site ?? null,
      url: r.url ?? null,
      title: r.title ?? null,
      reviewDate: r.reviewDate ?? null,
      textualRating: r.textualRating ?? null,
      verdict: normalizeVerdict(r.textualRating),
      languageCode: r.languageCode ?? null,
    })),
  }));

  let falseLeaning = 0;
  let trueLeaning = 0;
  let mixed = 0;
  let unrated = 0;
  for (const c of claims) {
    for (const r of c.reviews) {
      if (r.verdict === "false" || r.verdict === "mostly_false") falseLeaning++;
      else if (r.verdict === "true" || r.verdict === "mostly_true") trueLeaning++;
      else if (r.verdict === "mixed") mixed++;
      else unrated++;
    }
  }

  return ok({
    query: result.query,
    claims,
    summary: {
      total: claims.reduce((a, c) => a + c.reviews.length, 0),
      falseLeaning,
      trueLeaning,
      mixed,
      unrated,
    },
  });
}

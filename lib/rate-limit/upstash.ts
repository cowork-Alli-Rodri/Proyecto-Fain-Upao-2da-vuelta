import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting global vía Upstash Redis serverless (FR-037).
 *
 * Patrón: sliding window 5 req/min keyed por user_id (o IP cuando no hay sesión).
 *
 * En entornos sin Upstash configurado (CI sin secrets, dev sin cuenta), devuelve
 * un limiter no-op que siempre permite. Esto evita que tests/dev quemen quota
 * y mantiene la app funcional sin Upstash.
 */

let cachedLimiter: Ratelimit | null = null;
let noopMode = false;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function getRateLimiter(): Ratelimit | null {
  if (cachedLimiter) return cachedLimiter;
  if (noopMode) return null;

  const redis = getRedis();
  if (!redis) {
    noopMode = true;
    return null;
  }

  cachedLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "voto-upao",
  });

  return cachedLimiter;
}

/**
 * Verifica si la key (típicamente user_id) puede ejecutar la acción protegida.
 * Si Upstash no está configurado, permite siempre (no-op para dev/CI).
 */
export async function checkRateLimit(
  key: string,
): Promise<{ success: boolean; retryAfterSec: number }> {
  const limiter = getRateLimiter();
  if (!limiter) return { success: true, retryAfterSec: 0 };

  const result = await limiter.limit(key);
  const retryAfterSec = result.success
    ? 0
    : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

  return { success: result.success, retryAfterSec };
}

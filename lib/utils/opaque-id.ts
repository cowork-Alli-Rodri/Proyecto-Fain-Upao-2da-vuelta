import { createHash } from "node:crypto";
import { nanoid } from "nanoid";

const HASH_SALT = "voto-informado-upao";

/**
 * Hash determinístico SHA-256 de un UUID. Usado para opaque_user_id en
 * usage_events — sobrevive a la anonimización porque no requiere el UUID
 * real para reproducirse, pero NO permite reconstruir el UUID original.
 */
export function hashUserId(userUuid: string): string {
  return (
    "u_" +
    createHash("sha256")
      .update(`${userUuid}:${HASH_SALT}`)
      .digest("hex")
  );
}

/**
 * Hash de IP para auditoría sin almacenar la IP cruda.
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`${ip}:${HASH_SALT}`).digest("hex");
}

/**
 * ID opaco aleatorio para usos donde se necesita un identificador no-PII
 * (correlation IDs en logs, etc.).
 */
export function generateOpaqueId(prefix = "op"): string {
  return `${prefix}_${nanoid(12)}`;
}

/**
 * Correlation ID para tracing de errores cross-system.
 */
export function generateCorrelationId(): string {
  return `cor_${nanoid(16)}`;
}

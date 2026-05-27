import { timingSafeEqual } from "node:crypto";

/**
 * Compara dos secretos en tiempo constante para evitar timing attacks.
 *
 * `===` y `!==` retornan early en el primer byte distinto, permitiendo a un
 * atacante deducir el secreto byte a byte midiendo el tiempo de respuesta.
 * `timingSafeEqual` siempre toma el mismo tiempo independientemente del input.
 *
 * Si los buffers tienen longitudes distintas, retorna `false` rápidamente
 * porque `timingSafeEqual` requiere longitudes iguales — ese caso ya no
 * filtra información útil porque las longitudes válidas son conocidas
 * (CRON_SECRET es generado con un tamaño fijo).
 *
 * Uso típico — header `Authorization: Bearer <secreto>`:
 *
 *   const valid = compareSecrets(
 *     request.headers.get("authorization") ?? "",
 *     `Bearer ${process.env.CRON_SECRET ?? ""}`,
 *   );
 */
export function compareSecrets(a: string, b: string): boolean {
  if (a.length === 0 || b.length === 0) return false;

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  // Si las longitudes difieren, igualamos al tamaño mayor con ceros para
  // que `timingSafeEqual` no lance — el resultado igual es `false` porque
  // los contenidos no coinciden.
  if (bufA.length !== bufB.length) {
    const max = Math.max(bufA.length, bufB.length);
    const paddedA = Buffer.alloc(max);
    const paddedB = Buffer.alloc(max);
    bufA.copy(paddedA);
    bufB.copy(paddedB);
    timingSafeEqual(paddedA, paddedB); // tiempo constante aunque retornemos false
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

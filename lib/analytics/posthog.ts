import type { AnalyticsEvent } from "./events";

/**
 * Wrapper para PostHog que garantiza CERO PII (FR-039).
 *
 * - Si el cliente PostHog no está cargado o no hay key, las llamadas son no-op.
 * - El distinct_id es siempre el hash opaco del user_id (no el UUID real).
 * - El payload se filtra para nunca incluir campos sensibles.
 */

const PII_FIELDS = new Set([
  "email",
  "correo",
  "nombre",
  "nombres",
  "apellido",
  "apellidos",
  "dni",
  "phone",
  "telefono",
  "user_id",
  "auth_id",
]);

function sanitizePayload(payload: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!payload) return {};
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (PII_FIELDS.has(key.toLowerCase())) continue;
    clean[key] = value;
  }
  return clean;
}

/**
 * Captura un evento del lado cliente.
 * Llamar solo desde `"use client"`.
 */
export function captureEvent(
  event: AnalyticsEvent,
  payload?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  const posthog = (window as typeof window & { posthog?: { capture?: (e: string, p: Record<string, unknown>) => void } }).posthog;
  if (!posthog?.capture) return;
  posthog.capture(event, sanitizePayload(payload));
}

/**
 * Asigna identidad (distinct_id) en PostHog. Usar el hash opaco, NUNCA el UUID real.
 */
export function identifyUser(opaqueUserId: string, traits?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const posthog = (window as typeof window & { posthog?: { identify?: (id: string, t: Record<string, unknown>) => void } }).posthog;
  if (!posthog?.identify) return;
  posthog.identify(opaqueUserId, sanitizePayload(traits));
}

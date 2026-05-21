/**
 * Logger estructurado JSON para server actions y route handlers
 * (constitución VI: logs estructurados, sin PII).
 *
 * Las llamadas a `logger.info/warn/error` se imprimen como una sola línea JSON
 * que Vercel/Datadog/etc. parsean automáticamente. Los campos PII se filtran.
 */

import { generateCorrelationId } from "./opaque-id";

const PII_KEYS = new Set([
  "email",
  "correo",
  "nombre",
  "nombres",
  "apellido",
  "apellidos",
  "dni",
  "phone",
  "telefono",
  "password",
  "token",
  "secret",
]);

type Level = "debug" | "info" | "warn" | "error";

interface LogContext {
  correlationId?: string;
  userId?: string; // opaque hash, NUNCA UUID real
  [key: string]: unknown;
}

function sanitize(context: LogContext | undefined): Record<string, unknown> {
  if (!context) return {};
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(context)) {
    if (PII_KEYS.has(k.toLowerCase())) continue;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      clean[k] = sanitize(v as LogContext);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

function emit(level: Level, message: string, context?: LogContext): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...sanitize(context),
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    // `info` y `debug` van a stderr para no contaminar stdout en CLI scripts.
    // En Vercel ambos se capturan.
    console.warn(line);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    process.env.NODE_ENV !== "production" && emit("debug", message, context),
  info: (message: string, context?: LogContext) => emit("info", message, context),
  warn: (message: string, context?: LogContext) => emit("warn", message, context),
  error: (message: string, context?: LogContext) => emit("error", message, context),
  correlationId: generateCorrelationId,
};

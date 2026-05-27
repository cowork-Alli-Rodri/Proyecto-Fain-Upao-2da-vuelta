import { NextResponse } from "next/server";

import { compareSecrets } from "@/lib/auth/secret-compare";
import { jneRefresh } from "@/lib/jne/refresh";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron handler — refresh diario de la data del JNE.
 *
 * Schedule en `vercel.json`: `0 4 * * *` (04:00 UTC = 23:00 Lima).
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Devuelve JSON con un resumen; Sentry captura los errores inesperados.
 * Si JNE falla, la DB conserva la última copia válida (FR-035).
 */
export async function GET(request: Request) {
  const correlationId = logger.correlationId();
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;

  if (!process.env.CRON_SECRET || !compareSecrets(auth, expected)) {
    logger.warn("jne-refresh cron auth failed", { correlationId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("jne-refresh cron started", { correlationId });
  const result = await jneRefresh({ triggeredBy: "cron" });

  if (result.ok) {
    logger.info("jne-refresh cron success", { correlationId, ...result.summary });
    return NextResponse.json({ status: "success", ...result.summary });
  }

  logger.error("jne-refresh cron failed", {
    correlationId,
    code: result.error.code,
    message: result.error.message,
  });
  return NextResponse.json(
    {
      status: "failed",
      error: result.error,
      partial: result.partial ?? null,
    },
    { status: 502 },
  );
}

import { NextResponse } from "next/server";

import { compareSecrets } from "@/lib/auth/secret-compare";
import { refreshFactChecks } from "@/lib/fact-check/refresh";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Refresh de la galería de fact-checks — endpoint de disparo manual / on-demand.
 *
 * NO está agendado en `vercel.json` (plan Hobby = máx 2 crons, ya ocupados por
 * jne-refresh y anonymize). El refresh automático diario va piggyback dentro de
 * `/api/cron/jne-refresh`. Este endpoint queda para correrlo a mano:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/fact-checks-refresh
 * Si en el futuro el proyecto pasa a Pro, basta agregarlo a `vercel.json`.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`.
 * Consulta Google Fact Check Tools e inserta como `published` solo las URLs
 * nuevas. Idempotente: re-correrlo no duplica. Si Google o la DB fallan,
 * la galería conserva lo que ya tenía (degradación suave).
 */
export async function GET(request: Request) {
  const correlationId = logger.correlationId();
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;

  if (!process.env.CRON_SECRET || !compareSecrets(auth, expected)) {
    logger.warn("fact-checks-refresh cron auth failed", { correlationId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("fact-checks-refresh cron started", { correlationId });
  const summary = await refreshFactChecks();

  if (!summary.ok) {
    logger.error("fact-checks-refresh cron failed", {
      correlationId,
      error: summary.error,
    });
    return NextResponse.json({ status: "failed", ...summary }, { status: 502 });
  }

  logger.info("fact-checks-refresh cron success", { correlationId, ...summary });
  return NextResponse.json({ status: "success", ...summary });
}

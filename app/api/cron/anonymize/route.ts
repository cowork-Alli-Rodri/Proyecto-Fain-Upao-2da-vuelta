import { NextResponse } from "next/server";

import { compareSecrets } from "@/lib/auth/secret-compare";
import { anonymizeExpired } from "@/lib/retention/anonymize";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron mensual de anonimización (heartbeat).
 *
 * Schedule en `vercel.json`: `0 5 1 * *` (día 1 del mes, 05:00 UTC = 00:00 Lima).
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Comportamiento esperado: mientras `ciclo_cierre_at + 12 meses > NOW()`,
 * termina sin tocar nada. Cuando se cruza el umbral, anonimiza todos los
 * perfiles pendientes en una sola pasada. Ejecuciones posteriores no
 * afectan a nadie (idempotente por `is_anonymized = true`).
 */
export async function GET(request: Request) {
  const correlationId = logger.correlationId();
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;

  if (!process.env.CRON_SECRET || !compareSecrets(auth, expected)) {
    logger.warn("anonymize cron auth failed", { correlationId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("anonymize cron started", { correlationId });
  const outcome = await anonymizeExpired({ executor: "cron" });

  if (outcome.kind === "error") {
    logger.error("anonymize cron failed", { correlationId, reason: outcome.reason });
    return NextResponse.json(
      { status: "error", reason: outcome.reason },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: outcome.kind, ...outcome });
}

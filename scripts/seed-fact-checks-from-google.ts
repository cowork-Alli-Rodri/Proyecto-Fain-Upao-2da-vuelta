/**
 * Seed / refresh manual de fact_checks usando Google Fact Check Tools API.
 *
 * Reutiliza exactamente la misma lógica que el cron diario
 * (`lib/fact-check/refresh.ts`): consulta varios queries de la Segunda Vuelta
 * 2026, filtra verificaciones recientes con veredicto falso/engañoso e inserta
 * como `published` solo las URLs que aún no existen (idempotente).
 *
 * Uso:
 *   pnpm exec tsx --env-file=.env.local scripts/seed-fact-checks-from-google.ts
 *
 * Variables requeridas:
 *   GOOGLE_FACT_CHECK_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { refreshFactChecks } from "../lib/fact-check/refresh";

async function main() {
  if (!process.env.GOOGLE_FACT_CHECK_API_KEY) {
    console.error("Falta GOOGLE_FACT_CHECK_API_KEY.");
    process.exit(1);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  console.warn("→ Consultando Google Fact Check Tools...");
  const summary = await refreshFactChecks();

  if (!summary.ok) {
    console.error(`Falló: ${summary.error ?? "error desconocido"}`);
    process.exit(1);
  }

  console.warn(
    `OK · ${summary.queriesRun} queries · ${summary.candidates} candidatos · ` +
      `${summary.inserted} nuevos publicados · ${summary.skippedExisting} ya existían.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

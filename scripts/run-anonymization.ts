/**
 * Script CLI: corre el job de anonimización desde terminal.
 *
 * Uso:
 *   pnpm run anonymize:dry-run   # cuenta perfiles afectados sin escribir
 *   pnpm run anonymize           # ejecuta la anonimización real
 *
 * Útil para diagnóstico y para forzar el job antes del próximo heartbeat
 * mensual del cron. Requiere las envs:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { anonymizeExpired } from "../lib/retention/anonymize";

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    process.exit(1);
  }

  const dryRun = hasFlag("dry-run");
  console.warn(dryRun ? "Modo dry-run (no se escribirá en DB)..." : "Ejecutando anonimización...");

  const outcome = await anonymizeExpired({ executor: "cli", dryRun });

  switch (outcome.kind) {
    case "skipped":
      if (outcome.reason === "no_cutoff") {
        console.warn(
          "Sin acción: app_settings.ciclo_cierre_at es NULL. Configúralo desde /admin.",
        );
      } else {
        console.warn(
          `Sin acción: faltan ${msUntil(outcome.thresholdAt!)} para llegar al umbral (${outcome.thresholdAt}).`,
        );
      }
      process.exit(0);
      break;
    case "dry_run":
      console.warn(
        `DRY-RUN · perfiles que serían anonimizados: ${outcome.pending} · umbral: ${outcome.thresholdAt}`,
      );
      process.exit(0);
      break;
    case "done":
      console.warn(
        `OK · perfiles anonimizados: ${outcome.affected} · ciclo cierre: ${outcome.cutoffAt}`,
      );
      process.exit(0);
      break;
    case "error":
      console.error(`FALLO · ${outcome.reason}`);
      process.exit(1);
      break;
  }
}

function msUntil(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return "0 días";
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return `${days} día${days === 1 ? "" : "s"}`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

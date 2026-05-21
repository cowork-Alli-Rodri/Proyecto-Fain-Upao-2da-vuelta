/**
 * Script CLI: ejecuta `jneRefresh` desde terminal para diagnóstico.
 *
 * Uso:
 *   pnpm run jne:refresh
 *
 * Requiere las mismas envs que el cron handler:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Imprime resumen en consola y exit code 0 si success, 1 si failed/partial.
 */

import { jneRefresh } from "../lib/jne/refresh";

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    process.exit(1);
  }

  console.warn("Iniciando refresh JNE...");
  const result = await jneRefresh({ triggeredBy: "cli" });

  if (result.ok) {
    console.warn(
      `OK · candidatos=${result.summary.candidatesUpdated} dimensiones=${result.summary.dimensionsUpdated} duración=${Math.round(result.summary.durationMs / 100) / 10}s`,
    );
    process.exit(0);
  }

  console.error(`FALLO · ${result.error.code}: ${result.error.message}`);
  if (result.partial) {
    console.warn(
      `  parcial · candidatos=${result.partial.candidatesUpdated} dimensiones=${result.partial.dimensionsUpdated}`,
    );
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

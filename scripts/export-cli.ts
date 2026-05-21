/**
 * Script CLI: genera exports del dashboard sin pasar por el navegador.
 *
 * Uso:
 *   pnpm run export -- --format csv --anonymize pseudonym --out ./tmp
 *   pnpm run export -- --format xlsx --anonymize none --out ./tmp
 *   pnpm run export -- --format html --out ./tmp/dashboard.html
 *   pnpm run export -- --format powerbi --out ./tmp/powerbi
 *
 * Útil para auditorías, backups y entregas al docente cuando no se quiere
 * usar la UI. Requiere SUPABASE_SERVICE_ROLE_KEY en el entorno.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { loadExportDataset, type AnonymizeMode } from "../lib/export/dataset";
import { exportPreferenciasCsv, exportRespuestasCsv } from "../lib/export/csv";
import { exportXlsx } from "../lib/export/xlsx";
import { exportHtmlCanva } from "../lib/export/html-canva";
import { exportPbidsManifest, exportPowerBiCsv } from "../lib/export/powerbi";

type Format = "csv" | "xlsx" | "html" | "powerbi";

function arg(name: string): string | null {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function ensureDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}

function ensureDirRaw(dirPath: string): void {
  mkdirSync(dirPath, { recursive: true });
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const formatArg = (arg("format") ?? "csv") as Format;
  const anonymizeArg = (arg("anonymize") ?? "pseudonym") as AnonymizeMode;
  const outRaw = arg("out") ?? "./tmp";
  const out = resolve(process.cwd(), outRaw);

  if (!["csv", "xlsx", "html", "powerbi"].includes(formatArg)) {
    console.error(`Formato inválido: ${formatArg}. Usa csv, xlsx, html, powerbi.`);
    process.exit(1);
  }
  if (!["none", "pseudonym", "full"].includes(anonymizeArg)) {
    console.error(`Modo de anonimización inválido: ${anonymizeArg}.`);
    process.exit(1);
  }

  console.warn(
    `Cargando dataset · formato=${formatArg} · anonymize=${anonymizeArg} · out=${out}`,
  );

  const dataset = await loadExportDataset(
    { facultad: null, carrera: null, ciclo: null, from: null, to: null },
    anonymizeArg,
  );

  console.warn(
    `Dataset listo · profiles=${dataset.profiles.length} answers=${dataset.answers.length} preferences=${dataset.preferences.length}`,
  );

  const ts = new Date().toISOString().replace(/[:.]/g, "-");

  switch (formatArg) {
    case "csv": {
      const respuestasPath = resolve(out, `respuestas-${ts}.csv`);
      const preferenciasPath = resolve(out, `preferencias-${ts}.csv`);
      ensureDir(respuestasPath);
      writeFileSync(respuestasPath, exportRespuestasCsv(dataset), "utf-8");
      writeFileSync(preferenciasPath, exportPreferenciasCsv(dataset), "utf-8");
      console.warn(`OK · ${respuestasPath}`);
      console.warn(`OK · ${preferenciasPath}`);
      break;
    }
    case "xlsx": {
      const xlsxPath = resolve(out, `voto-informado-${ts}.xlsx`);
      ensureDir(xlsxPath);
      const buf = await exportXlsx(dataset);
      writeFileSync(xlsxPath, buf);
      console.warn(`OK · ${xlsxPath}`);
      break;
    }
    case "html": {
      const htmlPath = outRaw.endsWith(".html")
        ? out
        : resolve(out, `dashboard-${ts}.html`);
      ensureDir(htmlPath);
      writeFileSync(htmlPath, exportHtmlCanva(dataset), "utf-8");
      console.warn(`OK · ${htmlPath}`);
      break;
    }
    case "powerbi": {
      ensureDirRaw(out);
      const csvPath = resolve(out, `voto-informado-${ts}.csv`);
      const pbidsPath = resolve(out, `voto-informado-${ts}.pbids`);
      writeFileSync(csvPath, exportPowerBiCsv(dataset), "utf-8");
      writeFileSync(pbidsPath, exportPbidsManifest(), "utf-8");
      console.warn(`OK · ${csvPath}`);
      console.warn(`OK · ${pbidsPath}`);
      break;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

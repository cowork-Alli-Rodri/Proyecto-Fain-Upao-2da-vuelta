/**
 * Script CLI: analiza el output de `next build` y reporta el tamaño de los
 * chunks client. Si el total o algún chunk individual excede el presupuesto,
 * exit 1.
 *
 * Uso:
 *   pnpm run build && pnpm tsx scripts/bundle-budget.ts
 *
 * Next.js 16 + Turbopack no popula `app-build-manifest.json` con el mapeo
 * ruta → chunks. Este script trabaja sobre `.next/static/chunks/` directo:
 *
 *   - TOTAL_BUDGET_KB: tamaño total de todos los chunks JS client (proxy del
 *     peso global del bundle).
 *   - SINGLE_CHUNK_BUDGET_KB: tamaño máximo aceptable de un único chunk
 *     (detecta vendors gigantes que no se code-split bien).
 *
 * Reporta los top 10 chunks más pesados para diagnóstico de optimización.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const TOTAL_BUDGET_KB = 3000; // total de .next/static/chunks (vendor + app)
const SINGLE_CHUNK_BUDGET_KB = 450; // chunk individual más grande aceptable

interface ChunkInfo {
  name: string;
  kb: number;
}

function walkChunks(dir: string, acc: ChunkInfo[]): void {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkChunks(full, acc);
    } else if (f.endsWith(".js")) {
      acc.push({ name: full, kb: st.size / 1024 });
    }
  }
}

function main(): void {
  const buildDir = resolve(process.cwd(), ".next");
  const chunksDir = join(buildDir, "static", "chunks");

  if (!existsSync(chunksDir)) {
    console.error("No se encontró .next/static/chunks/. Corre `pnpm build` primero.");
    process.exit(1);
  }

  const chunks: ChunkInfo[] = [];
  walkChunks(chunksDir, chunks);
  chunks.sort((a, b) => b.kb - a.kb);

  const totalKb = chunks.reduce((acc, c) => acc + c.kb, 0);
  const largest = chunks[0];

  // Detectar formato del manifest (webpack viejo vs Turbopack)
  let runtime = "Turbopack";
  try {
    const manifest = JSON.parse(
      readFileSync(join(buildDir, "build-manifest.json"), "utf-8"),
    ) as { pages?: Record<string, unknown> };
    if (Object.keys(manifest.pages ?? {}).length > 5) {
      runtime = "Webpack";
    }
  } catch {
    // Ignorar
  }

  console.warn(`Bundle analyzer · Runtime: ${runtime}`);
  console.warn(`Chunks JS client: ${chunks.length} archivos · Total: ${totalKb.toFixed(1)} KB`);
  console.warn(`Presupuesto total: ${TOTAL_BUDGET_KB} KB · Chunk máximo: ${SINGLE_CHUNK_BUDGET_KB} KB`);
  console.warn("─".repeat(70));
  console.warn("Top 10 chunks más pesados:");

  for (const c of chunks.slice(0, 10)) {
    const flag = c.kb > SINGLE_CHUNK_BUDGET_KB ? "⚠ " : "  ";
    const rel = c.name.replace(buildDir + "\\", "").replace(buildDir + "/", "");
    console.warn(`${flag}${c.kb.toFixed(1).padStart(8)} KB   ${rel}`);
  }

  console.warn("─".repeat(70));

  const overTotal = totalKb > TOTAL_BUDGET_KB;
  const overSingle = largest && largest.kb > SINGLE_CHUNK_BUDGET_KB;

  if (overTotal) {
    console.error(
      `Bundle total ${totalKb.toFixed(1)} KB excede presupuesto ${TOTAL_BUDGET_KB} KB`,
    );
  }
  if (overSingle) {
    console.error(
      `Chunk más grande ${largest.kb.toFixed(1)} KB excede presupuesto individual ${SINGLE_CHUNK_BUDGET_KB} KB`,
    );
  }

  if (overTotal || overSingle) {
    process.exit(1);
  }

  console.warn("OK — dentro de presupuesto.");
}

main();

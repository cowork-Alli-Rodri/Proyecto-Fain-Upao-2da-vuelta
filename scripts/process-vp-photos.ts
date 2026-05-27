/**
 * Procesa fotos de vicepresidentes:
 * - Resize a max 600px (suficiente para card en split-view)
 * - Convierte PNG/JPEG → WebP (más liviano)
 * - Output a public/pixart/vp/
 *
 * Uso: pnpm tsx scripts/process-vp-photos.ts
 */

import { existsSync, mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

import sharp from "sharp";

const RECURSOS = resolve(process.cwd(), "RECURSOS");
const OUT_DIR = resolve(process.cwd(), "public/pixart/vp");

const VPS: Array<{ input: string; output: string }> = [
  // Keiko's VPs
  { input: resolve(RECURSOS, "GALARRETA PIXART.png"), output: resolve(OUT_DIR, "galarreta.webp") },
  { input: resolve(RECURSOS, "MIGUEL TORRES PIXART.png"), output: resolve(OUT_DIR, "torres.webp") },
  // Roberto's VPs
  { input: resolve(RECURSOS, "Anali marquez PIXART.jpeg"), output: resolve(OUT_DIR, "marquez.webp") },
  { input: resolve(RECURSOS, "Brigida curo PIXART.png"), output: resolve(OUT_DIR, "curo.webp") },
];

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  for (const { input, output } of VPS) {
    if (!existsSync(input)) {
       
      console.error(`Skip (no existe): ${input}`);
      continue;
    }
    // Sin trim, sin cover, sin recortes — la foto se preserva COMPLETA tal
    // como la generó el modelo. Solo se reduce a max 800px de lado mayor y
    // se convierte a WebP. El fit "inside" mantiene la proporción original.
    // En CSS se usa object-contain + container más cuadrado para mostrar
    // toda la figura sin zoom.
    await sharp(input)
      .resize({
        width: 800,
        height: 800,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(output);
    const sz = statSync(output).size;
    console.warn(`✓ ${output}  (${(sz / 1024).toFixed(0)} KB)`);
  }
}

main().catch((err) => {
   
  console.error(err);
  process.exit(1);
});

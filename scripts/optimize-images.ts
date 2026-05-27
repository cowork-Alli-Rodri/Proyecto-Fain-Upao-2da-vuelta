/**
 * Script CLI: optimiza las imágenes de candidatos y partidos a webp 800px.
 *
 * Uso:
 *   pnpm tsx scripts/optimize-images.ts
 *
 * Lee los PNGs originales de `public/candidates/` y `public/parties/`,
 * genera versiones webp redimensionadas para web. Idempotente.
 */

import sharp from "sharp";
import { statSync } from "node:fs";

const targets = [
  { input: "public/candidates/keiko-fujimori.png", output: "public/candidates/keiko-fujimori.webp" },
  { input: "public/candidates/roberto-sanchez.png", output: "public/candidates/roberto-sanchez.webp" },
  { input: "public/parties/fuerza-popular.png", output: "public/parties/fuerza-popular.webp" },
];

async function main() {
  for (const { input, output } of targets) {
    const beforeSize = statSync(input).size;
    await sharp(input)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86 })
      .toFile(output);
    const afterSize = statSync(output).size;
    console.warn(
      `${input} (${(beforeSize / 1024 / 1024).toFixed(1)}MB) -> ${output} (${(afterSize / 1024).toFixed(0)}KB)`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

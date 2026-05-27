/**
 * Procesa los videos animados de los candidatos:
 * - Crop bottom ~12% (elimina marca de agua "Veo 3")
 * - Re-encode a H.264 con audio AAC, optimizado para web
 * - Output a public/pixart/
 *
 * Uso: pnpm tsx scripts/process-candidate-videos.ts
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

import ffmpegPath from "ffmpeg-static";

const RECURSOS = resolve(process.cwd(), "RECURSOS");
const OUT_DIR = resolve(process.cwd(), "public/pixart");

const VIDEOS: Array<{ input: string; output: string; cropBottomPct: number }> = [
  {
    input: resolve(RECURSOS, "Keiko animada.mp4"),
    output: resolve(OUT_DIR, "keiko-animada.mp4"),
    cropBottomPct: 0.12,
  },
  {
    input: resolve(RECURSOS, "Roberto animado.mp4"),
    output: resolve(OUT_DIR, "roberto-animado.mp4"),
    cropBottomPct: 0.12,
  },
];

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolveP, reject) => {
    if (!ffmpegPath) {
      reject(new Error("ffmpeg-static no proporcionó binario."));
      return;
    }
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolveP();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}:\n${stderr.split("\n").slice(-20).join("\n")}`));
      }
    });
  });
}

async function processVideo(input: string, output: string, cropPct: number): Promise<void> {
  if (!existsSync(input)) {
    throw new Error(`Input no encontrado: ${input}`);
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  // Crop: corta del top hasta in_h*(1-cropPct). Eso quita el bottom cropPct.
  // Re-encode H.264 baseline, faststart para streaming, sin audio (es loop decorativo).
  const filter = `crop=in_w:in_h*(1-${cropPct})`;

  const args = [
    "-y",
    "-i", input,
    "-vf", filter,
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "26",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-an", // sin audio
    output,
  ];

  console.warn(`Procesando ${input} → ${output} (crop bottom ${(cropPct * 100).toFixed(0)}%)`);
  await runFfmpeg(args);

  const sz = statSync(output).size;
  console.warn(`  ✓ ${(sz / 1024 / 1024).toFixed(2)} MB`);
}

async function main() {
  if (!ffmpegPath) {
     
    console.error("ffmpeg-static no se instaló correctamente.");
    process.exit(1);
  }
  console.warn(`ffmpeg binary: ${ffmpegPath}`);
  for (const v of VIDEOS) {
    await processVideo(v.input, v.output, v.cropBottomPct);
  }
  console.warn("\nListo. Videos procesados en public/pixart/.");
}

main().catch((err) => {
   
  console.error(err);
  process.exit(1);
});

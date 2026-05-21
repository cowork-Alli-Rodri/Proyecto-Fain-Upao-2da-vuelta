/**
 * Script CLI: analiza el output de `next build` y reporta el tamaño del
 * First Load JS por ruta. Si alguna ruta excede el presupuesto, exit 1.
 *
 * Uso:
 *   pnpm run build && pnpm tsx scripts/bundle-budget.ts
 *
 * Presupuestos (gzipped, "First Load JS shared by all" + ruta):
 *   - Marketing pages (/, /como-funciona):  <= 240 KB
 *   - App pages autenticadas (resto):       <= 320 KB
 *
 * Lee `.next/build-manifest.json` y `.next/required-server-files.json`.
 * Output: tabla con tamaños y banderas de over-budget.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const MARKETING_BUDGET_KB = 240;
const APP_BUDGET_KB = 320;

interface Route {
  path: string;
  type: "marketing" | "app";
  firstLoadKb: number;
  overBudget: boolean;
  budget: number;
}

function isMarketing(routePath: string): boolean {
  return routePath === "/" || routePath.startsWith("/como-funciona");
}

function fileSizeKb(absPath: string): number {
  try {
    const buf = readFileSync(absPath);
    return buf.byteLength / 1024;
  } catch {
    return 0;
  }
}

function main() {
  const buildDir = resolve(process.cwd(), ".next");
  const manifestPath = resolve(buildDir, "build-manifest.json");

  if (!existsSync(manifestPath)) {
    console.error("No se encontró .next/build-manifest.json. Corre `pnpm build` primero.");
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as {
    rootMainFiles?: string[];
    pages: Record<string, string[]>;
  };

  const sharedKb = (manifest.rootMainFiles ?? []).reduce(
    (acc, f) => acc + fileSizeKb(resolve(buildDir, f)),
    0,
  );

  const routes: Route[] = [];

  for (const [routePath, files] of Object.entries(manifest.pages)) {
    if (routePath === "/_app" || routePath === "/_error") continue;

    const routeKb = files.reduce((acc, f) => acc + fileSizeKb(resolve(buildDir, f)), 0);
    const firstLoadKb = sharedKb + routeKb;

    const type = isMarketing(routePath) ? "marketing" : "app";
    const budget = type === "marketing" ? MARKETING_BUDGET_KB : APP_BUDGET_KB;

    routes.push({
      path: routePath,
      type,
      firstLoadKb,
      overBudget: firstLoadKb > budget,
      budget,
    });
  }

  routes.sort((a, b) => b.firstLoadKb - a.firstLoadKb);

  console.warn(
    `Shared chunk: ${sharedKb.toFixed(1)} KB · Presupuestos: marketing=${MARKETING_BUDGET_KB}KB, app=${APP_BUDGET_KB}KB`,
  );
  console.warn("─".repeat(70));
  console.warn("Type  First Load   Budget   Path");
  console.warn("─".repeat(70));

  let anyOver = false;
  for (const r of routes) {
    const flag = r.overBudget ? "⚠ " : "  ";
    console.warn(
      `${flag}${r.type.padEnd(10)} ${r.firstLoadKb.toFixed(1).padStart(7)} KB   ${r.budget.toString().padStart(3)} KB   ${r.path}`,
    );
    if (r.overBudget) anyOver = true;
  }

  if (anyOver) {
    console.error("\nAlguna ruta excede el presupuesto.");
    process.exit(1);
  }
  console.warn("\nOK — todas las rutas dentro de presupuesto.");
}

main();

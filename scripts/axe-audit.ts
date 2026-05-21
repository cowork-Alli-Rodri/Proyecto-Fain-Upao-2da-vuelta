/**
 * Script CLI: corre `@axe-core/playwright` contra rutas críticas y reporta
 * violations agrupadas por impact.
 *
 * Uso:
 *   pnpm dev                            # en una terminal
 *   pnpm tsx scripts/axe-audit.ts       # en otra
 *
 * Exit code 1 si encuentra violations de impact `critical` o `serious`.
 *
 * Requiere instalar `@axe-core/playwright` localmente:
 *   pnpm add -D @axe-core/playwright
 * (no se incluye por defecto para mantener devDeps livianos; se instala
 * solo cuando se va a correr el audit).
 */

import { chromium, type Browser } from "@playwright/test";

const ROUTES = [
  "/",
  "/como-funciona",
  "/login",
  // Las siguientes requieren sesión; el script las omite si no hay cookies.
  // Para auditarlas, exporta SESSION_COOKIE en el entorno.
];

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

interface AxeViolation {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical" | null;
  description: string;
  helpUrl: string;
  nodes: { target: string[]; html: string }[];
}

interface AxeResults {
  violations: AxeViolation[];
}

async function auditRoute(browser: Browser, url: string): Promise<AxeViolation[]> {
  // Import dinámico — el paquete es devDep opcional.
  type AxeBuilderType = new (args: { page: unknown }) => {
    analyze(): Promise<AxeResults>;
  };
  let AxeBuilder: AxeBuilderType;
  try {
    const mod = (await import("@axe-core/playwright" as string)) as unknown as {
      default: AxeBuilderType;
    };
    AxeBuilder = mod.default;
  } catch {
    console.error(
      "Falta @axe-core/playwright. Instala: pnpm add -D @axe-core/playwright",
    );
    process.exit(1);
  }

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page }).analyze();
  await page.close();
  return results.violations;
}

async function main() {
  const browser = await chromium.launch();
  let totalCritical = 0;
  let totalSerious = 0;

  for (const route of ROUTES) {
    const url = `${BASE_URL}${route}`;
    console.warn(`\n→ Auditando ${url}`);
    const violations = await auditRoute(browser, url);

    if (violations.length === 0) {
      console.warn("  OK · sin violations");
      continue;
    }

    const byImpact: Record<string, AxeViolation[]> = {};
    for (const v of violations) {
      const key = v.impact ?? "unknown";
      (byImpact[key] ??= []).push(v);
    }

    for (const impact of ["critical", "serious", "moderate", "minor"]) {
      const list = byImpact[impact];
      if (!list || list.length === 0) continue;
      console.warn(`  [${impact}] ${list.length} regla(s):`);
      for (const v of list) {
        console.warn(`    • ${v.id} — ${v.description} (${v.nodes.length} nodos)`);
        console.warn(`      ${v.helpUrl}`);
      }
      if (impact === "critical") totalCritical += list.length;
      if (impact === "serious") totalSerious += list.length;
    }
  }

  await browser.close();

  console.warn(
    `\nResumen · critical=${totalCritical} · serious=${totalSerious}`,
  );

  if (totalCritical > 0 || totalSerious > 0) {
    console.error("FALLA · corrige las violaciones critical/serious antes de release.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

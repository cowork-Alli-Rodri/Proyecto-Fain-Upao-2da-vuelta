/**
 * Unit tests — HTML Canva export (T082).
 *
 * Verifica:
 *  - HTML autocontenido (DOCTYPE + <html lang="es-PE">)
 *  - Bloques con data-canva-block (FR-028a)
 *  - <script type="application/json" id="dataset"> con payload válido
 *  - KPIs renderizados con números correctos
 *  - Dataset vacío no rompe (KPIs en cero)
 */

import { describe, expect, it } from "vitest";

import { exportHtmlCanva } from "@/lib/export/html-canva";
import { emptyDataset, sampleDataset } from "./fixtures";

describe("export HTML Canva (T082)", () => {
  it("genera HTML autocontenido con DOCTYPE y lang es-PE", () => {
    const out = exportHtmlCanva(sampleDataset());
    expect(out).toMatch(/^<!DOCTYPE html>/);
    expect(out).toContain('<html lang="es-PE">');
  });

  it("incluye bloques data-canva-block para que Canva los detecte editables (FR-028a)", () => {
    const out = exportHtmlCanva(sampleDataset());
    expect(out).toContain('data-canva-block="title"');
    expect(out).toContain('data-canva-block="kpis"');
    expect(out).toContain('data-canva-block="preferencia-distribution"');
    expect(out).toContain('data-canva-block="por-carrera"');
  });

  it("embebe dataset crudo en <script type=\"application/json\" id=\"dataset\">", () => {
    const out = exportHtmlCanva(sampleDataset());
    const match = out.match(
      /<script type="application\/json" id="dataset">([\s\S]*?)<\/script>/,
    );
    expect(match).not.toBeNull();
    const payload = JSON.parse(match![1] ?? "{}");
    expect(payload).toHaveProperty("generatedAt");
    expect(payload).toHaveProperty("distribution");
    expect(payload.distribution).toHaveLength(3);
    expect(payload.preferences).toBe(2);
  });

  it("KPIs reflejan los conteos del dataset (2 inscritos, 2 completados, 2 preferencias)", () => {
    const out = exportHtmlCanva(sampleDataset());
    // Conteos como <p class="kpi-value">N</p>
    expect(out).toMatch(/kpi-value">2</);
  });

  it("dataset vacío produce HTML válido sin romper, con todos los conteos en 0", () => {
    const out = exportHtmlCanva(emptyDataset());
    expect(out).toContain("<!DOCTYPE html>");
    expect(out).toContain("Sin datos aún");
    expect(out).toMatch(/kpi-value">0</);
  });

  it("escapa correctamente caracteres HTML peligrosos en datos del dataset", () => {
    const ds = sampleDataset("pseudonym");
    ds.preferences[0]!.motivo = "<script>alert(1)</script>";
    const out = exportHtmlCanva(ds);
    // El motivo NO aparece en el HTML renderizado (es solo dataset agregado),
    // pero el payload JSON sí lo trae. Verificamos que el HTML general
    // tampoco interpole <script> peligrosos en headings.
    expect(out).not.toContain("<script>alert(1)</script>");
  });
});

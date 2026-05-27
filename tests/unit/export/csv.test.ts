/**
 * Unit tests — CSV export (T082).
 *
 * Verifica:
 *  - dataset vacío → mensaje "sin datos aún" + headers válidos (FR-029)
 *  - dataset con datos → BOM UTF-8 + columnas esperadas + valor JSON serializado
 *  - modo `none` expone email/nombre; modo `pseudonym`/`full` los oculta
 */

import { describe, expect, it } from "vitest";

import { exportPreferenciasCsv, exportRespuestasCsv } from "@/lib/export/csv";
import { emptyDataset, sampleDataset } from "./fixtures";

describe("export CSV (T082)", () => {
  it("respuestas vacías retornan mensaje 'sin datos aún' + headers (FR-029)", () => {
    const out = exportRespuestasCsv(emptyDataset());
    expect(out).toContain("sin datos aún");
    expect(out).toContain("student_pseudo");
    // BOM UTF-8 inicial
    expect(out.charCodeAt(0)).toBe(0xfeff);
  });

  it("preferencias vacías retornan mensaje 'sin preferencias aún'", () => {
    const out = exportPreferenciasCsv(emptyDataset());
    expect(out).toContain("sin preferencias aún");
    expect(out).toContain("student_pseudo");
  });

  it("respuestas con datos serializan el valor JSON como string", () => {
    const ds = sampleDataset("pseudonym");
    const out = exportRespuestasCsv(ds);
    expect(out).toContain("anon-aaaaaaaaaaaa");
    expect(out).toContain("social");
    expect(out).toContain("likert");
    // Valor likert serializado (Papa.unparse escapa las comillas)
    expect(out).toMatch(/"value"":4|"value":4/);
  });

  it("preferencias con anonimización 'pseudonym' NO expone email ni nombre", () => {
    const ds = sampleDataset("pseudonym");
    const out = exportPreferenciasCsv(ds);
    expect(out).not.toContain("ana@upao.edu.pe");
    expect(out).not.toContain("Ana");
    expect(out).not.toContain("Pérez");
    expect(out).toContain("anon-aaaaaaaaaaaa");
    expect(out).toContain("keiko");
    expect(out).toContain("roberto");
  });

  it("preferencias con anonimización 'none' SÍ expone email y nombre", () => {
    const ds = sampleDataset("none");
    const out = exportPreferenciasCsv(ds);
    expect(out).toContain("ana@upao.edu.pe");
    expect(out).toContain("Ana");
    expect(out).toContain("bruno@upao.edu.pe");
  });

  it("preferencias con anonimización 'full' oculta el motivo", () => {
    const ds = sampleDataset("full");
    const out = exportPreferenciasCsv(ds);
    expect(out).not.toContain("Confío en su trayectoria");
    expect(out).not.toContain("Plan social más sólido");
  });
});

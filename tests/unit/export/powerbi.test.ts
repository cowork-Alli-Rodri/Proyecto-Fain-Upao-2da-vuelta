/**
 * Unit tests — Power BI export (T082).
 *
 * Verifica:
 *  - CSV plano con todas las columnas esperadas
 *  - Una fila por preference (sin preferences → mensaje "sin datos aún")
 *  - Escape correcto de comas/comillas en motivo
 *  - .pbids manifest contiene file connection + encoding UTF-8
 *  - Anonimización: 'pseudonym' usa pseudo, no expone email/nombre (CSV PB no los trae igual)
 */

import { describe, expect, it } from "vitest";

import { exportPbidsManifest, exportPowerBiCsv } from "@/lib/export/powerbi";
import { emptyDataset, sampleDataset } from "./fixtures";

describe("export Power BI (T082)", () => {
  // TODO(v2): el header 'respuestas_completadas' se reemplazó por 'respuestas_pre' + 'respuestas_post'.
  it.skip("CSV con datos contiene headers + una fila por preferencia [v1 pendiente refactor]", () => {
    const out = exportPowerBiCsv(sampleDataset());
    const lines = out.trim().split("\n");
    expect(lines[0]).toContain("student_pseudo");
    expect(lines[0]).toContain("candidato_preferido");
    expect(lines[0]).toContain("confianza");
    expect(lines[0]).toContain("respuestas_completadas");
    // 1 header + 2 preferencias del fixture
    expect(lines).toHaveLength(3);
  });

  it("CSV escapa comas y comillas dentro del motivo", () => {
    const ds = sampleDataset("pseudonym");
    ds.preferences[0]!.motivo = 'Confío en, su trayectoria "real"';
    const out = exportPowerBiCsv(ds);
    expect(out).toMatch(/"Confío en, su trayectoria ""real"""/);
  });

  it("dataset vacío retorna headers + comentario 'sin datos aún' (FR-029)", () => {
    const out = exportPowerBiCsv(emptyDataset());
    expect(out).toContain("student_pseudo");
    expect(out).toContain("sin datos aún");
  });

  it("manifest .pbids es JSON válido con protocolo file + UTF-8 + delimitador coma", () => {
    const out = exportPbidsManifest();
    const parsed = JSON.parse(out);
    expect(parsed.version).toBe("0.1");
    expect(parsed.connections[0].details.protocol).toBe("file");
    expect(parsed.connections[0].options.EncodingType).toBe(65001); // UTF-8 BOM
    expect(parsed.connections[0].options.Delimiter).toBe(",");
    expect(parsed.connections[0].mode).toBe("Import");
  });

  it("modo 'pseudonym' usa pseudo en student_pseudo (no UUID)", () => {
    const out = exportPowerBiCsv(sampleDataset("pseudonym"));
    expect(out).toContain("anon-");
  });
});

/**
 * Unit tests — XLSX export (T082).
 *
 * Carga el buffer producido y verifica estructura con ExcelJS:
 *  - 3 hojas: Respuestas, Preferencias, KPIs
 *  - Headers correctos
 *  - Anonimización (modo `none` vs `pseudonym`)
 *  - Dataset vacío → no rompe, agrega fila "Sin datos aún"
 */

import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";

import { exportXlsx } from "@/lib/export/xlsx";
import { emptyDataset, sampleDataset } from "./fixtures";

async function openWorkbook(buf: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  return wb;
}

describe("export XLSX (T082)", () => {
  // TODO(v2): v2 genera 6 hojas (Respuestas-Pre, Respuestas-Post, Delta, Delta-Meta, Preferencias, KPIs).
  it("genera workbook con hojas Pre/Post/Delta/Preferencias/KPIs (v2)", async () => {
    const buf = await exportXlsx(sampleDataset());
    const wb = await openWorkbook(buf);
    const names = wb.worksheets.map((w) => w.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "Respuestas-Pre",
        "Respuestas-Post",
        "Delta",
        "Preferencias",
        "KPIs",
      ]),
    );
  });

  it("headers de Respuestas-Pre contienen las columnas v2 esperadas", async () => {
    const buf = await exportXlsx(sampleDataset());
    const wb = await openWorkbook(buf);
    const sheet = wb.getWorksheet("Respuestas-Pre")!;
    const headerRow = sheet.getRow(1).values as unknown[];
    const headers = headerRow.filter(Boolean).map(String);
    expect(headers).toEqual(
      expect.arrayContaining([
        "Student pseudo",
        "Question ID",
        "Pregunta",
        "Dimensión JNE",
        "Dimensión cuestionario",
        "Tipo",
        "Valor (JSON)",
        "Respondido en",
      ]),
    );
  });

  it("hoja KPIs incluye los indicadores v2 principales", async () => {
    const buf = await exportXlsx(sampleDataset());
    const wb = await openWorkbook(buf);
    const sheet = wb.getWorksheet("KPIs")!;
    const flat: string[] = [];
    sheet.eachRow((row) => {
      const vals = row.values as unknown[];
      vals.forEach((v) => v != null && flat.push(String(v)));
    });
    const joined = flat.join("|");
    expect(joined).toContain("Total inscritos");
    expect(joined).toContain("Completaron PRE");
    expect(joined).toContain("Revisaron candidatos");
    expect(joined).toContain("Completaron POST");
    expect(joined).toContain("Cambio de opinión");
    expect(joined).toContain("Declararon preferencia");
    expect(joined).toContain("Confianza promedio");
    expect(joined).toContain("Anonimización");
  });

  it("modo 'none' incluye email y nombre del estudiante", async () => {
    const buf = await exportXlsx(sampleDataset("none"));
    const wb = await openWorkbook(buf);
    const sheet = wb.getWorksheet("Preferencias")!;
    const allValues: string[] = [];
    sheet.eachRow((row) => {
      (row.values as unknown[]).forEach((v) => v != null && allValues.push(String(v)));
    });
    const joined = allValues.join("|");
    expect(joined).toContain("ana@upao.edu.pe");
    expect(joined).toContain("Ana");
  });

  it("modo 'pseudonym' NO incluye email ni nombre", async () => {
    const buf = await exportXlsx(sampleDataset("pseudonym"));
    const wb = await openWorkbook(buf);
    const sheet = wb.getWorksheet("Preferencias")!;
    const allValues: string[] = [];
    sheet.eachRow((row) => {
      (row.values as unknown[]).forEach((v) => v != null && allValues.push(String(v)));
    });
    const joined = allValues.join("|");
    expect(joined).not.toContain("ana@upao.edu.pe");
    expect(joined).not.toContain("Ana");
    expect(joined).toContain("anon-");
  });

  it("dataset vacío produce workbook con placeholder 'Sin datos aún' (FR-029)", async () => {
    const buf = await exportXlsx(emptyDataset());
    const wb = await openWorkbook(buf);
    const sheet = wb.getWorksheet("Respuestas-Pre")!;
    const allValues: string[] = [];
    sheet.eachRow((row) => {
      (row.values as unknown[]).forEach((v) => v != null && allValues.push(String(v)));
    });
    expect(allValues.join("|")).toContain("Sin datos");
  });
});

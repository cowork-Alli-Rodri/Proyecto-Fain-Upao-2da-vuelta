import ExcelJS from "exceljs";

import type { ExportDataset } from "./dataset";

const HEADER_FILL = "FF002855"; // navy UPAO

function ensureNonEmpty<T>(rows: T[], fallback: T): T[] {
  return rows.length > 0 ? rows : [fallback];
}

export async function exportXlsx(ds: ExportDataset): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Voto Informado UPAO";
  wb.created = new Date(ds.generatedAt);

  const profByPseudo = new Map(ds.profiles.map((p) => [p.pseudo, p]));

  // Hoja: Respuestas
  const respuestasSheet = wb.addWorksheet("Respuestas");
  respuestasSheet.columns = [
    { header: "Student pseudo", key: "student_pseudo", width: 18 },
    { header: "Question ID", key: "question_id", width: 36 },
    { header: "Pregunta", key: "pregunta", width: 50 },
    { header: "Dimensión", key: "dimension", width: 14 },
    { header: "Tipo", key: "tipo", width: 12 },
    { header: "Valor (JSON)", key: "valor", width: 40 },
    { header: "Respondido en", key: "responded_at", width: 22 },
  ];
  const respuestasRows =
    ds.answers.length > 0
      ? ds.answers.map((a) => ({
          student_pseudo: a.student_pseudo,
          question_id: a.question_id,
          pregunta: a.question_snapshot,
          dimension: a.dimension_snapshot,
          tipo: a.tipo_snapshot,
          valor: JSON.stringify(a.valor),
          responded_at: a.responded_at,
        }))
      : [{
          student_pseudo: "Sin datos aún",
          question_id: "",
          pregunta: "",
          dimension: "",
          tipo: "",
          valor: "",
          responded_at: ds.generatedAt,
        }];
  respuestasSheet.addRows(respuestasRows);

  // Hoja: Preferencias
  const prefSheet = wb.addWorksheet("Preferencias");
  prefSheet.columns = [
    { header: "Student pseudo", key: "student_pseudo", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Nombre", key: "nombre", width: 28 },
    { header: "Facultad", key: "facultad", width: 28 },
    { header: "Carrera", key: "carrera", width: 28 },
    { header: "Ciclo", key: "ciclo", width: 8 },
    { header: "Rango edad", key: "rango_edad", width: 12 },
    { header: "Género", key: "genero", width: 12 },
    { header: "Orden compar.", key: "compare_order_at_submit", width: 16 },
    { header: "Candidato", key: "candidato", width: 14 },
    { header: "Confianza (1-10)", key: "confianza", width: 14 },
    { header: "Motivo", key: "motivo", width: 50 },
    { header: "Enviado en", key: "submitted_at", width: 22 },
  ];
  const prefRowsData =
    ds.preferences.length > 0
      ? ds.preferences.map((p) => {
          const prof = profByPseudo.get(p.student_pseudo);
          return {
            student_pseudo: p.student_pseudo,
            email: prof?.email ?? "",
            nombre: prof?.nombres
              ? `${prof.nombres} ${prof.apellidos ?? ""}`.trim()
              : "",
            facultad: prof?.facultad ?? "",
            carrera: prof?.carrera ?? "",
            ciclo: prof?.ciclo ?? "",
            rango_edad: prof?.rango_edad ?? "",
            genero: prof?.genero ?? "",
            compare_order_at_submit: p.compare_order_at_submit,
            candidato: p.candidato_preferido,
            confianza: p.confianza,
            motivo: p.motivo ?? "",
            submitted_at: p.submitted_at,
          };
        })
      : ensureNonEmpty([], {
          student_pseudo: "Sin preferencias aún",
          email: "",
          nombre: "",
          facultad: "",
          carrera: "",
          ciclo: "",
          rango_edad: "",
          genero: "",
          compare_order_at_submit: "",
          candidato: "",
          confianza: "",
          motivo: "",
          submitted_at: ds.generatedAt,
        });
  prefSheet.addRows(prefRowsData);

  // Hoja: KPIs
  const kpiSheet = wb.addWorksheet("KPIs");
  kpiSheet.columns = [
    { header: "KPI", key: "k", width: 32 },
    { header: "Valor", key: "v", width: 16 },
  ];
  const total_inscritos = ds.profiles.length;
  const total_completados = ds.profiles.filter((p) => p.questionnaire_completed_at).length;
  const total_preferencias = ds.preferences.length;
  const confianzas = ds.preferences.map((p) => p.confianza);
  const confianzaProm =
    confianzas.length > 0
      ? Math.round((confianzas.reduce((a, b) => a + b, 0) / confianzas.length) * 100) / 100
      : null;
  kpiSheet.addRows([
    { k: "Total inscritos", v: total_inscritos },
    { k: "Total completaron cuestionario", v: total_completados },
    { k: "Total declararon preferencia", v: total_preferencias },
    { k: "Completaron sin preferencia", v: Math.max(0, total_completados - total_preferencias) },
    { k: "Confianza promedio (1-10)", v: confianzaProm ?? "—" },
    { k: "Generado en (ISO)", v: ds.generatedAt },
    { k: "Anonimización", v: ds.anonymize },
  ]);

  // Estilos al header (en las 3 hojas)
  for (const sheet of [respuestasSheet, prefSheet, kpiSheet]) {
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

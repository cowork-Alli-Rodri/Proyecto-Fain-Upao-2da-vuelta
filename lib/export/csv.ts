import Papa from "papaparse";

import type { ExportDataset } from "./dataset";

const BOM = "﻿";

export function exportRespuestasCsv(ds: ExportDataset): string {
  if (ds.preferences.length === 0 && ds.answers.length === 0) {
    return BOM + `# sin datos aún — generado ${ds.generatedAt}\nstudent_pseudo,question_id\n`;
  }
  const rows = ds.answers.map((a) => ({
    student_pseudo: a.student_pseudo,
    question_id: a.question_id,
    pregunta: a.question_snapshot,
    dimension: a.dimension_snapshot,
    tipo: a.tipo_snapshot,
    valor: JSON.stringify(a.valor),
    responded_at: a.responded_at,
  }));
  return BOM + Papa.unparse(rows, { quotes: true });
}

export function exportPreferenciasCsv(ds: ExportDataset): string {
  if (ds.preferences.length === 0) {
    return BOM + `# sin preferencias aún — generado ${ds.generatedAt}\nstudent_pseudo,candidato\n`;
  }
  const profByPseudo = new Map(ds.profiles.map((p) => [p.pseudo, p]));
  const rows = ds.preferences.map((p) => {
    const prof = profByPseudo.get(p.student_pseudo);
    return {
      student_pseudo: p.student_pseudo,
      student_email: prof?.email ?? "",
      student_nombre: prof?.nombres ? `${prof.nombres} ${prof.apellidos ?? ""}`.trim() : "",
      facultad: prof?.facultad ?? "",
      carrera: prof?.carrera ?? "",
      ciclo: prof?.ciclo ?? "",
      rango_edad: prof?.rango_edad ?? "",
      genero: prof?.genero ?? "",
      compare_order_at_submit: p.compare_order_at_submit,
      candidato_preferido: p.candidato_preferido,
      confianza: p.confianza,
      motivo: p.motivo ?? "",
      submitted_at: p.submitted_at,
    };
  });
  return BOM + Papa.unparse(rows, { quotes: true });
}

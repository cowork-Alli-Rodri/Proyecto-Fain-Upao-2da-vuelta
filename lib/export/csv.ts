import Papa from "papaparse";

import { pivotAnswersByStudent, type ExportDataset } from "./dataset";

const BOM = "﻿";

export function exportRespuestasCsv(ds: ExportDataset): string {
  if (ds.preferences.length === 0 && ds.answers.length === 0) {
    return BOM + `# sin datos aún — generado ${ds.generatedAt}\nstudent_pseudo,question_id\n`;
  }
  const includeIdentity = ds.anonymize === "none";
  const profByPseudo = new Map(ds.profiles.map((p) => [p.pseudo, p]));
  const rows = ds.answers.map((a) => {
    const prof = includeIdentity ? profByPseudo.get(a.student_pseudo) : null;
    return {
      student_pseudo: a.student_pseudo,
      ...(includeIdentity
        ? {
            email: prof?.email ?? "",
            nombre: prof?.nombres
              ? `${prof.nombres} ${prof.apellidos ?? ""}`.trim()
              : "",
          }
        : {}),
      question_id: a.question_id,
      pregunta: a.question_snapshot,
      dimension_jne: a.dimension_snapshot,
      dimension_cuestionario: a.dimension_cuestionario_snapshot ?? "",
      tipo: a.tipo_snapshot,
      momento: a.momento_snapshot,
      valor: JSON.stringify(a.valor),
      responded_at: a.responded_at,
    };
  });
  return BOM + Papa.unparse(rows, { quotes: true });
}

/**
 * Export wide: una fila por estudiante, columnas dinámicas por pregunta:
 *   student_pseudo | q{ord}_pre | q{ord}_post | q{ord}_delta | ...
 *
 * Solo incluye preguntas con momento_snapshot 'pre' AND 'post' presentes en al
 * menos algún estudiante (las legítimamente 'both'). Para post-only no hay pre.
 */
export function exportDeltaCsv(ds: ExportDataset): string {
  if (ds.answers.length === 0) {
    return BOM + `# sin datos aún — generado ${ds.generatedAt}\nstudent_pseudo\n`;
  }

  const pivoted = pivotAnswersByStudent(ds.answers);

  // Collect all distinct question_ids ordered by first appearance
  const questionIds: string[] = [];
  const seen = new Set<string>();
  for (const a of ds.answers) {
    if (!seen.has(a.question_id)) {
      seen.add(a.question_id);
      questionIds.push(a.question_id);
    }
  }

  const rows: Array<Record<string, string | number | null>> = [];
  for (const [studentPseudo, byQ] of pivoted.entries()) {
    const row: Record<string, string | number | null> = { student_pseudo: studentPseudo };
    questionIds.forEach((qid, i) => {
      const cell = byQ.get(qid);
      const idx = i + 1;
      row[`q${idx}_pre`] = cell?.pre !== null && cell?.pre !== undefined ? JSON.stringify(cell.pre) : "";
      row[`q${idx}_post`] = cell?.post !== null && cell?.post !== undefined ? JSON.stringify(cell.post) : "";
      row[`q${idx}_delta`] = cell?.delta ?? "";
    });
    rows.push(row);
  }

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
      candidato_preferido: p.candidato_preferido,
      confianza: p.confianza,
      motivo: p.motivo ?? "",
      submitted_at: p.submitted_at,
    };
  });
  return BOM + Papa.unparse(rows, { quotes: true });
}

import ExcelJS from "exceljs";

import { pivotAnswersByStudent, type ExportDataset } from "./dataset";

const HEADER_FILL = "FF002855"; // navy UPAO

function ensureNonEmpty<T>(rows: T[], fallback: T): T[] {
  return rows.length > 0 ? rows : [fallback];
}

export async function exportXlsx(ds: ExportDataset): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Voto Informado e Instruido · FAIN-UPAO";
  wb.created = new Date(ds.generatedAt);

  const profByPseudo = new Map(ds.profiles.map((p) => [p.pseudo, p]));
  const includeIdentity = ds.anonymize === "none";

  // ============================================================
  // Hoja: Respuestas Pre
  // ============================================================
  const preSheet = wb.addWorksheet("Respuestas-Pre");
  const respuestasCols = [
    { header: "Student pseudo", key: "student_pseudo", width: 18 },
    ...(includeIdentity
      ? [
          { header: "Email", key: "email", width: 28 },
          { header: "Nombre", key: "nombre", width: 28 },
        ]
      : []),
    { header: "Question ID", key: "question_id", width: 36 },
    { header: "Pregunta", key: "pregunta", width: 50 },
    { header: "Dimensión JNE", key: "dimension_jne", width: 16 },
    { header: "Dimensión cuestionario", key: "dimension_cuestionario", width: 20 },
    { header: "Tipo", key: "tipo", width: 12 },
    { header: "Valor (JSON)", key: "valor", width: 30 },
    { header: "Respondido en", key: "responded_at", width: 22 },
  ];
  preSheet.columns = respuestasCols;
  const preRows = ds.answers
    .filter((a) => a.momento_snapshot === "pre")
    .map((a) => {
      const prof = includeIdentity ? profByPseudo.get(a.student_pseudo) : null;
      return {
        student_pseudo: a.student_pseudo,
        ...(includeIdentity
          ? {
              email: prof?.email ?? "",
              nombre: prof?.nombres ? `${prof.nombres} ${prof.apellidos ?? ""}`.trim() : "",
            }
          : {}),
        question_id: a.question_id,
        pregunta: a.question_snapshot,
        dimension_jne: a.dimension_snapshot,
        dimension_cuestionario: a.dimension_cuestionario_snapshot ?? "",
        tipo: a.tipo_snapshot,
        valor: JSON.stringify(a.valor),
        responded_at: a.responded_at,
      };
    });
  preSheet.addRows(
    preRows.length > 0
      ? preRows
      : [
          {
            student_pseudo: "Sin datos aún",
            ...(includeIdentity ? { email: "", nombre: "" } : {}),
            question_id: "",
            pregunta: "",
            dimension_jne: "",
            dimension_cuestionario: "",
            tipo: "",
            valor: "",
            responded_at: ds.generatedAt,
          },
        ],
  );

  // ============================================================
  // Hoja: Respuestas Post
  // ============================================================
  const postSheet = wb.addWorksheet("Respuestas-Post");
  postSheet.columns = respuestasCols;
  const postRows = ds.answers
    .filter((a) => a.momento_snapshot === "post")
    .map((a) => {
      const prof = includeIdentity ? profByPseudo.get(a.student_pseudo) : null;
      return {
        student_pseudo: a.student_pseudo,
        ...(includeIdentity
          ? {
              email: prof?.email ?? "",
              nombre: prof?.nombres ? `${prof.nombres} ${prof.apellidos ?? ""}`.trim() : "",
            }
          : {}),
        question_id: a.question_id,
        pregunta: a.question_snapshot,
        dimension_jne: a.dimension_snapshot,
        dimension_cuestionario: a.dimension_cuestionario_snapshot ?? "",
        tipo: a.tipo_snapshot,
        valor: JSON.stringify(a.valor),
        responded_at: a.responded_at,
      };
    });
  postSheet.addRows(
    postRows.length > 0
      ? postRows
      : [
          {
            student_pseudo: "Sin datos aún",
            ...(includeIdentity ? { email: "", nombre: "" } : {}),
            question_id: "",
            pregunta: "",
            dimension_jne: "",
            dimension_cuestionario: "",
            tipo: "",
            valor: "",
            responded_at: ds.generatedAt,
          },
        ],
  );

  // ============================================================
  // Hoja: Delta (pivot wide pre/post/delta por pregunta)
  // ============================================================
  const deltaSheet = wb.addWorksheet("Delta");
  const pivoted = pivotAnswersByStudent(ds.answers);

  // Collect unique question_ids preserving order
  const questionIds: string[] = [];
  const qSeen = new Set<string>();
  const qMeta = new Map<string, { snapshot: string; tipo: string }>();
  for (const a of ds.answers) {
    if (!qSeen.has(a.question_id)) {
      qSeen.add(a.question_id);
      questionIds.push(a.question_id);
      qMeta.set(a.question_id, { snapshot: a.question_snapshot, tipo: a.tipo_snapshot });
    }
  }

  const deltaCols: Array<{ header: string; key: string; width: number }> = [
    { header: "Student pseudo", key: "student_pseudo", width: 18 },
    ...(includeIdentity
      ? [
          { header: "Email", key: "email", width: 28 },
          { header: "Nombre", key: "nombre", width: 28 },
        ]
      : []),
  ];
  questionIds.forEach((_qid, i) => {
    const idx = i + 1;
    deltaCols.push(
      { header: `Q${idx} Pre`, key: `q${idx}_pre`, width: 12 },
      { header: `Q${idx} Post`, key: `q${idx}_post`, width: 12 },
      { header: `Q${idx} Δ`, key: `q${idx}_delta`, width: 8 },
    );
  });
  deltaSheet.columns = deltaCols;

  const deltaRows = Array.from(pivoted.entries()).map(([pseudo, byQ]) => {
    const prof = includeIdentity ? profByPseudo.get(pseudo) : null;
    const row: Record<string, string | number> = {
      student_pseudo: pseudo,
      ...(includeIdentity
        ? {
            email: prof?.email ?? "",
            nombre: prof?.nombres ? `${prof.nombres} ${prof.apellidos ?? ""}`.trim() : "",
          }
        : {}),
    };
    questionIds.forEach((qid, i) => {
      const cell = byQ.get(qid);
      const idx = i + 1;
      row[`q${idx}_pre`] = cell?.pre !== null && cell?.pre !== undefined ? JSON.stringify(cell.pre) : "";
      row[`q${idx}_post`] = cell?.post !== null && cell?.post !== undefined ? JSON.stringify(cell.post) : "";
      row[`q${idx}_delta`] = cell?.delta ?? "";
    });
    return row;
  });
  deltaSheet.addRows(
    deltaRows.length > 0
      ? deltaRows
      : [
          {
            student_pseudo: "Sin pivot aún",
            ...(includeIdentity ? { email: "", nombre: "" } : {}),
          },
        ],
  );

  // Hoja meta para Delta: lista de preguntas con su orden
  const metaSheet = wb.addWorksheet("Delta-Meta");
  metaSheet.columns = [
    { header: "Columna #", key: "col", width: 10 },
    { header: "Question ID", key: "qid", width: 38 },
    { header: "Enunciado", key: "snapshot", width: 70 },
    { header: "Tipo", key: "tipo", width: 12 },
  ];
  questionIds.forEach((qid, i) => {
    const meta = qMeta.get(qid);
    metaSheet.addRow({
      col: `Q${i + 1}`,
      qid,
      snapshot: meta?.snapshot ?? "",
      tipo: meta?.tipo ?? "",
    });
  });

  // ============================================================
  // Hoja: Preferencias
  // ============================================================
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
            nombre: prof?.nombres ? `${prof.nombres} ${prof.apellidos ?? ""}`.trim() : "",
            facultad: prof?.facultad ?? "",
            carrera: prof?.carrera ?? "",
            ciclo: prof?.ciclo ?? "",
            rango_edad: prof?.rango_edad ?? "",
            genero: prof?.genero ?? "",
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
          candidato: "",
          confianza: "",
          motivo: "",
          submitted_at: ds.generatedAt,
        });
  prefSheet.addRows(prefRowsData);

  // ============================================================
  // Hoja: KPIs
  // ============================================================
  const kpiSheet = wb.addWorksheet("KPIs");
  kpiSheet.columns = [
    { header: "KPI", key: "k", width: 36 },
    { header: "Valor", key: "v", width: 16 },
  ];
  const total_inscritos = ds.profiles.length;
  const total_pre = ds.profiles.filter((p) => p.questionnaire_pre_completed_at).length;
  const total_cand = ds.profiles.filter((p) => p.candidatos_completed_at).length;
  const total_post = ds.profiles.filter((p) => p.questionnaire_post_completed_at).length;
  const total_preferencias = ds.preferences.length;
  const confianzas = ds.preferences.map((p) => p.confianza);
  const confianzaProm =
    confianzas.length > 0
      ? Math.round((confianzas.reduce((a, b) => a + b, 0) / confianzas.length) * 100) / 100
      : null;

  // % cambio opinión: estudiantes con al menos 1 delta != 0
  const studentsChanged = new Set<string>();
  const studentsWithBoth = new Set<string>();
  for (const [pseudo, byQ] of pivoted.entries()) {
    let hasBoth = false;
    let hasChange = false;
    for (const cell of byQ.values()) {
      if (cell.delta !== null) {
        hasBoth = true;
        if (cell.delta !== 0) hasChange = true;
      }
    }
    if (hasBoth) studentsWithBoth.add(pseudo);
    if (hasChange) studentsChanged.add(pseudo);
  }
  const opinionChangeRate =
    studentsWithBoth.size > 0
      ? Math.round((studentsChanged.size / studentsWithBoth.size) * 1000) / 10
      : 0;

  kpiSheet.addRows([
    { k: "Total inscritos", v: total_inscritos },
    { k: "Completaron PRE", v: total_pre },
    { k: "Revisaron candidatos (4/4 dim.)", v: total_cand },
    { k: "Completaron POST", v: total_post },
    { k: "Cambio de opinión (% con al menos 1 cambio)", v: `${opinionChangeRate}%` },
    { k: "Declararon preferencia", v: total_preferencias },
    { k: "Completaron POST sin preferencia", v: Math.max(0, total_post - total_preferencias) },
    { k: "Confianza promedio (1-10)", v: confianzaProm ?? "—" },
    { k: "Generado en (ISO)", v: ds.generatedAt },
    { k: "Anonimización", v: ds.anonymize },
  ]);

  // Estilos al header (todas las hojas)
  for (const sheet of [preSheet, postSheet, deltaSheet, metaSheet, prefSheet, kpiSheet]) {
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

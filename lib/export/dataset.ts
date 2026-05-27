/**
 * Carga el dataset común que alimenta los 4 formatos de export.
 * Aplica anonimización según el modo seleccionado.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { DashboardFilters } from "@/lib/dashboard/filters";
import { createHash } from "node:crypto";

export type AnonymizeMode = "none" | "pseudonym" | "full";

export interface ExportProfile {
  id: string;
  pseudo: string;
  email: string | null;
  nombres: string | null;
  apellidos: string | null;
  facultad: string | null;
  carrera: string | null;
  ciclo: number | null;
  rango_edad: string | null;
  genero: string | null;
  /** Legacy v1 — mantiene compatibilidad. En v2 lo reemplaza current_step_pre/post. */
  current_step: number;
  /** Legacy v1 — alias de questionnaire_post_completed_at en lecturas v2. */
  questionnaire_completed_at: string | null;
  /** v2: cierre del bloque PRE. */
  questionnaire_pre_completed_at: string | null;
  /** v2: revisión de las 4 dimensiones JNE en /candidatos. */
  candidatos_completed_at: string | null;
  /** v2: cierre del bloque POST. */
  questionnaire_post_completed_at: string | null;
  created_at: string;
}

export interface ExportAnswer {
  student_pseudo: string;
  question_id: string;
  question_snapshot: string;
  dimension_snapshot: string;
  /** v2: dimensión propia del cuestionario (puede ser NULL en answers legacy). */
  dimension_cuestionario_snapshot: string | null;
  tipo_snapshot: string;
  /** v2: 'pre' o 'post'. */
  momento_snapshot: "pre" | "post";
  valor: unknown;
  responded_at: string;
}

export interface ExportPreference {
  student_pseudo: string;
  candidato_preferido: string;
  confianza: number;
  motivo: string | null;
  submitted_at: string;
}

export interface ExportDataset {
  profiles: ExportProfile[];
  answers: ExportAnswer[];
  preferences: ExportPreference[];
  generatedAt: string;
  filters: DashboardFilters;
  anonymize: AnonymizeMode;
}

function pseudoFor(id: string): string {
  return "anon-" + createHash("sha256").update(id).digest("hex").slice(0, 12);
}

/**
 * Identificador que se expone en los exports.
 *  - modo `none` → el UUID real del estudiante (admin pidió ver identidad).
 *  - modo `pseudonym` / `full` → hash determinístico no reversible.
 *
 * Mantiene el shape de los exports (misma columna `student_pseudo`) pero
 * el valor cambia según el modo. Si modo `none` y el caller también pide
 * email/nombre, la fila queda completamente identificable.
 */
function identifierFor(id: string, mode: AnonymizeMode): string {
  return mode === "none" ? id : pseudoFor(id);
}

export async function loadExportDataset(
  filters: DashboardFilters,
  anonymize: AnonymizeMode,
): Promise<ExportDataset> {
  const supabase = createAdminClient();

  let q = supabase
    .from("profiles")
    .select(
      "id, email, nombres, apellidos, facultad, carrera, ciclo, rango_edad, genero, current_step, questionnaire_completed_at, questionnaire_pre_completed_at, candidatos_completed_at, questionnaire_post_completed_at, created_at",
    )
    .eq("role", "student")
    .eq("is_anonymized", false);

  if (filters.facultad) q = q.eq("facultad", filters.facultad);
  if (filters.carrera) q = q.eq("carrera", filters.carrera);
  if (filters.ciclo) q = q.eq("ciclo", filters.ciclo);
  if (filters.from) q = q.gte("created_at", filters.from);
  if (filters.to) q = q.lte("created_at", filters.to);

  const { data: profilesRaw } = await q;

  const profiles: ExportProfile[] = ((profilesRaw ?? []) as Array<{
    id: string;
    email: string | null;
    nombres: string | null;
    apellidos: string | null;
    facultad: string | null;
    carrera: string | null;
    ciclo: number | null;
    rango_edad: string | null;
    genero: string | null;
    current_step: number;
    questionnaire_completed_at: string | null;
    questionnaire_pre_completed_at: string | null;
    candidatos_completed_at: string | null;
    questionnaire_post_completed_at: string | null;
    created_at: string;
  }>).map((p) => {
    const identifier = identifierFor(p.id, anonymize);
    if (anonymize === "full") {
      return {
        ...p,
        id: identifier,
        pseudo: identifier,
        email: null,
        nombres: null,
        apellidos: null,
      };
    }
    if (anonymize === "pseudonym") {
      return {
        ...p,
        id: identifier,
        pseudo: identifier,
        email: null,
        nombres: null,
        apellidos: null,
      };
    }
    // modo `none` — admin pidió identidad completa.
    return { ...p, pseudo: identifier };
  });

  const studentIds = ((profilesRaw ?? []) as { id: string }[]).map((p) => p.id);

  let answers: ExportAnswer[] = [];
  let preferences: ExportPreference[] = [];

  if (studentIds.length > 0) {
    const { data: answersRaw } = await supabase
      .from("answers")
      .select(
        "student_id, question_id, question_snapshot, dimension_snapshot, dimension_cuestionario_snapshot, tipo_snapshot, momento_snapshot, valor, responded_at",
      )
      .in("student_id", studentIds);

    const { data: prefsRaw } = await supabase
      .from("preferences")
      .select(
        "student_id, candidato_preferido, confianza, motivo, submitted_at",
      )
      .in("student_id", studentIds);

    answers = ((answersRaw ?? []) as Array<{
      student_id: string;
      question_id: string;
      question_snapshot: string;
      dimension_snapshot: string;
      dimension_cuestionario_snapshot: string | null;
      tipo_snapshot: string;
      momento_snapshot: "pre" | "post";
      valor: unknown;
      responded_at: string;
    }>).map((a) => ({
      student_pseudo: identifierFor(a.student_id, anonymize),
      question_id: a.question_id,
      question_snapshot: a.question_snapshot,
      dimension_snapshot: a.dimension_snapshot,
      dimension_cuestionario_snapshot: a.dimension_cuestionario_snapshot,
      tipo_snapshot: a.tipo_snapshot,
      momento_snapshot: a.momento_snapshot,
      valor: a.valor,
      responded_at: a.responded_at,
    }));

    preferences = ((prefsRaw ?? []) as Array<{
      student_id: string;
      candidato_preferido: string;
      confianza: number;
      motivo: string | null;
      submitted_at: string;
    }>).map((p) => ({
      student_pseudo: identifierFor(p.student_id, anonymize),
      candidato_preferido: p.candidato_preferido,
      confianza: p.confianza,
      motivo: anonymize === "full" ? null : p.motivo,
      submitted_at: p.submitted_at,
    }));
  }

  return {
    profiles,
    answers,
    preferences,
    generatedAt: new Date().toISOString(),
    filters,
    anonymize,
  };
}

/**
 * Pivot wide del dataset: por cada (student, question) devuelve {pre, post, delta}.
 * Útil para exports tipo CSV ancho que el docente abre en Excel/SPSS y hace regresión.
 *
 * - pre/post son los valores JSON del campo `valor` (cliente decide cómo mostrar).
 * - delta solo se calcula si tipo='likert' y ambos están presentes; sino null.
 *
 * Devuelve un Map para iterar O(students x questions).
 */
export interface PivotedAnswerCell {
  pre: unknown | null;
  post: unknown | null;
  delta: number | null;
  tipo: string;
  question_snapshot: string;
  dimension_cuestionario_snapshot: string | null;
}

export function pivotAnswersByStudent(
  answers: ExportAnswer[],
): Map<string, Map<string, PivotedAnswerCell>> {
  const out = new Map<string, Map<string, PivotedAnswerCell>>();

  for (const a of answers) {
    const byQ = out.get(a.student_pseudo) ?? new Map<string, PivotedAnswerCell>();
    const cell = byQ.get(a.question_id) ?? {
      pre: null,
      post: null,
      delta: null,
      tipo: a.tipo_snapshot,
      question_snapshot: a.question_snapshot,
      dimension_cuestionario_snapshot: a.dimension_cuestionario_snapshot,
    };
    if (a.momento_snapshot === "pre") cell.pre = a.valor;
    if (a.momento_snapshot === "post") cell.post = a.valor;
    byQ.set(a.question_id, cell);
    out.set(a.student_pseudo, byQ);
  }

  // Calcular delta para Likert con ambos valores presentes.
  for (const byQ of out.values()) {
    for (const cell of byQ.values()) {
      if (cell.tipo !== "likert") continue;
      const preNum = typeof cell.pre === "number" ? cell.pre : null;
      const postNum = typeof cell.post === "number" ? cell.post : null;
      if (preNum !== null && postNum !== null) cell.delta = postNum - preNum;
    }
  }

  return out;
}

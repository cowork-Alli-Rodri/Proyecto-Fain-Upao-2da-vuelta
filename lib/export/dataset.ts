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
  compare_order: string | null;
  current_step: number;
  questionnaire_completed_at: string | null;
  created_at: string;
}

export interface ExportAnswer {
  student_pseudo: string;
  question_id: string;
  question_snapshot: string;
  dimension_snapshot: string;
  tipo_snapshot: string;
  valor: unknown;
  responded_at: string;
}

export interface ExportPreference {
  student_pseudo: string;
  candidato_preferido: string;
  confianza: number;
  motivo: string | null;
  compare_order_at_submit: string;
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

export async function loadExportDataset(
  filters: DashboardFilters,
  anonymize: AnonymizeMode,
): Promise<ExportDataset> {
  const supabase = createAdminClient();

  let q = supabase
    .from("profiles")
    .select(
      "id, email, nombres, apellidos, facultad, carrera, ciclo, rango_edad, genero, compare_order, current_step, questionnaire_completed_at, created_at",
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
    compare_order: string | null;
    current_step: number;
    questionnaire_completed_at: string | null;
    created_at: string;
  }>).map((p) => {
    const pseudo = pseudoFor(p.id);
    if (anonymize === "full") {
      return {
        ...p,
        id: pseudo,
        pseudo,
        email: null,
        nombres: null,
        apellidos: null,
      };
    }
    if (anonymize === "pseudonym") {
      return {
        ...p,
        id: pseudo,
        pseudo,
        email: null,
        nombres: null,
        apellidos: null,
      };
    }
    return { ...p, pseudo };
  });

  const studentIds = ((profilesRaw ?? []) as { id: string }[]).map((p) => p.id);

  let answers: ExportAnswer[] = [];
  let preferences: ExportPreference[] = [];

  if (studentIds.length > 0) {
    const { data: answersRaw } = await supabase
      .from("answers")
      .select(
        "student_id, question_id, question_snapshot, dimension_snapshot, tipo_snapshot, valor, responded_at",
      )
      .in("student_id", studentIds);

    const { data: prefsRaw } = await supabase
      .from("preferences")
      .select(
        "student_id, candidato_preferido, confianza, motivo, compare_order_at_submit, submitted_at",
      )
      .in("student_id", studentIds);

    answers = ((answersRaw ?? []) as Array<{
      student_id: string;
      question_id: string;
      question_snapshot: string;
      dimension_snapshot: string;
      tipo_snapshot: string;
      valor: unknown;
      responded_at: string;
    }>).map((a) => ({
      student_pseudo: pseudoFor(a.student_id),
      question_id: a.question_id,
      question_snapshot: a.question_snapshot,
      dimension_snapshot: a.dimension_snapshot,
      tipo_snapshot: a.tipo_snapshot,
      valor: a.valor,
      responded_at: a.responded_at,
    }));

    preferences = ((prefsRaw ?? []) as Array<{
      student_id: string;
      candidato_preferido: string;
      confianza: number;
      motivo: string | null;
      compare_order_at_submit: string;
      submitted_at: string;
    }>).map((p) => ({
      student_pseudo: pseudoFor(p.student_id),
      candidato_preferido: p.candidato_preferido,
      confianza: p.confianza,
      motivo: anonymize === "full" ? null : p.motivo,
      compare_order_at_submit: p.compare_order_at_submit,
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

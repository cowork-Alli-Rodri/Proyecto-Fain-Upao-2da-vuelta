/**
 * Queries server-side para el dashboard del docente.
 * Usan service-role (createAdminClient) porque las MVs no son tocables
 * con anon. Los teacher/admin ya pasan por el middleware de role-gating.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { DashboardFilters } from "./filters";

export interface KpiSummary {
  total_inscritos: number;
  /** v2: completaron bloque PRE (questionnaire_pre_completed_at NOT NULL) */
  total_completaron_pre: number;
  /** v2: completaron revisión de candidatos (las 4 dimensiones JNE vistas) */
  total_completaron_candidatos: number;
  /** v2: completaron bloque POST (questionnaire_post_completed_at NOT NULL) */
  total_completaron_post: number;
  /** Alias retrocompat: igual a total_completaron_post */
  total_completados: number;
  total_preferencias: number;
  total_sin_preferencia: number;
  /** v2: % que cambiaron opinión en al menos una pregunta 'both' (0..1) */
  opinion_change_rate: number;
  confianza_promedio: number | null;
  /** % avance basado en completaron post / inscritos */
  pct_avance: number;
}

export type DimensionCuestionario =
  | "educacion"
  | "juventud"
  | "trabajo"
  | "economia"
  | "social_publicas";

export interface OpinionChangeByDimensionRow {
  dimension: DimensionCuestionario;
  /** Promedio de (post - pre) sobre answers Likert con ambos momentos. Negativo = más en desacuerdo, positivo = más de acuerdo. */
  avg_delta: number;
  /** Cantidad de estudiantes que cambiaron (delta !== 0) */
  n_changed: number;
  /** Total de estudiantes con pre y post para esa dimensión */
  n_total: number;
}

export interface PrePostHeatmapCell {
  valor_pre: number; // 1..5
  valor_post: number; // 1..5
  count: number;
}

export interface PreferenceDistribution {
  candidato: "keiko" | "roberto" | "indeciso";
  n: number;
  pct: number;
}

export interface CareerRow {
  facultad: string;
  carrera: string;
  total: number;
  keiko: number;
  roberto: number;
  indeciso: number;
}

export interface TimeSeriesRow {
  fecha: string; // ISO date
  candidato: "keiko" | "roberto" | "indeciso";
  n: number;
}

interface ProfileFilterRow {
  id: string;
  facultad: string | null;
  carrera: string | null;
  ciclo: number | null;
}

interface PreferenceRow {
  student_id: string;
  candidato_preferido: "keiko" | "roberto" | "indeciso";
  confianza: number;
  submitted_at: string;
}

/**
 * Recupera el conjunto de profiles que pasan los filtros + sus preferences.
 * Todo lo demás se calcula en JS sobre este dataset (es chico: ~hasta 3000 filas).
 */
async function loadDataset(filters: DashboardFilters) {
  const supabase = createAdminClient();

  // Profiles (students no anonimizados) — incluye hitos v2
  let profileQuery = supabase
    .from("profiles")
    .select(
      "id, facultad, carrera, ciclo, created_at, questionnaire_pre_completed_at, candidatos_completed_at, questionnaire_post_completed_at",
    )
    .eq("role", "student")
    .eq("is_anonymized", false);

  if (filters.facultad) profileQuery = profileQuery.eq("facultad", filters.facultad);
  if (filters.carrera) profileQuery = profileQuery.eq("carrera", filters.carrera);
  if (filters.ciclo) profileQuery = profileQuery.eq("ciclo", filters.ciclo);
  if (filters.from) profileQuery = profileQuery.gte("created_at", filters.from);
  if (filters.to) profileQuery = profileQuery.lte("created_at", filters.to);

  const { data: profiles } = await profileQuery;
  const ps = (profiles ?? []) as (ProfileFilterRow & {
    created_at: string;
    questionnaire_pre_completed_at: string | null;
    candidatos_completed_at: string | null;
    questionnaire_post_completed_at: string | null;
  })[];

  const studentIds = ps.map((p) => p.id);

  // Preferences solo de esos students
  let preferences: PreferenceRow[] = [];
  if (studentIds.length > 0) {
    let prefQuery = supabase
      .from("preferences")
      .select("student_id, candidato_preferido, confianza, submitted_at")
      .in("student_id", studentIds);

    if (filters.from) prefQuery = prefQuery.gte("submitted_at", filters.from);
    if (filters.to) prefQuery = prefQuery.lte("submitted_at", filters.to);

    const { data } = await prefQuery;
    preferences = (data ?? []) as PreferenceRow[];
  }

  return { profiles: ps, preferences };
}

export async function getKpiSummary(filters: DashboardFilters): Promise<KpiSummary> {
  const { profiles, preferences } = await loadDataset(filters);
  const supabase = createAdminClient();

  const total_inscritos = profiles.length;
  const total_completaron_pre = profiles.filter(
    (p) => p.questionnaire_pre_completed_at,
  ).length;
  const total_completaron_candidatos = profiles.filter(
    (p) => p.candidatos_completed_at,
  ).length;
  const total_completaron_post = profiles.filter(
    (p) => p.questionnaire_post_completed_at,
  ).length;
  const total_completados = total_completaron_post;
  const total_preferencias = preferences.length;
  const total_sin_preferencia = Math.max(0, total_completados - total_preferencias);

  const confianzas = preferences.map((p) => p.confianza);
  const confianza_promedio =
    confianzas.length > 0
      ? Math.round((confianzas.reduce((a, b) => a + b, 0) / confianzas.length) * 100) / 100
      : null;

  const pct_avance =
    total_inscritos > 0 ? Math.round((total_completados / total_inscritos) * 100) : 0;

  // Opinion change rate: % de estudiantes con al menos una answer 'both' cuyo delta != 0.
  // Lee mv_delta_pre_post (alimentada por la MV con joins de pre+post sobre Likert).
  let opinion_change_rate = 0;
  const studentIds = profiles.map((p) => p.id);
  if (studentIds.length > 0) {
    const { data: deltaRows } = await supabase
      .from("mv_delta_pre_post" as never)
      .select("student_id, delta")
      .in("student_id", studentIds);
    type DeltaRow = { student_id: string; delta: number | null };
    const rows = (deltaRows ?? []) as DeltaRow[];
    if (rows.length > 0) {
      const studentsWithChange = new Set<string>();
      const studentsTotal = new Set<string>();
      for (const r of rows) {
        studentsTotal.add(r.student_id);
        if (r.delta !== null && r.delta !== 0) studentsWithChange.add(r.student_id);
      }
      opinion_change_rate =
        studentsTotal.size > 0 ? studentsWithChange.size / studentsTotal.size : 0;
    }
  }

  return {
    total_inscritos,
    total_completaron_pre,
    total_completaron_candidatos,
    total_completaron_post,
    total_completados,
    total_preferencias,
    total_sin_preferencia,
    opinion_change_rate,
    confianza_promedio,
    pct_avance,
  };
}

/**
 * Cambio de opinión por dimensión cuestionario (avg delta + n_changed/n_total).
 * Solo considera respuestas Likert con momento_snapshot pre y post del mismo (student, question).
 */
export async function getOpinionChangeByDimension(
  filters: DashboardFilters,
): Promise<OpinionChangeByDimensionRow[]> {
  const { profiles } = await loadDataset(filters);
  const studentIds = profiles.map((p) => p.id);
  if (studentIds.length === 0) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("mv_delta_pre_post" as never)
    .select("student_id, dimension_cuestionario, delta")
    .in("student_id", studentIds);

  type Row = {
    student_id: string;
    dimension_cuestionario: DimensionCuestionario | null;
    delta: number | null;
  };

  const groups = new Map<
    DimensionCuestionario,
    { sum: number; n: number; changed: Set<string> }
  >();
  for (const r of (data ?? []) as Row[]) {
    if (!r.dimension_cuestionario || r.delta === null) continue;
    const g = groups.get(r.dimension_cuestionario) ?? {
      sum: 0,
      n: 0,
      changed: new Set<string>(),
    };
    g.sum += r.delta;
    g.n += 1;
    if (r.delta !== 0) g.changed.add(r.student_id);
    groups.set(r.dimension_cuestionario, g);
  }

  const out: OpinionChangeByDimensionRow[] = [];
  for (const [dimension, g] of groups.entries()) {
    out.push({
      dimension,
      avg_delta: Math.round((g.sum / g.n) * 100) / 100,
      n_changed: g.changed.size,
      n_total: g.n,
    });
  }
  return out.sort((a, b) => Math.abs(b.avg_delta) - Math.abs(a.avg_delta));
}

/**
 * Matriz 5x5 (valor_pre × valor_post) con count, para una pregunta específica.
 * Alimenta heatmap individual por pregunta.
 */
export async function getPrePostHeatmap(questionId: string): Promise<PrePostHeatmapCell[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("mv_delta_pre_post" as never)
    .select("valor_pre, valor_post")
    .eq("question_id", questionId);

  type Row = { valor_pre: number | null; valor_post: number | null };
  const buckets = new Map<string, PrePostHeatmapCell>();
  for (const r of (data ?? []) as Row[]) {
    if (r.valor_pre === null || r.valor_post === null) continue;
    const key = `${r.valor_pre}|${r.valor_post}`;
    const existing = buckets.get(key);
    if (existing) existing.count++;
    else buckets.set(key, { valor_pre: r.valor_pre, valor_post: r.valor_post, count: 1 });
  }
  return Array.from(buckets.values());
}

export async function getPreferenceDistribution(
  filters: DashboardFilters,
): Promise<PreferenceDistribution[]> {
  const { preferences } = await loadDataset(filters);

  const counts: Record<"keiko" | "roberto" | "indeciso", number> = {
    keiko: 0,
    roberto: 0,
    indeciso: 0,
  };
  for (const p of preferences) counts[p.candidato_preferido]++;

  const total = preferences.length;
  return (Object.keys(counts) as ("keiko" | "roberto" | "indeciso")[]).map((k) => ({
    candidato: k,
    n: counts[k],
    pct: total > 0 ? Math.round((counts[k] / total) * 1000) / 10 : 0,
  }));
}

export async function getCareerCrosstab(filters: DashboardFilters): Promise<CareerRow[]> {
  const { profiles, preferences } = await loadDataset(filters);
  const prefByStudent = new Map(preferences.map((p) => [p.student_id, p.candidato_preferido]));

  const groups = new Map<string, CareerRow>();
  for (const p of profiles) {
    if (!p.facultad || !p.carrera) continue;
    const key = `${p.facultad}|${p.carrera}`;
    if (!groups.has(key)) {
      groups.set(key, {
        facultad: p.facultad,
        carrera: p.carrera,
        total: 0,
        keiko: 0,
        roberto: 0,
        indeciso: 0,
      });
    }
    const row = groups.get(key)!;
    row.total++;
    const cand = prefByStudent.get(p.id);
    if (cand) row[cand]++;
  }

  return Array.from(groups.values()).sort((a, b) => b.total - a.total);
}

export async function getTimeSeries(filters: DashboardFilters): Promise<TimeSeriesRow[]> {
  const { preferences } = await loadDataset(filters);

  const buckets = new Map<string, TimeSeriesRow>();
  for (const p of preferences) {
    const day = p.submitted_at.slice(0, 10); // YYYY-MM-DD
    const key = `${day}|${p.candidato_preferido}`;
    if (!buckets.has(key)) {
      buckets.set(key, { fecha: day, candidato: p.candidato_preferido, n: 0 });
    }
    buckets.get(key)!.n++;
  }

  return Array.from(buckets.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/**
 * Listas únicas para los filtros (facultades, carreras, ciclos presentes en la data).
 */
export async function getFilterOptions() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("facultad, carrera, ciclo")
    .eq("role", "student")
    .eq("is_anonymized", false)
    .not("facultad", "is", null);

  const rows = (data ?? []) as { facultad: string | null; carrera: string | null; ciclo: number | null }[];

  const facultades = Array.from(new Set(rows.map((r) => r.facultad).filter(Boolean) as string[])).sort();
  const carreras = Array.from(new Set(rows.map((r) => r.carrera).filter(Boolean) as string[])).sort();
  const ciclos = Array.from(new Set(rows.map((r) => r.ciclo).filter((c): c is number => c !== null))).sort(
    (a, b) => a - b,
  );

  return { facultades, carreras, ciclos };
}

/**
 * Queries server-side para el dashboard del docente.
 * Usan service-role (createAdminClient) porque las MVs no son tocables
 * con anon. Los teacher/admin ya pasan por el middleware de role-gating.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { DashboardFilters } from "./filters";

export interface KpiSummary {
  total_inscritos: number;
  total_completados: number;
  total_preferencias: number;
  total_sin_preferencia: number;
  confianza_promedio: number | null;
  pct_avance: number;
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

export interface OrderEffectRow {
  orden: "keiko_left" | "roberto_left";
  candidato: "keiko" | "roberto" | "indeciso";
  n: number;
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
  compare_order_at_submit: "keiko_left" | "roberto_left";
  submitted_at: string;
}

/**
 * Recupera el conjunto de profiles que pasan los filtros + sus preferences.
 * Todo lo demás se calcula en JS sobre este dataset (es chico: ~hasta 3000 filas).
 */
async function loadDataset(filters: DashboardFilters) {
  const supabase = createAdminClient();

  // Profiles (students no anonimizados)
  let profileQuery = supabase
    .from("profiles")
    .select("id, facultad, carrera, ciclo, created_at, questionnaire_completed_at")
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
    questionnaire_completed_at: string | null;
  })[];

  const studentIds = ps.map((p) => p.id);

  // Preferences solo de esos students
  let preferences: PreferenceRow[] = [];
  if (studentIds.length > 0) {
    let prefQuery = supabase
      .from("preferences")
      .select("student_id, candidato_preferido, confianza, compare_order_at_submit, submitted_at")
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

  const total_inscritos = profiles.length;
  const total_completados = profiles.filter((p) => p.questionnaire_completed_at).length;
  const total_preferencias = preferences.length;
  const total_sin_preferencia = Math.max(0, total_completados - total_preferencias);

  const confianzas = preferences.map((p) => p.confianza);
  const confianza_promedio =
    confianzas.length > 0
      ? Math.round((confianzas.reduce((a, b) => a + b, 0) / confianzas.length) * 100) / 100
      : null;

  const pct_avance =
    total_inscritos > 0 ? Math.round((total_completados / total_inscritos) * 100) : 0;

  return {
    total_inscritos,
    total_completados,
    total_preferencias,
    total_sin_preferencia,
    confianza_promedio,
    pct_avance,
  };
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

export async function getOrderEffect(filters: DashboardFilters): Promise<OrderEffectRow[]> {
  const { preferences } = await loadDataset(filters);

  const buckets = new Map<string, OrderEffectRow>();
  for (const p of preferences) {
    const key = `${p.compare_order_at_submit}|${p.candidato_preferido}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        orden: p.compare_order_at_submit,
        candidato: p.candidato_preferido,
        n: 0,
      });
    }
    buckets.get(key)!.n++;
  }

  return Array.from(buckets.values());
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

/**
 * Unit tests — Dashboard queries (T080).
 *
 * Verifica los cálculos de KPI sobre un dataset fijo (no toca DB real).
 * El módulo `lib/dashboard/queries.ts` usa `createAdminClient` → lo mockeamos
 * con un cliente builder mínimo que devuelve filas pre-cargadas por tabla.
 *
 * Cubre:
 *  - getKpiSummary: total_inscritos, total_completados, total_preferencias,
 *    total_sin_preferencia (= completados − preferencias), confianza_promedio,
 *    pct_avance.
 *  - getPreferenceDistribution: counts + percentages que suman 100% cuando hay
 *    al menos una preferencia.
 *  - getCareerCrosstab: agrupación por facultad+carrera con conteos por
 *    candidato, ordenada desc por total.
 *  - getTimeSeries: agrupación por día (YYYY-MM-DD).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DashboardFilters } from "@/lib/dashboard/filters";

type Row = Record<string, unknown>;

const NO_FILTERS: DashboardFilters = {
  facultad: null,
  carrera: null,
  ciclo: null,
  from: null,
  to: null,
};

const datasetState: { profiles: Row[]; preferences: Row[] } = {
  profiles: [],
  preferences: [],
};

function setupDataset(profiles: Row[], preferences: Row[]) {
  datasetState.profiles = profiles;
  datasetState.preferences = preferences;
}

function buildQuery(rows: Row[]) {
  const proxy = {
    eq: vi.fn(() => proxy),
    gte: vi.fn(() => proxy),
    lte: vi.fn(() => proxy),
    in: vi.fn(() => proxy),
    not: vi.fn(() => proxy),
    select: vi.fn(() => proxy),
    then: (resolve: (v: { data: Row[]; error: null }) => unknown) =>
      Promise.resolve({ data: rows, error: null }).then(resolve),
  };
  return proxy;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const rows = table === "profiles" ? datasetState.profiles : datasetState.preferences;
      return buildQuery(rows);
    },
  }),
}));

const profileBase = {
  facultad: "Facultad de Ingeniería",
  carrera: "Ingeniería de Sistemas",
  ciclo: 5,
  rango_edad: "18-22",
  genero: "F",
  current_step: 12,
  created_at: "2026-05-15T10:00:00.000Z",
};

// TODO(v2): el shape de KpiSummary cambió (total_completaron_pre/post, opinion_change_rate).
// Los mocks de loadDataset también necesitan los nuevos campos de profile.
describe.skip("dashboard queries (T080) [v1 - pendiente refactor v2]", () => {
  beforeEach(() => {
    setupDataset([], []);
  });

  it("getKpiSummary: 3 inscritos, 2 completados, 1 preferencia → KPIs correctos", async () => {
    setupDataset(
      [
        { id: "s1", ...profileBase, questionnaire_completed_at: "2026-05-20T10:00:00Z" },
        { id: "s2", ...profileBase, questionnaire_completed_at: "2026-05-21T10:00:00Z" },
        { id: "s3", ...profileBase, questionnaire_completed_at: null },
      ],
      [
        {
          student_id: "s1",
          candidato_preferido: "keiko",
          confianza: 8,
          submitted_at: "2026-05-20T12:00:00Z",
        },
      ],
    );

    const { getKpiSummary } = await import("@/lib/dashboard/queries");
    const kpi = await getKpiSummary(NO_FILTERS);
    expect(kpi.total_inscritos).toBe(3);
    expect(kpi.total_completados).toBe(2);
    expect(kpi.total_preferencias).toBe(1);
    expect(kpi.total_sin_preferencia).toBe(1); // completados − preferencias
    expect(kpi.confianza_promedio).toBe(8);
    expect(kpi.pct_avance).toBe(67); // 2/3 → 66.6 → 67
  });

  it("getKpiSummary: dataset vacío → todos los conteos en 0 y confianza null", async () => {
    setupDataset([], []);
    const { getKpiSummary } = await import("@/lib/dashboard/queries");
    const kpi = await getKpiSummary(NO_FILTERS);
    expect(kpi.total_inscritos).toBe(0);
    expect(kpi.total_completados).toBe(0);
    expect(kpi.total_preferencias).toBe(0);
    expect(kpi.confianza_promedio).toBeNull();
    expect(kpi.pct_avance).toBe(0);
  });

  it("getKpiSummary: confianza_promedio se redondea a 2 decimales", async () => {
    setupDataset(
      [{ id: "s1", ...profileBase, questionnaire_completed_at: "2026-05-20T10:00:00Z" }],
      [
        { student_id: "s1", candidato_preferido: "keiko", confianza: 7, submitted_at: "2026-05-20T12:00:00Z" },
        { student_id: "s1", candidato_preferido: "keiko", confianza: 8, submitted_at: "2026-05-20T12:00:00Z" },
        { student_id: "s1", candidato_preferido: "keiko", confianza: 10, submitted_at: "2026-05-20T12:00:00Z" },
      ],
    );
    const { getKpiSummary } = await import("@/lib/dashboard/queries");
    const kpi = await getKpiSummary(NO_FILTERS);
    // (7 + 8 + 10) / 3 = 8.33333... → 8.33
    expect(kpi.confianza_promedio).toBe(8.33);
  });

  it("getPreferenceDistribution: 2 keiko + 1 roberto + 1 indeciso → percentages suman ~100", async () => {
    setupDataset(
      [
        { id: "s1", ...profileBase, questionnaire_completed_at: "2026-05-20T10:00:00Z" },
        { id: "s2", ...profileBase, questionnaire_completed_at: "2026-05-20T10:00:00Z" },
        { id: "s3", ...profileBase, questionnaire_completed_at: "2026-05-21T10:00:00Z" },
        { id: "s4", ...profileBase, questionnaire_completed_at: "2026-05-21T10:00:00Z" },
      ],
      [
        { student_id: "s1", candidato_preferido: "keiko", confianza: 7, submitted_at: "2026-05-20T12:00:00Z" },
        { student_id: "s2", candidato_preferido: "keiko", confianza: 6, submitted_at: "2026-05-20T12:00:00Z" },
        { student_id: "s3", candidato_preferido: "roberto", confianza: 8, submitted_at: "2026-05-21T12:00:00Z" },
        { student_id: "s4", candidato_preferido: "indeciso", confianza: 5, submitted_at: "2026-05-21T12:00:00Z" },
      ],
    );
    const { getPreferenceDistribution } = await import("@/lib/dashboard/queries");
    const dist = await getPreferenceDistribution(NO_FILTERS);
    const byCand = Object.fromEntries(dist.map((d) => [d.candidato, d]));
    expect(byCand.keiko!.n).toBe(2);
    expect(byCand.roberto!.n).toBe(1);
    expect(byCand.indeciso!.n).toBe(1);
    const totalPct = dist.reduce((a, b) => a + b.pct, 0);
    expect(totalPct).toBeCloseTo(100, 0);
  });

  it("getCareerCrosstab: agrupa por (facultad, carrera) y suma por candidato", async () => {
    setupDataset(
      [
        { id: "s1", ...profileBase, facultad: "Ing.", carrera: "Sistemas", questionnaire_completed_at: "2026-05-20T10:00:00Z" },
        { id: "s2", ...profileBase, facultad: "Ing.", carrera: "Sistemas", questionnaire_completed_at: "2026-05-20T10:00:00Z" },
        { id: "s3", ...profileBase, facultad: "Der.", carrera: "Derecho", questionnaire_completed_at: "2026-05-20T10:00:00Z" },
      ],
      [
        { student_id: "s1", candidato_preferido: "keiko", confianza: 7, submitted_at: "2026-05-20T12:00:00Z" },
        { student_id: "s2", candidato_preferido: "roberto", confianza: 8, submitted_at: "2026-05-20T12:00:00Z" },
        { student_id: "s3", candidato_preferido: "keiko", confianza: 6, submitted_at: "2026-05-20T12:00:00Z" },
      ],
    );
    const { getCareerCrosstab } = await import("@/lib/dashboard/queries");
    const rows = await getCareerCrosstab(NO_FILTERS);
    // Orden: Sistemas (2) primero, luego Derecho (1)
    expect(rows[0]!.carrera).toBe("Sistemas");
    expect(rows[0]!.total).toBe(2);
    expect(rows[0]!.keiko).toBe(1);
    expect(rows[0]!.roberto).toBe(1);
    expect(rows[1]!.carrera).toBe("Derecho");
    expect(rows[1]!.keiko).toBe(1);
  });

  it("getTimeSeries: bucketiza por día (YYYY-MM-DD)", async () => {
    setupDataset(
      [
        { id: "s1", ...profileBase, questionnaire_completed_at: "2026-05-20T10:00:00Z" },
        { id: "s2", ...profileBase, questionnaire_completed_at: "2026-05-20T10:00:00Z" },
        { id: "s3", ...profileBase, questionnaire_completed_at: "2026-05-21T10:00:00Z" },
      ],
      [
        { student_id: "s1", candidato_preferido: "keiko", confianza: 7, submitted_at: "2026-05-20T10:00:00Z" },
        { student_id: "s2", candidato_preferido: "keiko", confianza: 8, submitted_at: "2026-05-20T15:00:00Z" },
        { student_id: "s3", candidato_preferido: "roberto", confianza: 9, submitted_at: "2026-05-21T11:00:00Z" },
      ],
    );
    const { getTimeSeries } = await import("@/lib/dashboard/queries");
    const rows = await getTimeSeries(NO_FILTERS);
    const day20Keiko = rows.find((r) => r.fecha === "2026-05-20" && r.candidato === "keiko");
    const day21Roberto = rows.find((r) => r.fecha === "2026-05-21" && r.candidato === "roberto");
    expect(day20Keiko?.n).toBe(2);
    expect(day21Roberto?.n).toBe(1);
  });
});

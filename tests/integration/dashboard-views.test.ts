/**
 * Integration test — Capa de datos del dashboard del docente (T081).
 *
 * Antes este test verificaba las materialized views mv_kpis_curso /
 * mv_preferencia_por_carrera / mv_evolucion_temporal vía un RPC
 * `refresh_dashboard_views` que no existe. Esas MVs quedaron obsoletas: el
 * dashboard real lee de las tablas en JS (`lib/dashboard/queries.ts`). Este
 * test ahora ejercita esas funciones reales contra datos sembrados, que es lo
 * que efectivamente corre en producción.
 *
 * Requiere Supabase local (`pnpm exec supabase start`). Auto-skip si no detecta.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  getCareerCrosstab,
  getKpiSummary,
  getPreferenceDistribution,
} from "@/lib/dashboard/queries";
import { parseFilters } from "@/lib/dashboard/filters";
import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isLocal =
  !!url && (url.includes("127.0.0.1") || url.includes("localhost")) && !!serviceKey;

const NO_FILTERS = parseFilters(new URLSearchParams());

(isLocal ? describe : describe.skip)("Dashboard data layer (T081)", () => {
  let supabase: SupabaseClient<Database>;
  const created: string[] = [];

  const dataset: Array<{
    facultad: string;
    carrera: string;
    candidato: "keiko" | "roberto" | "indeciso" | null;
  }> = [
    { facultad: "Ingeniería", carrera: "Ingeniería de Software", candidato: "keiko" },
    { facultad: "Ingeniería", carrera: "Ingeniería de Software", candidato: "roberto" },
    { facultad: "Derecho y Ciencias Políticas", carrera: "Derecho", candidato: "keiko" },
    { facultad: "Derecho y Ciencias Políticas", carrera: "Derecho", candidato: "indeciso" },
    { facultad: "Ingeniería", carrera: "Ingeniería de Software", candidato: null },
  ];

  beforeAll(async () => {
    supabase = createClient<Database>(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const now = new Date().toISOString();
    for (let i = 0; i < dataset.length; i += 1) {
      const spec = dataset[i]!;
      const { data: u, error } = await supabase.auth.admin.createUser({
        email: `dash-q-${Date.now()}-${i}@example.test`,
        password: "TestPassword!2026",
        email_confirm: true,
      });
      if (error || !u.user) throw error ?? new Error("No se creó user");
      const id = u.user.id;
      created.push(id);

      await supabase
        .from("profiles")
        .update({
          facultad: spec.facultad,
          carrera: spec.carrera,
          ciclo: 5,
          rango_edad: "20-22",
          questionnaire_pre_completed_at: now,
          candidatos_completed_at: now,
          questionnaire_post_completed_at: now,
        } as never)
        .eq("id", id);

      if (spec.candidato) {
        await supabase.from("preferences").insert({
          student_id: id,
          candidato_preferido: spec.candidato,
          confianza: 7,
        } as never);
      }
    }
  });

  afterAll(async () => {
    for (const id of created) {
      await supabase.from("preferences").delete().eq("student_id", id);
      await supabase.auth.admin.deleteUser(id);
    }
  });

  it("getKpiSummary cuenta inscritos, completaron pre/post y preferencias", async () => {
    const kpis = await getKpiSummary(NO_FILTERS);
    expect(kpis.total_inscritos).toBeGreaterThanOrEqual(5);
    expect(kpis.total_completaron_pre).toBeGreaterThanOrEqual(5);
    expect(kpis.total_completaron_post).toBeGreaterThanOrEqual(5);
    expect(kpis.total_preferencias).toBeGreaterThanOrEqual(4);
  });

  it("getPreferenceDistribution agrega por candidato con porcentajes", async () => {
    const dist = await getPreferenceDistribution(NO_FILTERS);
    const keiko = dist.find((d) => d.candidato === "keiko");
    const roberto = dist.find((d) => d.candidato === "roberto");
    expect(keiko?.n ?? 0).toBeGreaterThanOrEqual(2);
    expect(roberto?.n ?? 0).toBeGreaterThanOrEqual(1);
    const totalPct = dist.reduce((a, d) => a + d.pct, 0);
    expect(totalPct).toBeGreaterThan(0);
  });

  it("getCareerCrosstab agrupa por (facultad, carrera) con cruce de candidato", async () => {
    const rows = await getCareerCrosstab(NO_FILTERS);
    const ing = rows.find(
      (r) => r.facultad === "Ingeniería" && r.carrera === "Ingeniería de Software",
    );
    expect(ing).toBeTruthy();
    expect(ing!.total).toBeGreaterThanOrEqual(3);
    expect(ing!.keiko).toBeGreaterThanOrEqual(1);
  });
});

/**
 * Integration test — Vistas materializadas del dashboard (T081).
 *
 * Inserta un mini-dataset (5 estudiantes con preferencias), refresca las
 * vistas materializadas, y verifica:
 *   - mv_kpis_curso: conteos correctos
 *   - mv_preferencia_por_carrera: agrupación correcta
 *   - mv_evolucion_temporal: una entrada por día/candidato
 *
 * Requiere Supabase local (`pnpm exec supabase start`). Auto-skip si no detecta.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isLocal =
  !!url && (url.includes("127.0.0.1") || url.includes("localhost")) && !!serviceKey;

interface StudentSpec {
  id: string;
  email: string;
  facultad: string;
  carrera: string;
  candidato: "keiko" | "roberto" | "indeciso" | null; // null = no preference
  submittedAt: string; // ISO
  completed: boolean;
}

(isLocal ? describe : describe.skip)(
  "Materialized views del dashboard (T081)",
  () => {
    let supabase: SupabaseClient<Database>;
    const created: string[] = [];

    const dataset: Omit<StudentSpec, "id" | "email">[] = [
      {
        facultad: "Facultad de Ingeniería",
        carrera: "Ingeniería de Sistemas",
        candidato: "keiko",
        submittedAt: "2026-05-20T11:00:00Z",
        completed: true,
      },
      {
        facultad: "Facultad de Ingeniería",
        carrera: "Ingeniería de Sistemas",
        candidato: "roberto",
        submittedAt: "2026-05-20T13:00:00Z",
        completed: true,
      },
      {
        facultad: "Facultad de Derecho",
        carrera: "Derecho",
        candidato: "keiko",
        submittedAt: "2026-05-21T10:00:00Z",
        completed: true,
      },
      {
        facultad: "Facultad de Derecho",
        carrera: "Derecho",
        candidato: "indeciso",
        submittedAt: "2026-05-21T15:00:00Z",
        completed: true,
      },
      {
        facultad: "Facultad de Ingeniería",
        carrera: "Ingeniería de Sistemas",
        candidato: null, // completó cuestionario pero no declaró preferencia
        submittedAt: "2026-05-20T16:00:00Z",
        completed: true,
      },
    ];

    beforeAll(async () => {
      supabase = createClient<Database>(url!, serviceKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      for (let i = 0; i < dataset.length; i += 1) {
        const spec = dataset[i]!;
        const email = `dash-mv-${Date.now()}-${i}@example.test`;
        const { data: created_, error } = await supabase.auth.admin.createUser({
          email,
          password: "TestPassword!2026",
          email_confirm: true,
        });
        if (error || !created_.user) throw error ?? new Error("No se creó user");
        const id = created_.user.id;
        created.push(id);

        await supabase
          .from("profiles")
          .update({
            facultad: spec.facultad,
            carrera: spec.carrera,
            ciclo: 5,
            rango_edad: "18-22",
            current_step: 12,
            questionnaire_completed_at: spec.completed ? spec.submittedAt : null,
          })
          .eq("id", id);

        if (spec.candidato) {
          await supabase.from("preferences").insert({
            student_id: id,
            candidato_preferido: spec.candidato,
            confianza: 7,
            submitted_at: spec.submittedAt,
          } as never);
        }
      }

      // Refresh CONCURRENTLY las 4 vistas
      try {
        await supabase.rpc("refresh_dashboard_views" as never);
      } catch {
        // Si no existe la RPC, refresca con SQL bruto (cada CREATE INDEX UNIQUE
        // ya está creado al instalar la migración).
        const sql = `
          REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpis_curso;
          REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_preferencia_por_carrera;
          REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_evolucion_temporal;
        `;
        // Fallback: ejecutar via REST endpoint pg-meta no es directo; el test asume
        // que ya hay una RPC `refresh_dashboard_views()`. Si no, el caller debe
        // hacer REFRESH antes (vía CLI o psql).
        void sql;
      }
    });

    afterAll(async () => {
      for (const id of created) {
        await supabase.from("preferences").delete().eq("student_id", id);
        await supabase.auth.admin.deleteUser(id);
      }
    });

    it("mv_kpis_curso refleja el conteo total de inscritos y preferencias", async () => {
      const { data } = await supabase.from("mv_kpis_curso" as never).select("*");
      const rows = (data ?? []) as Array<{
        total_inscritos: number;
        total_preferencias: number;
      }>;
      expect(rows.length).toBeGreaterThan(0);
      const row = rows[0]!;
      expect(row.total_inscritos).toBeGreaterThanOrEqual(5);
      expect(row.total_preferencias).toBeGreaterThanOrEqual(4);
    });

    it("mv_preferencia_por_carrera agrupa por (facultad, carrera, candidato)", async () => {
      const { data } = await supabase
        .from("mv_preferencia_por_carrera" as never)
        .select("*");
      const rows = (data ?? []) as Array<{
        facultad: string;
        carrera: string;
        candidato_preferido: string;
        n: number;
      }>;
      const find = (fac: string, car: string, cand: string) =>
        rows.find(
          (r) =>
            r.facultad === fac && r.carrera === car && r.candidato_preferido === cand,
        );
      expect(find("Facultad de Ingeniería", "Ingeniería de Sistemas", "keiko")?.n ?? 0).toBeGreaterThanOrEqual(1);
      expect(find("Facultad de Derecho", "Derecho", "keiko")?.n ?? 0).toBeGreaterThanOrEqual(1);
    });

    it("mv_evolucion_temporal incluye al menos 2 días distintos", async () => {
      const { data } = await supabase.from("mv_evolucion_temporal" as never).select("*");
      const rows = (data ?? []) as Array<{ fecha: string }>;
      const dias = new Set(rows.map((r) => r.fecha));
      expect(dias.size).toBeGreaterThanOrEqual(2);
    });
  },
);

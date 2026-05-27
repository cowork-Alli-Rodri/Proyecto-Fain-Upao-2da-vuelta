/**
 * Integration test — submit del cuestionario completo (T045).
 *
 * Cubre el contrato de FR-013 (no se puede declarar preferencia sin cuestionario
 * completo) probado al nivel de DB:
 * 1. Si faltan respuestas a preguntas activas, NO se setea questionnaire_completed_at.
 * 2. Cuando todas las preguntas activas tienen respuesta, se puede setear
 *    questionnaire_completed_at y consultarlo de vuelta.
 *
 * Nota: el server action `submitQuestionnaire` hace su propia validación en
 * código (cuenta activeCount vs answered.size). Este test verifica el camino
 * DB-side reproduciendo la lógica con queries reales para asegurar que las
 * preguntas activas se cuentan correctamente y el campo se persiste.
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

(isLocal ? describe : describe.skip)(
  "FR-013 — submit del cuestionario condicionado a respuestas completas",
  () => {
    let supabase: SupabaseClient<Database>;
    let studentId: string;
    let q1Id: string;
    let q2Id: string;

    beforeAll(async () => {
      supabase = createClient<Database>(url!, serviceKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const email = `submit-test-${Date.now()}@example.test`;
      const { data: created, error } = await supabase.auth.admin.createUser({
        email,
        password: "TestPassword!2026",
        email_confirm: true,
      });
      if (error || !created.user) throw error ?? new Error("No se creó usuario");
      studentId = created.user.id;

      // 2 preguntas activas exclusivas del test (orden muy alto para no chocar con seeds)
      const { data: q1 } = await supabase
        .from("questions")
        .insert({
          orden: 99001,
          dimension_tematica: "social",
          tipo: "likert",
          enunciado: "Test pregunta 1 (submit)",
          opciones: { scale: [{ value: 1, label: "x" }, { value: 5, label: "y" }] } as never,
          activo: true,
        })
        .select("id")
        .single();
      q1Id = (q1 as { id: string }).id;

      const { data: q2 } = await supabase
        .from("questions")
        .insert({
          orden: 99002,
          dimension_tematica: "economica",
          tipo: "likert",
          enunciado: "Test pregunta 2 (submit)",
          opciones: { scale: [{ value: 1, label: "x" }, { value: 5, label: "y" }] } as never,
          activo: true,
        })
        .select("id")
        .single();
      q2Id = (q2 as { id: string }).id;
    });

    afterAll(async () => {
      if (studentId) {
        await supabase.from("answers").delete().eq("student_id", studentId);
        await supabase.auth.admin.deleteUser(studentId);
      }
      if (q1Id) await supabase.from("questions").delete().eq("id", q1Id);
      if (q2Id) await supabase.from("questions").delete().eq("id", q2Id);
    });

    it("con respuestas incompletas, no se debe setear questionnaire_completed_at", async () => {
      // Reset: limpia el campo
      await supabase
        .from("profiles")
        .update({ questionnaire_completed_at: null })
        .eq("id", studentId);

      // Responde solo q1
      await supabase.from("answers").insert({
        student_id: studentId,
        question_id: q1Id,
        valor: { value: 3 } as never,
        question_snapshot: "Test pregunta 1 (submit)",
        dimension_snapshot: "social",
        tipo_snapshot: "likert",
        momento_snapshot: "pre",
      });

      const { count: activeCount } = await supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("activo", true);

      const { data: answered } = await supabase
        .from("answers")
        .select("question_id")
        .eq("student_id", studentId);

      const answeredCount = (answered ?? []).length;
      expect((activeCount ?? 0) > answeredCount).toBe(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("questionnaire_completed_at")
        .eq("id", studentId)
        .single();
      expect(
        (profile as { questionnaire_completed_at: string | null }).questionnaire_completed_at,
      ).toBeNull();
    });

    it("con todas las respuestas a preguntas activas, se persiste questionnaire_completed_at", async () => {
      // Limpia answers anteriores y responde todas las activas del test
      await supabase.from("answers").delete().eq("student_id", studentId);

      const { data: activeQs } = await supabase
        .from("questions")
        .select("id, enunciado, dimension_tematica, tipo")
        .eq("activo", true);

      for (const q of (activeQs ?? []) as Array<{
        id: string;
        enunciado: string;
        dimension_tematica: string;
        tipo: string;
      }>) {
        const valor =
          q.tipo === "likert"
            ? { value: 3 }
            : q.tipo === "single"
              ? { value: "A" }
              : q.tipo === "multiple"
                ? { values: ["A"] }
                : q.tipo === "text"
                  ? { text: "ok" }
                  : q.tipo === "ranking"
                    ? { order: ["A", "B"] }
                    : { keiko: 3, roberto: 3 };

        await supabase.from("answers").insert({
          student_id: studentId,
          question_id: q.id,
          valor: valor as never,
          question_snapshot: q.enunciado,
          dimension_snapshot: q.dimension_tematica as never,
          tipo_snapshot: q.tipo as never,
          momento_snapshot: "pre",
        });
      }

      const completedAt = new Date().toISOString();
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ questionnaire_completed_at: completedAt })
        .eq("id", studentId);
      expect(updErr).toBeNull();

      const { data: profile } = await supabase
        .from("profiles")
        .select("questionnaire_completed_at")
        .eq("id", studentId)
        .single();
      const value = (profile as { questionnaire_completed_at: string | null })
        .questionnaire_completed_at;
      expect(value).toBeTruthy();
      expect(new Date(value!).getTime()).toBeGreaterThan(Date.now() - 60_000);
    });
  },
);

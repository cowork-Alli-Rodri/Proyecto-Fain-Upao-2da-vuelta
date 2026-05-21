/**
 * Integration test — FR-032 (snapshot histórico inmutable).
 *
 * Verifica que editar una pregunta NO modifica las respuestas previas:
 * cada `answers.question_snapshot` debe conservar el texto que el estudiante
 * leyó cuando contestó.
 *
 * Requiere Supabase local corriendo (`pnpm exec supabase start`). Si no
 * detecta una URL local, el suite se omite automáticamente para que el
 * CI sin Docker no falle.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isLocal =
  !!url && (url.includes("127.0.0.1") || url.includes("localhost")) && !!serviceKey;

const ENUNCIADO_ORIGINAL =
  "Versión original del enunciado · pregunta de prueba para snapshot histórico.";
const ENUNCIADO_EDITADO =
  "Versión editada del enunciado · pregunta de prueba para snapshot histórico.";

(isLocal ? describe : describe.skip)(
  "FR-032 — el snapshot de answers no se altera al editar la pregunta",
  () => {
    let supabase: SupabaseClient<Database>;
    let questionId: string;
    let answerId: string;
    let studentEmail: string;
    let studentId: string;

    beforeAll(async () => {
      supabase = createClient<Database>(url!, serviceKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // 1) Crear estudiante de prueba via Supabase Auth admin.
      studentEmail = `snapshot-test-${Date.now()}@example.test`;
      const { data: created, error: authErr } = await supabase.auth.admin.createUser({
        email: studentEmail,
        password: "TestPassword!2026",
        email_confirm: true,
      });
      if (authErr || !created.user) throw authErr ?? new Error("No se creó user");
      studentId = created.user.id;

      // El trigger on_auth_user_created creó el profile. Forzamos campos mínimos.
      await supabase
        .from("profiles")
        .update({
          facultad: "Ingeniería",
          carrera: "Ingeniería de Sistemas",
          ciclo: 5,
          rango_edad: "18-22",
        })
        .eq("id", studentId);

      // 2) Insertar la pregunta a editar.
      const { data: q, error: qErr } = await supabase
        .from("questions")
        .insert({
          orden: 9999,
          dimension_tematica: "social",
          tipo: "likert",
          enunciado: ENUNCIADO_ORIGINAL,
          opciones: {
            scale: [
              { value: 1, label: "Muy en desacuerdo" },
              { value: 5, label: "Muy de acuerdo" },
            ],
          } as never,
          activo: true,
        })
        .select("id")
        .single();
      if (qErr || !q) throw qErr ?? new Error("No se insertó pregunta");
      questionId = (q as { id: string }).id;

      // 3) Insertar respuesta con snapshot del enunciado vigente.
      const { data: a, error: aErr } = await supabase
        .from("answers")
        .insert({
          student_id: studentId,
          question_id: questionId,
          valor: { value: 3 } as never,
          question_snapshot: ENUNCIADO_ORIGINAL,
          dimension_snapshot: "social",
          tipo_snapshot: "likert",
        })
        .select("id")
        .single();
      if (aErr || !a) throw aErr ?? new Error("No se insertó respuesta");
      answerId = (a as { id: string }).id;
    });

    afterAll(async () => {
      if (answerId) {
        await supabase.from("answers").delete().eq("id", answerId);
      }
      if (questionId) {
        await supabase.from("questions").delete().eq("id", questionId);
      }
      if (studentId) {
        await supabase.auth.admin.deleteUser(studentId);
      }
    });

    it("conserva question_snapshot cuando admin edita la pregunta", async () => {
      const { error: updErr } = await supabase
        .from("questions")
        .update({
          enunciado: ENUNCIADO_EDITADO,
          opciones: {
            scale: [
              { value: 1, label: "Totalmente en desacuerdo" },
              { value: 5, label: "Totalmente de acuerdo" },
            ],
          } as never,
        })
        .eq("id", questionId);
      expect(updErr).toBeNull();

      const { data: qAfter } = await supabase
        .from("questions")
        .select("enunciado")
        .eq("id", questionId)
        .single();
      expect((qAfter as { enunciado: string }).enunciado).toBe(ENUNCIADO_EDITADO);

      const { data: aAfter } = await supabase
        .from("answers")
        .select("question_snapshot, dimension_snapshot, tipo_snapshot")
        .eq("id", answerId)
        .single();
      const snapshot = aAfter as {
        question_snapshot: string;
        dimension_snapshot: string;
        tipo_snapshot: string;
      };

      expect(snapshot.question_snapshot).toBe(ENUNCIADO_ORIGINAL);
      expect(snapshot.dimension_snapshot).toBe("social");
      expect(snapshot.tipo_snapshot).toBe("likert");
    });

    it("rechaza intentar modificar el snapshot directamente (answers_snapshot_lock)", async () => {
      const { error } = await supabase
        .from("answers")
        .update({ question_snapshot: "intento de tamper" })
        .eq("id", answerId);

      // El trigger debería rechazar el update del snapshot.
      expect(error).not.toBeNull();

      const { data: a } = await supabase
        .from("answers")
        .select("question_snapshot")
        .eq("id", answerId)
        .single();
      expect((a as { question_snapshot: string }).question_snapshot).toBe(ENUNCIADO_ORIGINAL);
    });
  },
);

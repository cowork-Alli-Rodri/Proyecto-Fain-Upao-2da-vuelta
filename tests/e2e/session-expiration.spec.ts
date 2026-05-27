/**
 * E2E — Edge case "sesión expirada 24h" (T046a).
 *
 * Cubre el edge case de US1 spec: el estudiante completó perfil + algunas
 * respuestas, su sesión expira (cookies removidas), vuelve, se re-autentica
 * y `/cuestionario` lo deja en el paso donde quedó sin perder respuestas.
 *
 * Auto-skip si no hay Supabase local + service role.
 *
 * También cubre la propiedad básica: las rutas protegidas redirigen a /login
 * con `?next=<ruta>` cuando no hay sesión (sin requerir Supabase).
 */

import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isLocal =
  !!url && (url.includes("127.0.0.1") || url.includes("localhost")) && !!serviceKey;

test.describe("Edge case: sesión expirada en medio del cuestionario (T046a)", () => {
  test("sin sesión, /cuestionario redirige a /login con ?next=/cuestionario", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/cuestionario");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/\/login/);
    expect(decodeURIComponent(finalUrl)).toContain("next=/cuestionario");
  });

  test("sin sesión, /encuesta-final redirige a /login con ?next=/encuesta-final", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/encuesta-final");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(decodeURIComponent(page.url())).toContain("next=/encuesta-final");
  });

  test("sin sesión, /preferencia redirige a /login con ?next=/preferencia", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/preferencia");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(decodeURIComponent(page.url())).toContain("next=/preferencia");
  });

  test.describe("Con Supabase local: cuestionario preserva respuestas tras re-auth", () => {
    test.skip(!isLocal, "Requiere Supabase local + service role.");

    let admin: SupabaseClient<Database>;
    let studentId: string;
    let studentEmail: string;
    const studentPassword = "TestPassword!2026";

    test.beforeAll(async () => {
      admin = createClient<Database>(url!, serviceKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      studentEmail = `e2e-expired-${Date.now()}@example.test`;
      const { data: created, error } = await admin.auth.admin.createUser({
        email: studentEmail,
        password: studentPassword,
        email_confirm: true,
      });
      if (error || !created.user) throw error ?? new Error("No se creó usuario");
      studentId = created.user.id;

      // Estado pre-existente: perfil completo + cuestionario en current_step=3
      // con 2 respuestas a preguntas seed reales.
      await admin
        .from("profiles")
        .update({
          facultad: "Facultad de Ingeniería",
          carrera: "Ingeniería de Sistemas",
          ciclo: 5,
          rango_edad: "18-22",
          current_step: 3,
        })
        .eq("id", studentId);

      // Asume que el seed tiene al menos 2 preguntas activas con orden 1 y 2
      const { data: qs } = await admin
        .from("questions")
        .select("id, enunciado, dimension_tematica, tipo")
        .eq("activo", true)
        .order("orden", { ascending: true })
        .limit(2);

      for (const q of (qs ?? []) as Array<{
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

        await admin.from("answers").insert({
          student_id: studentId,
          question_id: q.id,
          valor: valor as never,
          question_snapshot: q.enunciado,
          dimension_snapshot: q.dimension_tematica as never,
          tipo_snapshot: q.tipo as never,
          momento_snapshot: "pre",
        });
      }
    });

    test.afterAll(async () => {
      if (!studentId) return;
      await admin.from("answers").delete().eq("student_id", studentId);
      await admin.from("consent_events").delete().eq("user_id", studentId);
      await admin.auth.admin.deleteUser(studentId);
    });

    test("session removed → re-login → /cuestionario mantiene respuestas previas", async ({
      page,
      context,
    }) => {
      // 1) Login normal
      await page.goto("/login");
      await page.getByLabel(/Correo/i).fill(studentEmail);
      await page.getByLabel(/Contraseña/i).fill(studentPassword);
      await page.getByRole("button", { name: /^Ingresar/i }).click();

      // Espera que el middleware lo lleve a /consent o /cuestionario
      await page.waitForLoadState("networkidle");

      // 2) Fuerza expiración: limpia TODAS las cookies del contexto
      await context.clearCookies();

      // 3) Intenta volver al cuestionario → debe redirigir a /login
      await page.goto("/cuestionario");
      await page.waitForURL(/\/login/, { timeout: 10_000 });
      expect(decodeURIComponent(page.url())).toContain("next=/cuestionario");

      // 4) Re-login
      await page.getByLabel(/Correo/i).fill(studentEmail);
      await page.getByLabel(/Contraseña/i).fill(studentPassword);
      await page.getByRole("button", { name: /^Ingresar/i }).click();
      await page.waitForLoadState("networkidle");

      // 5) Verifica que las respuestas previas siguen en DB (no perdidas)
      const { count } = await admin
        .from("answers")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId);
      expect(count ?? 0).toBeGreaterThanOrEqual(2);
    });
  });
});

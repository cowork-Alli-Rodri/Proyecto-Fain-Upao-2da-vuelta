/**
 * E2E — Estudiante intenta acceder al dashboard (T084).
 *
 * Cubre acceptance scenario 6 de US2: un usuario con rol `student` que entra
 * a `/dashboard` recibe redirección a `/cierre` o `/login` (no obtiene la
 * vista del docente).
 *
 * Esta prueba tiene 2 ramas:
 *  - Sin Supabase local: simplemente verifica que `/dashboard` sin sesión
 *    redirige a `/login` con `?next=/dashboard`.
 *  - Con Supabase local: crea un usuario student, hace login, y verifica
 *    que el middleware/layout lo redirige fuera del dashboard.
 */

import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isLocal =
  !!url && (url.includes("127.0.0.1") || url.includes("localhost")) && !!serviceKey;

test.describe("Dashboard access denied a estudiantes (T084)", () => {
  test("sin sesión, /dashboard redirige a /login con ?next=/dashboard", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(decodeURIComponent(page.url())).toContain("next=/dashboard");
  });

  test("sin sesión, /dashboard/export redirige a /login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/export");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(decodeURIComponent(page.url())).toContain("next=/dashboard/export");
  });

  test.describe("Con Supabase local: student logueado no entra al dashboard", () => {
    test.skip(!isLocal, "Requiere Supabase local + service role.");

    let admin: SupabaseClient<Database>;
    let studentId: string;
    let studentEmail: string;
    const studentPassword = "TestPassword!2026";

    test.beforeAll(async () => {
      admin = createClient<Database>(url!, serviceKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      studentEmail = `e2e-denied-${Date.now()}@example.test`;
      const { data: created, error } = await admin.auth.admin.createUser({
        email: studentEmail,
        password: studentPassword,
        email_confirm: true,
      });
      if (error || !created.user) throw error ?? new Error("No se creó user");
      studentId = created.user.id;
      // Garantiza rol student (default del trigger)
      await admin.from("profiles").update({ role: "student" } as never).eq("id", studentId);
    });

    test.afterAll(async () => {
      if (studentId) await admin.auth.admin.deleteUser(studentId);
    });

    test("student logueado en /dashboard recibe redirect (no ve KPIs del docente)", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.getByLabel(/Correo/i).fill(studentEmail);
      await page.getByLabel(/Contraseña/i).fill(studentPassword);
      await page.getByRole("button", { name: /^Ingresar/i }).click();
      await page.waitForLoadState("networkidle");

      // Intento directo
      await page.goto("/dashboard");
      // Layout/middleware deben redirigir fuera de /dashboard
      await page.waitForLoadState("networkidle");
      expect(page.url()).not.toMatch(/\/dashboard$/);
      // No debe mostrar elementos típicos del dashboard del docente
      const hasKpis = await page
        .getByText(/Inscritos|Completaron|Confianza promedio/i)
        .first()
        .isVisible()
        .catch(() => false);
      expect(hasKpis).toBe(false);
    });
  });
});

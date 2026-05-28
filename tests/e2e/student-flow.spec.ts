/**
 * E2E — Student onboarding + autosave (T046).
 *
 * Recorre el inicio real del flujo v2 a través de la UV:
 *   login → consent → profile → cuestionario-pre → (autosave verificado en DB)
 *
 * Alcance: el onboarding crítico y el primer guardado real bajo RLS. La
 * traversía completa pre→candidatos→post→preferencia→encuesta-final→cierre
 * involucra la revisión interactiva de /candidatos (frágil de automatizar) y
 * está cubierta a nivel de datos por los tests de integración (RLS + submit).
 *
 * Auto-skip si no detecta Supabase local + service role.
 */

import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isLocal =
  !!url && (url.includes("127.0.0.1") || url.includes("localhost")) && !!serviceKey;

test.describe("US1 student onboarding (T046)", () => {
  test.skip(!isLocal, "Requiere Supabase local + service role para crear el usuario de prueba.");

  let admin: SupabaseClient<Database>;
  let studentId: string;
  let studentEmail: string;
  const studentPassword = "TestPassword!2026";

  test.beforeAll(async () => {
    admin = createClient<Database>(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    studentEmail = `e2e-student-${Date.now()}@example.test`;
    const { data: created, error } = await admin.auth.admin.createUser({
      email: studentEmail,
      password: studentPassword,
      email_confirm: true,
    });
    if (error || !created.user) throw error ?? new Error("No se creó usuario E2E");
    studentId = created.user.id;
  });

  test.afterAll(async () => {
    if (!studentId) return;
    await admin.from("preferences").delete().eq("student_id", studentId);
    await admin.from("answers").delete().eq("student_id", studentId);
    await admin.from("consent_events").delete().eq("user_id", studentId);
    await admin.auth.admin.deleteUser(studentId);
  });

  test("login → consent → profile → cuestionario-pre con autosave", async ({ page }) => {
    // 1) Login
    await page.goto("/login");
    await expect(page).toHaveTitle(/Ingresar/i);
    await page.getByLabel(/Correo/i).fill(studentEmail);
    await page.getByLabel(/Contraseña/i).fill(studentPassword);
    await page.getByRole("button", { name: /^Ingresar/i }).click();

    // 2) Consent — el callback redirige aquí (sin registro de consentimiento).
    await page.waitForURL(/\/consent(\?|$)/, { timeout: 15_000 });
    // El botón está deshabilitado hasta marcar ambos checkboxes obligatorios.
    const checkboxes = page.getByRole("checkbox");
    const count = await checkboxes.count();
    for (let i = 0; i < count; i += 1) await checkboxes.nth(i).check();
    await page.getByRole("button", { name: /Acepto y continuar/i }).click();

    // 3) Profile
    await page.waitForURL(/\/profile(\?|$)/, { timeout: 15_000 });
    await page.getByLabel(/Nombres/i).fill("María Lucía");
    await page.getByLabel(/Apellidos/i).fill("Vásquez Torres");
    await selectByTrigger(page, "facultad", "Ingeniería");
    await selectByTrigger(page, "carrera", "Ingeniería de Software");
    await selectByTrigger(page, "ciclo", "Ciclo 5");
    await selectByTrigger(page, "rangoEdad", "20-22 años");
    await page.getByRole("button", { name: /Guardar y comenzar/i }).click();

    // 4) Cuestionario pre
    await page.waitForURL(/\/cuestionario-pre/, { timeout: 15_000 });

    // Responde la primera pregunta. El likert se renderiza como botones
    // aria-pressed (no radios nativos); también cubre single-choice.
    const options = page.locator("button[aria-pressed]");
    await expect(options.first()).toBeVisible({ timeout: 10_000 });
    const total = await options.count();
    await options.nth(Math.min(2, total - 1)).click();
    await page.waitForLoadState("networkidle").catch(() => undefined);

    // 5) Verifica que el autosave persistió la respuesta en DB (bajo RLS).
    await expect
      .poll(
        async () => {
          const { data } = await admin
            .from("answers")
            .select("id")
            .eq("student_id", studentId)
            .eq("momento_snapshot", "pre");
          return (data ?? []).length;
        },
        { timeout: 10_000, intervals: [500, 1000, 1500] },
      )
      .toBeGreaterThan(0);
  });
});

/**
 * Selecciona una opción de un Radix Select identificado por el id de su trigger.
 */
async function selectByTrigger(page: Page, triggerId: string, optionName: string) {
  await page.locator(`#${triggerId}`).click();
  await page.getByRole("option", { name: optionName, exact: true }).click();
}

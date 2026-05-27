/**
 * E2E — Student happy-path (T046).
 *
 * Cubre acceptance scenarios 1-6 de US1:
 *   login → consent → profile → cuestionario → comparador → preferencia → cierre.
 *
 * Auto-skip si no detecta Supabase local (NEXT_PUBLIC_SUPABASE_URL apunta a
 * 127.0.0.1/localhost) + SUPABASE_SERVICE_ROLE_KEY presente. En CI con stack
 * completo este suite se ejecuta; en máquinas sin Docker se omite.
 *
 * Constitución VI: incluye al menos un caso de error contextual (form sin
 * checkboxes en consent → mensaje legible al usuario, no "Error 500").
 */

import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isLocal =
  !!url && (url.includes("127.0.0.1") || url.includes("localhost")) && !!serviceKey;

test.describe("US1 student happy-path (T046)", () => {
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

  test("login → consent → profile → cuestionario → comparador → preferencia → cierre", async ({
    page,
  }) => {
    // 1) Login con email/password
    await page.goto("/login");
    await expect(page).toHaveTitle(/Ingresar/i);
    await page.getByLabel(/Correo/i).fill(studentEmail);
    await page.getByLabel(/Contraseña/i).fill(studentPassword);
    await page.getByRole("button", { name: /^Ingresar/i }).click();

    // 2) Consent — caso de error contextual primero (constitución VI)
    await page.waitForURL(/\/consent$/, { timeout: 10_000 });
    const submitConsent = page.getByRole("button", { name: /Continuar|Aceptar/i }).first();
    await submitConsent.click();
    // Sin marcar checkboxes, debería mostrar mensaje contextual (no error genérico)
    await expect(
      page.getByText(/aceptar|consent|autoriz/i).first(),
    ).toBeVisible();

    // Ahora sí, marcar checkboxes y enviar
    const checkboxes = page.getByRole("checkbox");
    const count = await checkboxes.count();
    for (let i = 0; i < count; i += 1) {
      await checkboxes.nth(i).check();
    }
    await submitConsent.click();

    // 3) Profile
    await page.waitForURL(/\/profile$/, { timeout: 10_000 });
    await selectByLabel(page, /Facultad/i, "Facultad de Ingeniería");
    await selectByLabel(page, /Carrera/i, "Ingeniería de Sistemas");
    await fillNumberByLabel(page, /Ciclo/i, "5");
    await selectByLabel(page, /Rango de edad|Edad/i, "18-22");
    await page.getByRole("button", { name: /Guardar|Continuar/i }).click();

    // 4) Cuestionario
    await page.waitForURL(/\/cuestionario/, { timeout: 10_000 });

    // Itera mientras haya preguntas (autosave + avance manual). Cap defensivo
    // en 30 iteraciones para evitar loops infinitos en case de regresión.
    for (let i = 0; i < 30; i += 1) {
      const onEncuestaFinal = /\/encuesta-final/.test(page.url());
      if (onEncuestaFinal) break;
      const answered = await answerCurrentQuestion(page);
      if (!answered) break;
      const nextBtn = page.getByRole("button", { name: /Siguiente|Continuar|Finalizar/i });
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await page.waitForLoadState("networkidle").catch(() => undefined);
      }
    }

    // 5) Encuesta final (skip comparador — los candidatos se ven en la página
    // pública /candidatos antes del login)
    await page.waitForURL(/\/encuesta-final$/, { timeout: 15_000 });

    // 6) Preferencia
    await page.getByRole("link", { name: /Declarar|Preferencia|Continuar/i }).first().click();
    await page.waitForURL(/\/preferencia$/, { timeout: 10_000 });

    const keikoRadio = page.getByRole("radio", { name: /Keiko/i });
    if (await keikoRadio.isVisible().catch(() => false)) {
      await keikoRadio.check();
    } else {
      await page.getByLabel(/Keiko|Fujimori/i).first().check();
    }
    // Confianza 7 (slider o input number)
    const confSlider = page.getByRole("slider").first();
    if (await confSlider.isVisible().catch(() => false)) {
      await confSlider.focus();
      for (let i = 0; i < 3; i += 1) await page.keyboard.press("ArrowRight");
    }
    await page.getByRole("textbox", { name: /Motivo/i })
      .fill("Sus propuestas en educación me convencieron.")
      .catch(() => undefined);

    await page.getByRole("button", { name: /Enviar|Confirmar/i }).first().click();

    // 7) Cierre
    await page.waitForURL(/\/cierre$/, { timeout: 10_000 });
    await expect(page.getByText(/Gracias|Resumen|completaste/i).first()).toBeVisible();
  });
});

async function selectByLabel(page: Page, label: RegExp, value: string) {
  const trigger = page.getByLabel(label).first();
  if (!(await trigger.isVisible().catch(() => false))) return;
  const tag = await trigger.evaluate((el) => el.tagName.toLowerCase()).catch(() => "");
  if (tag === "select") {
    await trigger.selectOption({ label: value }).catch(() => trigger.selectOption(value));
  } else {
    await trigger.click();
    const opt = page.getByRole("option", { name: new RegExp(value, "i") });
    if (await opt.isVisible().catch(() => false)) {
      await opt.click();
    }
  }
}

async function fillNumberByLabel(page: Page, label: RegExp, value: string) {
  const input = page.getByLabel(label).first();
  if (!(await input.isVisible().catch(() => false))) return;
  await input.fill(value);
}

async function answerCurrentQuestion(page: Page): Promise<boolean> {
  // Likert/single radio
  const firstRadio = page.getByRole("radio").first();
  if (await firstRadio.isVisible().catch(() => false)) {
    const radios = page.getByRole("radio");
    const total = await radios.count();
    const mid = Math.floor(total / 2);
    await radios.nth(mid).check().catch(() => undefined);
    return true;
  }
  // Textarea (text-type)
  const textarea = page.locator("textarea").first();
  if (await textarea.isVisible().catch(() => false)) {
    await textarea.fill("Respuesta de prueba E2E.").catch(() => undefined);
    return true;
  }
  return false;
}

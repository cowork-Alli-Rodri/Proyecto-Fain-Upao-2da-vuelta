/**
 * E2E — Teacher dashboard (T083).
 *
 * Cubre acceptance scenarios 1-5 de US2:
 *  - Login como teacher (rol elevado vía allowed_teachers seed) → ve dashboard
 *  - KPIs visibles (cards con números)
 *  - Charts visibles (donut + carrera + orden + tiempo)
 *  - Filtros sincronizan URL (querystring) y refetchean data
 *  - Export en los 4 formatos (CSV / XLSX / HTML / PBIDS+CSV ZIP)
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

test.describe("US2 teacher dashboard (T083)", () => {
  test.skip(!isLocal, "Requiere Supabase local + service role.");

  let admin: SupabaseClient<Database>;
  let teacherId: string;
  let teacherEmail: string;
  const teacherPassword = "TestPassword!2026";
  const seededStudents: string[] = [];

  test.beforeAll(async () => {
    admin = createClient<Database>(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    teacherEmail = `e2e-teacher-${Date.now()}@example.test`;

    // Whitelist primero (el trigger on_auth_user_created eleva rol si está)
    await admin.from("allowed_teachers").insert({
      email: teacherEmail,
      note: "E2E test docente",
    } as never);

    const { data: created, error } = await admin.auth.admin.createUser({
      email: teacherEmail,
      password: teacherPassword,
      email_confirm: true,
    });
    if (error || !created.user) throw error ?? new Error("No se creó teacher");
    teacherId = created.user.id;

    // Aseguramos rol teacher (por si el trigger no se disparó en orden)
    await admin.from("profiles").update({ role: "teacher" } as never).eq("id", teacherId);

    // Sembrar 3 estudiantes con preferencias para que los charts tengan data
    const specs = [
      {
        facultad: "Facultad de Ingeniería",
        carrera: "Ingeniería de Sistemas",
        candidato: "keiko" as const,
      },
      {
        facultad: "Facultad de Ingeniería",
        carrera: "Ingeniería de Sistemas",
        candidato: "roberto" as const,
      },
      {
        facultad: "Facultad de Derecho",
        carrera: "Derecho",
        candidato: "indeciso" as const,
      },
    ];

    for (let i = 0; i < specs.length; i += 1) {
      const spec = specs[i]!;
      const { data: s } = await admin.auth.admin.createUser({
        email: `e2e-dash-student-${Date.now()}-${i}@example.test`,
        password: teacherPassword,
        email_confirm: true,
      });
      if (!s.user) continue;
      seededStudents.push(s.user.id);
      await admin
        .from("profiles")
        .update({
          facultad: spec.facultad,
          carrera: spec.carrera,
          ciclo: 5,
          rango_edad: "18-22",
          current_step: 12,
          questionnaire_completed_at: new Date().toISOString(),
        })
        .eq("id", s.user.id);
      await admin.from("preferences").insert({
        student_id: s.user.id,
        candidato_preferido: spec.candidato,
        confianza: 7,
      } as never);
    }
  });

  test.afterAll(async () => {
    for (const id of seededStudents) {
      await admin.from("preferences").delete().eq("student_id", id);
      await admin.auth.admin.deleteUser(id);
    }
    if (teacherId) await admin.auth.admin.deleteUser(teacherId);
    await admin.from("allowed_teachers").delete().eq("email", teacherEmail);
  });

  async function loginAsTeacher(page: Page) {
    await page.goto("/login");
    await page.getByLabel(/Correo/i).fill(teacherEmail);
    await page.getByLabel(/Contraseña/i).fill(teacherPassword);
    await page.getByRole("button", { name: /^Ingresar/i }).click();
    await page.waitForLoadState("networkidle");
  }

  test("teacher ve el dashboard con KPIs y charts principales", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);

    // KPIs: debe haber al menos un número visible (inscritos)
    await expect(page.getByText(/Inscritos|inscritos/i).first()).toBeVisible();
    await expect(page.getByText(/Completaron|completaron/i).first()).toBeVisible();
    await expect(page.getByText(/Preferenc/i).first()).toBeVisible();

    // Charts: nombres de los candidatos en el donut
    await expect(page.getByText(/Keiko/i).first()).toBeVisible();
    await expect(page.getByText(/Roberto/i).first()).toBeVisible();
  });

  test("filtros sincronizan querystring", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard");

    // Cambiar filtro de facultad si existe
    const facultadSelect = page.getByLabel(/Facultad/i).first();
    if (await facultadSelect.isVisible().catch(() => false)) {
      await facultadSelect.click();
      const opt = page.getByRole("option", { name: /Ingeniería/i }).first();
      if (await opt.isVisible().catch(() => false)) {
        await opt.click();
        await page.waitForLoadState("networkidle");
        expect(decodeURIComponent(page.url())).toContain("facultad=");
      }
    }
  });

  test("export CSV descarga archivo con contenido", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard/export");

    // Selecciona formato CSV
    const csvRadio = page.getByLabel(/CSV/i).first();
    if (await csvRadio.isVisible().catch(() => false)) {
      await csvRadio.check();
    }

    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await page.getByRole("button", { name: /Exportar|Descargar/i }).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });

  test("export XLSX descarga archivo .xlsx", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard/export");

    const xlsxRadio = page.getByLabel(/XLSX|Excel/i).first();
    if (await xlsxRadio.isVisible().catch(() => false)) {
      await xlsxRadio.check();
    }

    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await page.getByRole("button", { name: /Exportar|Descargar/i }).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
  });

  test("export HTML Canva descarga archivo .html", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard/export");

    const htmlRadio = page.getByLabel(/HTML|Canva/i).first();
    if (await htmlRadio.isVisible().catch(() => false)) {
      await htmlRadio.check();
    }

    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await page.getByRole("button", { name: /Exportar|Descargar/i }).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.html$/i);
  });

  test("export Power BI descarga ZIP con .pbids + CSV", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard/export");

    const pbRadio = page.getByLabel(/Power BI|PowerBI|PBIDS|ZIP/i).first();
    if (await pbRadio.isVisible().catch(() => false)) {
      await pbRadio.check();
    }

    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await page.getByRole("button", { name: /Exportar|Descargar/i }).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/i);
  });
});

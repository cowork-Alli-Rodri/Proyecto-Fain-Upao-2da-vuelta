/**
 * Script CLI: resetea las encuestas respondidas de los estudiantes REALES
 * (no demo) que ya respondieron, para que puedan volver a hacer el flujo.
 *
 * Uso:
 *   pnpm tsx --env-file=.env.local scripts/reset-answered-surveys.ts            # dry-run (solo lista)
 *   pnpm tsx --env-file=.env.local scripts/reset-answered-surveys.ts --confirm  # ejecuta el reseteo
 *
 * "Resetear encuesta respondida" = borrar answers (pre+post) + preferences y
 * limpiar los hitos de flujo en profiles (pre / candidatos / post). MANTIENE la
 * cuenta auth.users, el consentimiento y la demografía del perfil. El estudiante
 * vuelve a empezar desde el cuestionario PRE.
 *
 * Excluye demos (demo-NNNN@voto-informado.test), no estudiantes (teacher/admin)
 * y perfiles ya anonimizados.
 */

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/supabase/database.types";

const DEMO_EMAIL_PATTERN = "demo-%@voto-informado.test";

async function main() {
  const confirm = process.argv.includes("--confirm");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    process.exit(1);
  }

  console.warn(`Entorno objetivo: ${url}`);
  console.warn(confirm ? "Modo: EJECUCION (--confirm)" : "Modo: DRY-RUN (no borra nada)");

  const supabase = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Estudiantes reales (no demo, no anonimizados, rol student).
  const { data: students, error: studentsErr } = await supabase
    .from("profiles")
    .select(
      "id, email, current_step, current_step_pre, current_step_post, " +
        "questionnaire_completed_at, questionnaire_pre_completed_at, " +
        "candidatos_completed_at, questionnaire_post_completed_at",
    )
    .eq("role", "student")
    .eq("is_anonymized", false)
    .not("email", "like", DEMO_EMAIL_PATTERN);

  if (studentsErr) {
    console.error("Error listando estudiantes:", studentsErr.message);
    process.exit(1);
  }

  const list = (students ?? []) as Array<{
    id: string;
    email: string | null;
    current_step: number;
    current_step_pre: number;
    current_step_post: number;
    questionnaire_completed_at: string | null;
    questionnaire_pre_completed_at: string | null;
    candidatos_completed_at: string | null;
    questionnaire_post_completed_at: string | null;
  }>;

  // 2. Conteo de answers por estudiante.
  const { data: answers, error: answersErr } = await supabase
    .from("answers")
    .select("student_id");

  if (answersErr) {
    console.error("Error listando answers:", answersErr.message);
    process.exit(1);
  }

  const answerCount = new Map<string, number>();
  for (const a of (answers ?? []) as Array<{ student_id: string }>) {
    answerCount.set(a.student_id, (answerCount.get(a.student_id) ?? 0) + 1);
  }

  // 3. Estudiantes con preferencia registrada.
  const { data: prefs, error: prefsErr } = await supabase
    .from("preferences")
    .select("student_id");

  if (prefsErr) {
    console.error("Error listando preferences:", prefsErr.message);
    process.exit(1);
  }

  const hasPref = new Set(
    ((prefs ?? []) as Array<{ student_id: string }>).map((p) => p.student_id),
  );

  // 4. Filtrar: respondió si tiene answers, preferencia, o algún hito/avance de flujo.
  const targets = list.filter((s) => {
    const respondio =
      (answerCount.get(s.id) ?? 0) > 0 ||
      hasPref.has(s.id) ||
      s.questionnaire_completed_at !== null ||
      s.questionnaire_pre_completed_at !== null ||
      s.candidatos_completed_at !== null ||
      s.questionnaire_post_completed_at !== null ||
      s.current_step > 0 ||
      s.current_step_pre > 0 ||
      s.current_step_post > 0;
    return respondio;
  });

  if (targets.length === 0) {
    console.warn("No hay estudiantes reales con encuestas para resetear.");
    return;
  }

  console.warn(`\nEstudiantes a resetear: ${targets.length}`);
  for (const s of targets) {
    console.warn(
      `  - ${s.email ?? s.id}  ·  answers=${answerCount.get(s.id) ?? 0}  ·  pref=${hasPref.has(s.id) ? "si" : "no"}`,
    );
  }

  if (!confirm) {
    console.warn("\nDRY-RUN. Para ejecutar el reseteo corre el script con --confirm");
    return;
  }

  // 5. Reseteo por estudiante.
  let ok = 0;
  for (const s of targets) {
    const { error: delAns } = await supabase
      .from("answers")
      .delete()
      .eq("student_id", s.id);
    if (delAns) {
      console.error(`  ✗ ${s.email}: answers — ${delAns.message}`);
      continue;
    }

    const { error: delPref } = await supabase
      .from("preferences")
      .delete()
      .eq("student_id", s.id);
    if (delPref) {
      console.error(`  ✗ ${s.email}: preferences — ${delPref.message}`);
      continue;
    }

    const { error: updErr } = await supabase
      .from("profiles")
      .update({
        current_step: 0,
        current_step_pre: 0,
        current_step_post: 0,
        questionnaire_completed_at: null,
        questionnaire_pre_completed_at: null,
        candidatos_dimensions_viewed: [],
        candidatos_completed_at: null,
        questionnaire_post_completed_at: null,
      })
      .eq("id", s.id);
    if (updErr) {
      console.error(`  ✗ ${s.email}: profile flow — ${updErr.message}`);
      continue;
    }

    ok++;
  }

  console.warn(`\nOK · ${ok}/${targets.length} estudiantes reseteados.`);
  console.warn("Cuenta, consentimiento y demografía conservados. Reinician desde el cuestionario PRE.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

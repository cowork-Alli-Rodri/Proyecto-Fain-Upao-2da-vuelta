import { redirect } from "next/navigation";

import { createClient } from "../supabase/server";

/**
 * Helpers de sesión y resolución del flujo del estudiante.
 *
 * Flow v2 (pivote pre/post):
 *   1. profile incompleto       → /profile
 *   2. pre no completo          → /cuestionario-pre/{step}
 *   3. candidatos no completos  → /candidatos
 *   4. post no completo         → /cuestionario-post/{step}
 *   5. sin preferencia          → /preferencia
 *   6. sin encuesta final       → /encuesta-final
 *   7. todo listo               → /cierre
 *
 * Backwards-compat: los users v1 que tenían questionnaire_completed_at fueron
 * backfilled a questionnaire_pre_completed_at (migration 20260527000004). Para
 * ellos el flujo arranca desde el paso 3 (/candidatos).
 */

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

export async function getOptionalUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

interface ProfileFlowState {
  role: "student" | "teacher" | "admin";
  facultad: string | null;
  questionnaire_pre_completed_at: string | null;
  candidatos_completed_at: string | null;
  questionnaire_post_completed_at: string | null;
  current_step_pre: number;
  current_step_post: number;
}

/**
 * Restaura el contexto del estudiante tras re-login o resuelve el siguiente
 * paso del flujo v2. Devuelve la ruta exacta a redirigir.
 */
export async function resolveStudentResumePath(userId: string): Promise<string> {
  const supabase = await createClient();

  const [{ data: profileRaw }, { data: pref }, { data: postSurvey }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "role, facultad, questionnaire_pre_completed_at, candidatos_completed_at, questionnaire_post_completed_at, current_step_pre, current_step_post",
      )
      .eq("id", userId)
      .single(),
    supabase
      .from("preferences")
      .select("student_id")
      .eq("student_id", userId)
      .maybeSingle(),
    supabase
      .from("post_surveys" as never)
      .select("student_id")
      .eq("student_id", userId)
      .maybeSingle(),
  ]);

  if (!profileRaw) return "/login";
  const profile = profileRaw as unknown as ProfileFlowState;

  // Staff: nunca vive en el flujo de estudiante. Admin aterriza en su panel;
  // teacher va directo al dashboard del curso.
  if (profile.role === "admin") return "/admin";
  if (profile.role !== "student") return "/dashboard";

  // 1. Perfil incompleto
  if (!profile.facultad) return "/profile";

  // 2. Bloque pre
  if (!profile.questionnaire_pre_completed_at) {
    const next = profile.current_step_pre > 0 ? profile.current_step_pre : 1;
    return `/cuestionario-pre/${next}`;
  }

  // 3. Revisión de candidatos
  if (!profile.candidatos_completed_at) return "/candidatos";

  // 4. Bloque post
  if (!profile.questionnaire_post_completed_at) {
    const next = profile.current_step_post > 0 ? profile.current_step_post : 1;
    return `/cuestionario-post/${next}`;
  }

  // 5. Preferencia
  if (!pref) return "/preferencia";

  // 6. Encuesta final
  if (!postSurvey) return "/encuesta-final";

  // 7. Cierre
  return "/cierre";
}

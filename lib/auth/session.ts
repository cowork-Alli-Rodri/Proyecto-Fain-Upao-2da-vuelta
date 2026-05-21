import { redirect } from "next/navigation";

import { createClient } from "../supabase/server";

/**
 * Helpers de sesión 24h (FR-003).
 *
 * La expiración de sesión la maneja Supabase Auth con JWT short-lived +
 * refresh token. Estos helpers son utilitarios para RSCs que necesitan
 * forzar autenticación o restaurar el contexto del estudiante donde quedó.
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

/**
 * Restaura el contexto del estudiante tras re-login (edge case "Sesión expirada"):
 * lee profiles.current_step y questionnaire_completed_at y decide a dónde llevar.
 */
export async function resolveStudentResumePath(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("current_step, questionnaire_completed_at, facultad, role")
    .eq("id", userId)
    .single();

  if (!data) return "/login";

  const profile = data as unknown as {
    current_step: number;
    questionnaire_completed_at: string | null;
    facultad: string | null;
    role: "student" | "teacher" | "admin";
  };

  if (profile.role !== "student") return "/dashboard";
  if (!profile.facultad) return "/profile";
  if (profile.questionnaire_completed_at) return "/comparador";
  if (profile.current_step > 0) return `/cuestionario/${profile.current_step}`;
  return "/cuestionario";
}

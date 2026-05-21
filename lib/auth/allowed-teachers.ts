import { createAdminClient } from "../supabase/admin";

/**
 * Helpers para gestionar la whitelist `allowed_teachers` (Q1, FR-024a).
 * Uso restringido a admin via server actions o scripts CLI.
 *
 * Para verificar si un correo está en la lista, NO uses estos helpers desde
 * código cliente — la verificación al login la hace el trigger PostgreSQL
 * `on_auth_user_created` (ver migración 0004_triggers.sql).
 */

export async function listAllowedTeachers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("allowed_teachers")
    .select("email, added_by, added_at, note")
    .order("added_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addAllowedTeacher(
  email: string,
  addedBy: string | null,
  note?: string,
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("allowed_teachers")
    .insert({ email: email.toLowerCase(), added_by: addedBy, note: note ?? null });

  if (error) throw error;

  // Si ya existe un profile con ese correo, elevarlo a teacher.
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "teacher" })
    .eq("email", email.toLowerCase())
    .eq("role", "student");

  if (updateError) throw updateError;
}

export async function removeAllowedTeacher(email: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("allowed_teachers")
    .delete()
    .eq("email", email.toLowerCase());

  if (error) throw error;
}

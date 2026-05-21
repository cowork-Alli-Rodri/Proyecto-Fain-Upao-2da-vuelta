import { cache } from "react";

import type { UserRole } from "../errors";
import { createClient } from "../supabase/server";

/**
 * Resolución del rol del usuario autenticado actual.
 *
 * Usa React `cache()` para deduplicar la consulta dentro de un mismo request
 * (varias páginas/componentes pueden invocarla sin pagar costos).
 */

export const getCurrentRole = cache(async (): Promise<UserRole | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return (data as unknown as { role: UserRole }).role;
});

export async function isStudent(): Promise<boolean> {
  return (await getCurrentRole()) === "student";
}

export async function isTeacher(): Promise<boolean> {
  const r = await getCurrentRole();
  return r === "teacher" || r === "admin";
}

export async function isAdmin(): Promise<boolean> {
  return (await getCurrentRole()) === "admin";
}

/**
 * Asegura que el usuario actual tenga al menos uno de los roles requeridos.
 * Lanza si no, para que el RSC se trunque y middleware/layout maneje el redirect.
 */
export async function assertRole(...allowed: UserRole[]): Promise<UserRole> {
  const role = await getCurrentRole();
  if (!role || !allowed.includes(role)) {
    throw new Error(`Acceso denegado: rol requerido ${allowed.join(" o ")}`);
  }
  return role;
}

"use server";

import { revalidatePath } from "next/cache";

import {
  addAllowedTeacher,
  removeAllowedTeacher,
} from "@/lib/auth/allowed-teachers";
import {
  addAllowedTeacherSchema,
  demoteTeacherSchema,
  removeAllowedTeacherSchema,
} from "@/lib/validation/teacher.schema";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth/role";
import { err, ok, type AppError, type Result } from "@/lib/errors";
import { logger } from "@/lib/utils/logger";

async function requireAdmin(): Promise<Result<{ userId: string }, AppError>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "Unauthenticated" });
  if (!(await isAdmin())) return err({ code: "ForbiddenRole", required: "admin" });
  return ok({ userId: user.id });
}

function firstZodMessage(issue: { path: PropertyKey[]; message: string }) {
  const head = issue.path[0];
  return {
    field: head === undefined ? "" : String(head),
    message: issue.message,
  };
}

export async function addAllowedTeacherAction(
  input: unknown,
): Promise<Result<{ email: string }, AppError>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const correlationId = logger.correlationId();

  const parsed = addAllowedTeacherSchema.safeParse(input);
  if (!parsed.success) {
    const { field, message } = firstZodMessage(parsed.error.issues[0]!);
    return err({ code: "ValidationError", field, message });
  }

  // Verificar duplicado para devolver mensaje legible (RLS no devuelve detalle).
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("allowed_teachers")
    .select("email")
    .eq("email", parsed.data.email)
    .maybeSingle();
  if (existing) {
    return err({
      code: "ValidationError",
      field: "email",
      message: "Ese correo ya está habilitado como docente.",
    });
  }

  try {
    await addAllowedTeacher(parsed.data.email, guard.value.userId, parsed.data.note || undefined);
  } catch (e) {
    logger.error("addAllowedTeacher failed", {
      correlationId,
      cause: e instanceof Error ? e.message : "unknown",
    });
    return err({ code: "Unexpected", correlationId });
  }

  revalidatePath("/admin/teachers");
  return ok({ email: parsed.data.email });
}

export async function removeAllowedTeacherAction(
  input: unknown,
): Promise<Result<{ email: string }, AppError>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const correlationId = logger.correlationId();

  const parsed = removeAllowedTeacherSchema.safeParse(input);
  if (!parsed.success) {
    const { field, message } = firstZodMessage(parsed.error.issues[0]!);
    return err({ code: "ValidationError", field, message });
  }

  try {
    await removeAllowedTeacher(parsed.data.email);
  } catch (e) {
    logger.error("removeAllowedTeacher failed", {
      correlationId,
      cause: e instanceof Error ? e.message : "unknown",
    });
    return err({ code: "Unexpected", correlationId });
  }

  revalidatePath("/admin/teachers");
  return ok({ email: parsed.data.email });
}

/**
 * Baja a `student` a un usuario que actualmente es `teacher`. La whitelist
 * `allowed_teachers` no se toca aquí — eso lo hace `removeAllowedTeacherAction`.
 * Si el correo sigue en la whitelist, el trigger lo volverá a elevar al
 * próximo login: por convención se llama esta acción JUNTO con la remoción.
 */
export async function demoteTeacherAction(
  input: unknown,
): Promise<Result<{ userId: string }, AppError>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const correlationId = logger.correlationId();

  const parsed = demoteTeacherSchema.safeParse(input);
  if (!parsed.success) {
    const { field, message } = firstZodMessage(parsed.error.issues[0]!);
    return err({ code: "ValidationError", field, message });
  }

  if (parsed.data.userId === guard.value.userId) {
    return err({
      code: "ValidationError",
      field: "userId",
      message: "No puedes bajar tu propio rol desde esta UI.",
    });
  }

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", parsed.data.userId)
    .maybeSingle();
  const profile = target as { id: string; role: string } | null;
  if (!profile) return err({ code: "NotFound", entity: "profile" });
  if (profile.role !== "teacher") {
    return err({
      code: "ValidationError",
      field: "userId",
      message: "Ese usuario no es docente activo.",
    });
  }

  const { error } = await admin
    .from("profiles")
    .update({ role: "student" })
    .eq("id", parsed.data.userId);
  if (error) {
    logger.error("demoteTeacher failed", { correlationId, dbCode: error.code });
    return err({ code: "Unexpected", correlationId });
  }

  revalidatePath("/admin/teachers");
  return ok({ userId: parsed.data.userId });
}

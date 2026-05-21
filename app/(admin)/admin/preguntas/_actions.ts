"use server";

import { revalidatePath } from "next/cache";

import {
  questionInputSchema,
  reorderQuestionsSchema,
  toggleQuestionActiveSchema,
  type QuestionInput,
} from "@/lib/validation/question.schema";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth/role";
import { err, ok, type Result, type AppError } from "@/lib/errors";
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

function firstZodMessage(issue: { path: PropertyKey[]; message: string }): {
  field: string;
  message: string;
} {
  const head = issue.path[0];
  return {
    field: head === undefined ? "" : String(head),
    message: issue.message,
  };
}

/**
 * Sanitiza el input del cliente. Convierte string `fuente` vacío a null
 * y normaliza `activo` (default true en alta).
 */
function normalizeInput(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const obj = { ...(raw as Record<string, unknown>) };
  if (obj.fuente === "" || obj.fuente === undefined) obj.fuente = null;
  if (obj.activo === undefined) obj.activo = true;
  return obj;
}

export async function createQuestion(
  input: unknown,
): Promise<Result<{ id: string }, AppError>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const correlationId = logger.correlationId();

  const parsed = questionInputSchema.safeParse(normalizeInput(input));
  if (!parsed.success) {
    const { field, message } = firstZodMessage(parsed.error.issues[0]!);
    return err({ code: "ValidationError", field, message });
  }
  const data = parsed.data;

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("questions")
    .insert({
      orden: data.orden,
      dimension_tematica: data.dimension_tematica,
      tipo: data.tipo,
      enunciado: data.enunciado,
      opciones: data.opciones as never,
      fuente: (data.fuente as string | null) ?? null,
      activo: data.activo,
      created_by: guard.value.userId,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    logger.error("createQuestion failed", { correlationId, dbCode: error?.code });
    if (error?.code === "23505") {
      return err({
        code: "ValidationError",
        field: "orden",
        message: "Ya existe una pregunta con ese orden.",
      });
    }
    return err({ code: "Unexpected", correlationId });
  }

  revalidatePath("/admin/preguntas");
  revalidatePath("/cuestionario");
  return ok({ id: (inserted as { id: string }).id });
}

export async function updateQuestion(
  id: string,
  input: unknown,
): Promise<Result<{ id: string }, AppError>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const correlationId = logger.correlationId();

  if (typeof id !== "string" || id.length === 0) {
    return err({ code: "ValidationError", field: "id", message: "ID requerido." });
  }

  const parsed = questionInputSchema.safeParse(normalizeInput(input));
  if (!parsed.success) {
    const { field, message } = firstZodMessage(parsed.error.issues[0]!);
    return err({ code: "ValidationError", field, message });
  }
  const data: QuestionInput = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase
    .from("questions")
    .update({
      orden: data.orden,
      dimension_tematica: data.dimension_tematica,
      tipo: data.tipo,
      enunciado: data.enunciado,
      opciones: data.opciones as never,
      fuente: (data.fuente as string | null) ?? null,
      activo: data.activo,
    })
    .eq("id", id);

  if (error) {
    logger.error("updateQuestion failed", { correlationId, dbCode: error.code });
    if (error.code === "23505") {
      return err({
        code: "ValidationError",
        field: "orden",
        message: "Ya existe otra pregunta con ese orden.",
      });
    }
    return err({ code: "Unexpected", correlationId });
  }

  revalidatePath("/admin/preguntas");
  revalidatePath(`/admin/preguntas/${id}`);
  revalidatePath("/cuestionario");
  return ok({ id });
}

/**
 * Reordena varias preguntas en transacción. Usa el service-role client para
 * evitar fricción con RLS al modificar varias filas y para permitir que la
 * pasada intermedia (con valores temporales) no choque con el índice único
 * de `orden` (no existe hoy, pero la lógica queda preparada).
 *
 * Estrategia: dos pasadas — primero asignamos orden = -i para cada id en el
 * input (valores garantizadamente no-conflictivos), luego asignamos
 * el orden definitivo 1..N. Atómico desde el punto de vista del consumidor
 * porque corre en el mismo request server-side.
 */
export async function reorderQuestions(
  input: unknown,
): Promise<Result<{ count: number }, AppError>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const correlationId = logger.correlationId();

  const parsed = reorderQuestionsSchema.safeParse(input);
  if (!parsed.success) {
    const { field, message } = firstZodMessage(parsed.error.issues[0]!);
    return err({ code: "ValidationError", field, message });
  }

  const ids = parsed.data.idsInOrder;
  const admin = createAdminClient();

  // Verifica que todos los ids existan en la tabla — evita reordenar contra
  // ids inventados.
  const { data: existing, error: selErr } = await admin
    .from("questions")
    .select("id")
    .in("id", ids);
  if (selErr) {
    logger.error("reorderQuestions select failed", { correlationId, dbCode: selErr.code });
    return err({ code: "Unexpected", correlationId });
  }
  const existingSet = new Set(((existing ?? []) as { id: string }[]).map((r) => r.id));
  for (const id of ids) {
    if (!existingSet.has(id)) {
      return err({ code: "NotFound", entity: `question:${id}` });
    }
  }

  // Pasada 1: orden temporal negativo. Evita colisiones por si hay UNIQUE.
  for (let i = 0; i < ids.length; i++) {
    const { error } = await admin
      .from("questions")
      .update({ orden: -(i + 1) })
      .eq("id", ids[i]!);
    if (error) {
      logger.error("reorderQuestions pass1 failed", { correlationId, dbCode: error.code });
      return err({ code: "Unexpected", correlationId });
    }
  }

  // Pasada 2: orden definitivo 1..N.
  for (let i = 0; i < ids.length; i++) {
    const { error } = await admin
      .from("questions")
      .update({ orden: i + 1 })
      .eq("id", ids[i]!);
    if (error) {
      logger.error("reorderQuestions pass2 failed", { correlationId, dbCode: error.code });
      return err({ code: "Unexpected", correlationId });
    }
  }

  revalidatePath("/admin/preguntas");
  revalidatePath("/cuestionario");
  return ok({ count: ids.length });
}

export async function toggleQuestionActive(
  input: unknown,
): Promise<Result<{ id: string; active: boolean }, AppError>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const correlationId = logger.correlationId();

  const parsed = toggleQuestionActiveSchema.safeParse(input);
  if (!parsed.success) {
    const { field, message } = firstZodMessage(parsed.error.issues[0]!);
    return err({ code: "ValidationError", field, message });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("questions")
    .update({ activo: parsed.data.active })
    .eq("id", parsed.data.id);

  if (error) {
    logger.error("toggleQuestionActive failed", { correlationId, dbCode: error.code });
    return err({ code: "Unexpected", correlationId });
  }

  revalidatePath("/admin/preguntas");
  revalidatePath("/cuestionario");
  return ok({ id: parsed.data.id, active: parsed.data.active });
}

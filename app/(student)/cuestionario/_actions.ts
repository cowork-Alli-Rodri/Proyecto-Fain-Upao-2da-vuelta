"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { answerValueByType, saveAnswerSchema, type AnswerType } from "@/lib/validation/answer.schema";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit/upstash";
import { logger } from "@/lib/utils/logger";
import { err, ok, type Result } from "@/lib/errors";

type DimCuestionario = "educacion" | "juventud" | "trabajo" | "economia" | "social_publicas";
type DimJne = "social" | "economica" | "ambiental" | "institucional";

interface QuestionRecord {
  id: string;
  enunciado: string;
  dimension_tematica: DimJne;
  dimension_cuestionario: DimCuestionario | null;
  momento: "pre" | "post" | "both";
  tipo: AnswerType;
  orden: number;
  activo: boolean;
}

interface ProfileFlowRecord {
  questionnaire_pre_completed_at: string | null;
  questionnaire_post_completed_at: string | null;
  candidatos_completed_at: string | null;
  current_step_pre: number;
  current_step_post: number;
}

export async function saveAnswer(input: unknown): Promise<Result<{ step: number }>> {
  const correlationId = logger.correlationId();
  const baseParsed = saveAnswerSchema.safeParse(input);
  if (!baseParsed.success) {
    const first = baseParsed.error.issues[0];
    return err({
      code: "ValidationError",
      field: String(first?.path[0] ?? ""),
      message: first?.message ?? "Datos inválidos.",
    });
  }

  const { momento } = baseParsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "Unauthenticated" });

  const rl = await checkRateLimit(`saveAnswer:${user.id}`);
  if (!rl.success) return err({ code: "RateLimited", retryAfterSec: rl.retryAfterSec });

  // Buscar pregunta + verificar activa + momento compatible
  const { data: q } = await supabase
    .from("questions")
    .select("id, enunciado, dimension_tematica, dimension_cuestionario, momento, tipo, orden, activo")
    .eq("id", baseParsed.data.questionId)
    .single();
  const question = q as unknown as QuestionRecord | null;
  if (!question || !question.activo) {
    return err({ code: "NotFound", entity: "question" });
  }

  // La pregunta debe pertenecer al bloque actual: 'both' acepta ambos, 'pre' solo pre, 'post' solo post.
  if (question.momento !== "both" && question.momento !== momento) {
    return err({
      code: "ValidationError",
      field: "momento",
      message: `Esta pregunta no pertenece al bloque ${momento}.`,
    });
  }

  // Validar el valor según el tipo
  const valSchema = answerValueByType[question.tipo];
  const valParsed = valSchema.safeParse(baseParsed.data.valor);
  if (!valParsed.success) {
    return err({
      code: "ValidationError",
      field: "valor",
      message: valParsed.error.issues[0]?.message ?? "Respuesta inválida.",
    });
  }

  // Gating del bloque: el momento correspondiente no puede estar cerrado.
  // Post requiere además que candidatos esté completo (defensa adicional a la RLS).
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select(
      "questionnaire_pre_completed_at, questionnaire_post_completed_at, candidatos_completed_at, current_step_pre, current_step_post",
    )
    .eq("id", user.id)
    .single();
  const profile = profileRaw as unknown as ProfileFlowRecord | null;

  if (momento === "pre" && profile?.questionnaire_pre_completed_at) {
    return err({ code: "AlreadySubmitted" });
  }
  if (momento === "post") {
    if (!profile?.candidatos_completed_at) {
      return err({ code: "ValidationError", field: "momento", message: "Debes revisar los planes antes de continuar." });
    }
    if (profile.questionnaire_post_completed_at) {
      return err({ code: "AlreadySubmitted" });
    }
  }

  // Upsert: una answer por (student, question, momento)
  const { data: existing } = await supabase
    .from("answers")
    .select("id")
    .eq("student_id", user.id)
    .eq("question_id", question.id)
    .eq("momento_snapshot", momento)
    .maybeSingle();

  if (existing) {
    const { error: updErr } = await supabase
      .from("answers")
      .update({ valor: valParsed.data as never })
      .eq("id", (existing as { id: string }).id);
    if (updErr) {
      logger.error("saveAnswer update failed", { correlationId, dbCode: updErr.code });
      return err({ code: "Unexpected", correlationId });
    }
  } else {
    const { error: insErr } = await supabase.from("answers").insert({
      student_id: user.id,
      question_id: question.id,
      valor: valParsed.data as never,
      question_snapshot: question.enunciado,
      dimension_snapshot: question.dimension_tematica,
      dimension_cuestionario_snapshot: question.dimension_cuestionario,
      tipo_snapshot: question.tipo,
      momento_snapshot: momento,
    });
    if (insErr) {
      logger.error("saveAnswer insert failed", { correlationId, dbCode: insErr.code });
      return err({ code: "Unexpected", correlationId });
    }
  }

  // Avanza el puntero del paso del bloque correspondiente.
  const currentStep =
    momento === "pre" ? profile?.current_step_pre ?? 0 : profile?.current_step_post ?? 0;
  const newStep = Math.max(currentStep, question.orden);
  const stepUpdate =
    momento === "pre" ? { current_step_pre: newStep } : { current_step_post: newStep };
  await supabase.from("profiles").update(stepUpdate).eq("id", user.id);

  revalidatePath(`/cuestionario-${momento}`);
  return ok({ step: newStep });
}

/**
 * Cierra el bloque PRE. Verifica que todas las preguntas activas con
 * momento IN ('pre', 'both') hayan sido respondidas en momento_snapshot='pre'.
 */
export async function submitPreQuestionnaire(): Promise<
  Result<{ redirectTo: string }, { code: "MissingAnswers"; questionIds: string[] } | { code: "Unauthenticated" }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const userId = user!.id;

  const [{ data: requiredRows }, { data: answeredRows }] = await Promise.all([
    supabase.from("questions").select("id").eq("activo", true).in("momento", ["pre", "both"]),
    supabase
      .from("answers")
      .select("question_id")
      .eq("student_id", userId)
      .eq("momento_snapshot", "pre"),
  ]);

  const required = ((requiredRows ?? []) as { id: string }[]).map((r) => r.id);
  const answered = new Set(((answeredRows ?? []) as { question_id: string }[]).map((r) => r.question_id));

  const missing = required.filter((id) => !answered.has(id));
  if (missing.length > 0) {
    return err({ code: "MissingAnswers", questionIds: missing });
  }

  await supabase
    .from("profiles")
    .update({ questionnaire_pre_completed_at: new Date().toISOString() })
    .eq("id", userId);

  redirect("/candidatos");
}

/**
 * Cierra el bloque POST. Verifica que todas las preguntas activas con
 * momento IN ('post', 'both') hayan sido respondidas en momento_snapshot='post'.
 * Requiere también que candidatos_completed_at NOT NULL (gating).
 */
export async function submitPostQuestionnaire(): Promise<
  Result<{ redirectTo: string }, { code: "MissingAnswers"; questionIds: string[] } | { code: "Unauthenticated" } | { code: "ValidationError"; field: string; message: string }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const userId = user!.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("candidatos_completed_at")
    .eq("id", userId)
    .single();
  if (!(profile as { candidatos_completed_at: string | null } | null)?.candidatos_completed_at) {
    return err({
      code: "ValidationError",
      field: "flow",
      message: "Debes revisar los planes antes de cerrar el bloque post.",
    });
  }

  const [{ data: requiredRows }, { data: answeredRows }] = await Promise.all([
    supabase.from("questions").select("id").eq("activo", true).in("momento", ["post", "both"]),
    supabase
      .from("answers")
      .select("question_id")
      .eq("student_id", userId)
      .eq("momento_snapshot", "post"),
  ]);

  const required = ((requiredRows ?? []) as { id: string }[]).map((r) => r.id);
  const answered = new Set(((answeredRows ?? []) as { question_id: string }[]).map((r) => r.question_id));

  const missing = required.filter((id) => !answered.has(id));
  if (missing.length > 0) {
    return err({ code: "MissingAnswers", questionIds: missing });
  }

  await supabase
    .from("profiles")
    .update({ questionnaire_post_completed_at: new Date().toISOString() })
    .eq("id", userId);

  redirect("/preferencia");
}

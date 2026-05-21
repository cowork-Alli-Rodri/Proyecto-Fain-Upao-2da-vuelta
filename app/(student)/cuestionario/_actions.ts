"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { answerValueByType, saveAnswerSchema, type AnswerType } from "@/lib/validation/answer.schema";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit/upstash";
import { logger } from "@/lib/utils/logger";
import { err, ok, type Result } from "@/lib/errors";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "Unauthenticated" });

  // Rate limit 5/min por user
  const rl = await checkRateLimit(`saveAnswer:${user.id}`);
  if (!rl.success) return err({ code: "RateLimited", retryAfterSec: rl.retryAfterSec });

  // Buscar pregunta + verificar activa
  const { data: q } = await supabase
    .from("questions")
    .select("id, enunciado, dimension_tematica, tipo, orden, activo")
    .eq("id", baseParsed.data.questionId)
    .single();
  const question = q as
    | {
        id: string;
        enunciado: string;
        dimension_tematica: "social" | "economica" | "ambiental" | "institucional";
        tipo: AnswerType;
        orden: number;
        activo: boolean;
      }
    | null;
  if (!question || !question.activo) {
    return err({ code: "NotFound", entity: "question" });
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

  // No permitir editar tras envío del cuestionario completo
  const { data: profile } = await supabase
    .from("profiles")
    .select("questionnaire_completed_at, current_step")
    .eq("id", user.id)
    .single();
  const p = profile as { questionnaire_completed_at: string | null; current_step: number } | null;
  if (p?.questionnaire_completed_at) {
    return err({ code: "AlreadySubmitted" });
  }

  // Upsert: si ya existe, actualiza solo valor (snapshot lock impide cambios al texto)
  const { data: existing } = await supabase
    .from("answers")
    .select("id")
    .eq("student_id", user.id)
    .eq("question_id", question.id)
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
      tipo_snapshot: question.tipo,
    });
    if (insErr) {
      logger.error("saveAnswer insert failed", { correlationId, dbCode: insErr.code });
      return err({ code: "Unexpected", correlationId });
    }
  }

  // Avanza el puntero del paso si corresponde
  const newStep = Math.max(p?.current_step ?? 0, question.orden);
  await supabase.from("profiles").update({ current_step: newStep }).eq("id", user.id);

  revalidatePath("/cuestionario");
  return ok({ step: newStep });
}

export async function submitQuestionnaire(): Promise<
  Result<{ redirectTo: string }, never>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const userId = user!.id;

  // Cuenta preguntas activas y respuestas del usuario
  const [{ count: activeCount }, { data: answeredRows }] = await Promise.all([
    supabase.from("questions").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("answers").select("question_id").eq("student_id", userId),
  ]);

  const answered = new Set(
    ((answeredRows ?? []) as { question_id: string }[]).map((r) => r.question_id),
  );

  // Si faltan respuestas, listar ids
  if ((activeCount ?? 0) > answered.size) {
    const { data: missing } = await supabase
      .from("questions")
      .select("id")
      .eq("activo", true)
      .not("id", "in", `(${Array.from(answered).join(",") || "''"})`);
    return {
      ok: false,
      error: {
        code: "MissingAnswers",
        questionIds: ((missing ?? []) as { id: string }[]).map((r) => r.id),
      },
    } as never;
  }

  await supabase
    .from("profiles")
    .update({ questionnaire_completed_at: new Date().toISOString() })
    .eq("id", userId);

  redirect("/comparador");
}

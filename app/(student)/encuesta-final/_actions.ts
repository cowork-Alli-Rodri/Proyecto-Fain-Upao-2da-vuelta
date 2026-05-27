"use server";

import { redirect } from "next/navigation";

import { postSurveySchema } from "@/lib/validation/post-survey.schema";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit/upstash";
import { logger } from "@/lib/utils/logger";
import { err, ok, type Result } from "@/lib/errors";

export async function submitPostSurvey(
  input: unknown,
): Promise<Result<{ done: true }>> {
  const correlationId = logger.correlationId();
  const parsed = postSurveySchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
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

  const rl = await checkRateLimit(`submitPostSurvey:${user.id}`);
  if (!rl.success) return err({ code: "RateLimited", retryAfterSec: rl.retryAfterSec });

  // Pre-condición del flujo v2: cuestionario POST cerrado (el bloque final).
  const { data: profile } = await supabase
    .from("profiles")
    .select("questionnaire_post_completed_at")
    .eq("id", user.id)
    .single();
  const p = profile as
    | { questionnaire_post_completed_at: string | null }
    | null;

  if (!p?.questionnaire_post_completed_at) {
    return err({ code: "QuestionnaireIncomplete" });
  }

  // ¿Ya envió la encuesta?
  const { data: existing } = await supabase
    .from("post_surveys" as never)
    .select("student_id")
    .eq("student_id", user.id)
    .maybeSingle();
  if (existing) {
    return err({ code: "AlreadySubmitted" });
  }

  const { error } = await supabase.from("post_surveys" as never).insert({
    student_id: user.id,
    opinion_changed: parsed.data.opinionChanged,
    dimension_top: parsed.data.dimensionTop,
    utility_rating: parsed.data.utilityRating,
    would_recommend: parsed.data.wouldRecommend,
    comentario: parsed.data.comentario?.trim() || null,
  } as never);

  if (error) {
    logger.error("submitPostSurvey insert failed", {
      correlationId,
      dbCode: error.code,
    });
    return err({ code: "Unexpected", correlationId });
  }

  logger.info("post-survey submitted", {
    correlationId,
    opinion: parsed.data.opinionChanged,
  });

  redirect("/preferencia");
  return ok({ done: true });
}

"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/utils/logger";

type DimensionJne = "social" | "economica" | "ambiental" | "institucional";
const VALID_DIMENSIONS: DimensionJne[] = ["social", "economica", "ambiental", "institucional"];

/**
 * Marca una dimensión JNE como vista por el estudiante autenticado.
 * Idempotente: si la dimensión ya está en el array, no la duplica.
 * Si las 4 dimensiones están vistas, setea candidatos_completed_at.
 */
export async function markDimensionViewed(
  dimension: DimensionJne,
): Promise<Result<{ viewedCount: number; completed: boolean }>> {
  if (!VALID_DIMENSIONS.includes(dimension)) {
    return err({ code: "ValidationError", field: "dimension", message: "Dimensión inválida." });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "Unauthenticated" });

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("role, candidatos_dimensions_viewed, candidatos_completed_at, questionnaire_pre_completed_at")
    .eq("id", user.id)
    .single();

  const profile = profileRaw as
    | {
        role: "student" | "teacher" | "admin";
        candidatos_dimensions_viewed: string[];
        candidatos_completed_at: string | null;
        questionnaire_pre_completed_at: string | null;
      }
    | null;

  if (!profile) return err({ code: "NotFound", entity: "profile" });
  if (profile.role !== "student") {
    // Teacher/admin no necesitan trackear; respondemos no-op.
    return ok({ viewedCount: 0, completed: false });
  }
  if (!profile.questionnaire_pre_completed_at) {
    return err({
      code: "ValidationError",
      field: "flow",
      message: "Debes completar el cuestionario previo antes de revisar candidatos.",
    });
  }

  const current = new Set(profile.candidatos_dimensions_viewed ?? []);
  current.add(dimension);
  const viewed = Array.from(current);
  const completed = VALID_DIMENSIONS.every((d) => current.has(d));

  const update: {
    candidatos_dimensions_viewed: string[];
    candidatos_completed_at?: string;
  } = { candidatos_dimensions_viewed: viewed };
  if (completed && !profile.candidatos_completed_at) {
    update.candidatos_completed_at = new Date().toISOString();
  }

  const { error: updErr } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);
  if (updErr) {
    const correlationId = logger.correlationId();
    logger.error("markDimensionViewed update failed", { correlationId, dbCode: updErr.code });
    return err({ code: "Unexpected", correlationId });
  }

  revalidatePath("/candidatos");
  return ok({ viewedCount: viewed.length, completed });
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { consentSchema } from "@/lib/validation/consent.schema";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/auth/turnstile";
import { hashIp } from "@/lib/utils/opaque-id";
import { logger } from "@/lib/utils/logger";
import { err, ok, type Result } from "@/lib/errors";

export async function acceptConsent(input: unknown): Promise<Result<{ redirectTo: string }>> {
  const correlationId = logger.correlationId();
  const parsed = consentSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    if (
      first?.path.includes("dataUseAccepted") ||
      first?.path.includes("termsAccepted")
    ) {
      return err({ code: "ConsentMissing" });
    }
    return err({
      code: "ValidationError",
      field: String(first?.path[0] ?? ""),
      message: first?.message ?? "Datos inválidos.",
    });
  }

  // Turnstile (modo permisivo si no hay secret en env — dev/CI)
  if (parsed.data.turnstileToken) {
    const ts = await verifyTurnstileToken(parsed.data.turnstileToken);
    if (!ts.success) return err({ code: "TurnstileFailed" });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "Unauthenticated" });

  const reqHeaders = await headers();
  const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = reqHeaders.get("user-agent") ?? null;

  const now = new Date().toISOString();
  const { error } = await supabase.from("consent_events").insert({
    user_id: user.id,
    accepted_terms_at: now,
    accepted_data_use_at: now,
    consent_version: parsed.data.consentVersion,
    ip_hash: ip ? hashIp(ip) : null,
    user_agent_hash: ua ? hashIp(ua) : null,
  });

  if (error) {
    logger.error("acceptConsent insert failed", { correlationId, dbCode: error.code });
    return err({ code: "Unexpected", correlationId });
  }

  logger.info("consent accepted", { correlationId, userId: user.id });

  // Si ya tiene perfil completo → /cuestionario; si no → /profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("facultad")
    .eq("id", user.id)
    .single();

  const next = (profile as { facultad?: string | null } | null)?.facultad
    ? "/cuestionario"
    : "/profile";

  redirect(next);
  return ok({ redirectTo: next });
}

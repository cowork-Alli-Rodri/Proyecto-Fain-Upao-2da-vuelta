"use server";

import { revalidatePath } from "next/cache";

import { factCheckSchema } from "@/lib/validation/fact-check.schema";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/role";
import { logger } from "@/lib/utils/logger";
import { err, ok, type Result } from "@/lib/errors";

async function assertAdmin(): Promise<Result<{ userId: string }>> {
  const ok_ = await isAdmin();
  if (!ok_) return err({ code: "ForbiddenRole", required: "admin" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "Unauthenticated" });
  return ok({ userId: user.id });
}

export async function createFactCheck(input: unknown): Promise<Result<{ id: string }>> {
  const guard = await assertAdmin();
  if (!guard.ok) return guard;

  const parsed = factCheckSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return err({
      code: "ValidationError",
      field: String(first?.path[0] ?? ""),
      message: first?.message ?? "Datos inválidos.",
    });
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("fact_checks" as never)
    .insert({
      titular_falso: parsed.data.titularFalso,
      contexto: parsed.data.contexto,
      fact_checker_name: parsed.data.factCheckerName,
      fact_checker_url: parsed.data.factCheckerUrl,
      candidato_relacionado: parsed.data.candidatoRelacionado ?? null,
      fecha_origen: parsed.data.fechaOrigen || null,
      status: parsed.data.status,
      published_at: parsed.data.status === "published" ? now : null,
      created_by: guard.value.userId,
    } as never)
    .select("id")
    .single();

  if (error) {
    logger.error("createFactCheck failed", { dbCode: error.code });
    return err({ code: "Unexpected", correlationId: logger.correlationId() });
  }

  revalidatePath("/admin/fact-checks");
  revalidatePath("/no-te-dejes-sorprender");
  return ok({ id: (data as { id: string }).id });
}

export async function updateFactCheck(
  id: string,
  input: unknown,
): Promise<Result<{ id: string }>> {
  const guard = await assertAdmin();
  if (!guard.ok) return guard;

  const parsed = factCheckSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return err({
      code: "ValidationError",
      field: String(first?.path[0] ?? ""),
      message: first?.message ?? "Datos inválidos.",
    });
  }

  const supabase = await createClient();

  // Si pasamos de no-published a published, fijamos published_at
  const { data: current } = await supabase
    .from("fact_checks" as never)
    .select("status, published_at")
    .eq("id", id)
    .single();
  const c = current as { status: string; published_at: string | null } | null;

  const publishedAt =
    parsed.data.status === "published"
      ? c?.status !== "published"
        ? new Date().toISOString()
        : c.published_at
      : null;

  const { error } = await supabase
    .from("fact_checks" as never)
    .update({
      titular_falso: parsed.data.titularFalso,
      contexto: parsed.data.contexto,
      fact_checker_name: parsed.data.factCheckerName,
      fact_checker_url: parsed.data.factCheckerUrl,
      candidato_relacionado: parsed.data.candidatoRelacionado ?? null,
      fecha_origen: parsed.data.fechaOrigen || null,
      status: parsed.data.status,
      published_at: publishedAt,
    } as never)
    .eq("id", id);

  if (error) {
    logger.error("updateFactCheck failed", { dbCode: error.code });
    return err({ code: "Unexpected", correlationId: logger.correlationId() });
  }

  revalidatePath("/admin/fact-checks");
  revalidatePath(`/admin/fact-checks/${id}`);
  revalidatePath("/no-te-dejes-sorprender");
  return ok({ id });
}

export async function deleteFactCheck(id: string): Promise<Result<{ ok: true }>> {
  const guard = await assertAdmin();
  if (!guard.ok) return guard;

  const supabase = await createClient();
  const { error } = await supabase
    .from("fact_checks" as never)
    .delete()
    .eq("id", id);
  if (error) {
    return err({ code: "Unexpected", correlationId: logger.correlationId() });
  }
  revalidatePath("/admin/fact-checks");
  revalidatePath("/no-te-dejes-sorprender");
  return ok({ ok: true });
}


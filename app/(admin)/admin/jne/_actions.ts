"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/role";
import { jneRefresh, type JneRefreshResult } from "@/lib/jne/refresh";
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

/**
 * T131 — Dispara el refresh JNE desde la UI del admin.
 *
 * Devuelve `JneRefreshResult` directo para que el caller pueda mostrar
 * el resumen (candidatos actualizados, duración) o el detalle del error.
 */
export async function refreshJneNow(): Promise<
  Result<JneRefreshResult, AppError>
> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const correlationId = logger.correlationId();

  try {
    const result = await jneRefresh({ triggeredBy: "admin" });
    revalidatePath("/admin/jne");
    revalidatePath("/comparador");
    return ok(result);
  } catch (e) {
    logger.error("refreshJneNow threw unexpectedly", {
      correlationId,
      cause: e instanceof Error ? e.message : "unknown",
    });
    return err({ code: "Unexpected", correlationId });
  }
}

/**
 * T132 — Configura `app_settings.ciclo_cierre_at`.
 *
 * El cron mensual de anonimización usa este timestamp como ancla:
 * anonimiza profiles cuando ya pasaron 12 meses desde esta fecha.
 *
 * Acepta `null` para deshacer un cierre programado.
 */
const setCicloCierreSchema = z.object({
  cierreAt: z
    .string()
    .datetime({ message: "Fecha inválida — usa formato ISO 8601." })
    .nullable(),
});

export async function setCicloCierre(
  input: unknown,
): Promise<Result<{ cierreAt: string | null }, AppError>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const correlationId = logger.correlationId();

  const parsed = setCicloCierreSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return err({
      code: "ValidationError",
      field: issue?.path[0] === undefined ? "" : String(issue.path[0]),
      message: issue?.message ?? "Fecha inválida.",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ ciclo_cierre_at: parsed.data.cierreAt })
    .eq("id", 1);

  if (error) {
    logger.error("setCicloCierre failed", { correlationId, dbCode: error.code });
    return err({ code: "Unexpected", correlationId });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/jne");
  return ok({ cierreAt: parsed.data.cierreAt });
}

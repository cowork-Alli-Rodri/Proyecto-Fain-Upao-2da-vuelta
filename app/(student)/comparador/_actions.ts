"use server";

import { createClient } from "@/lib/supabase/server";
import { err, ok, type Result } from "@/lib/errors";

/**
 * Asigna 50/50 el orden Keiko/Roberto si todavía no está en el profile (Q4).
 * Idempotente: si ya hay valor, devuelve el existente.
 */
export async function assignCompareOrderIfMissing(): Promise<
  Result<{ compareOrder: "keiko_left" | "roberto_left" }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "Unauthenticated" });

  const { data: profile } = await supabase
    .from("profiles")
    .select("compare_order")
    .eq("id", user.id)
    .single();

  const current = (profile as { compare_order: "keiko_left" | "roberto_left" | null } | null)
    ?.compare_order;

  if (current) {
    return ok({ compareOrder: current });
  }

  const { data: rolled } = await supabase.rpc("assign_compare_order_random");
  const value = (rolled as "keiko_left" | "roberto_left" | null) ?? "keiko_left";

  await supabase.from("profiles").update({ compare_order: value }).eq("id", user.id);
  return ok({ compareOrder: value });
}

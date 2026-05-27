import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cuestionario · Pre" };

export default async function CuestionarioPreIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_step_pre, facultad, questionnaire_pre_completed_at")
    .eq("id", user.id)
    .single();

  const p = profile as
    | {
        current_step_pre: number;
        facultad: string | null;
        questionnaire_pre_completed_at: string | null;
      }
    | null;

  if (!p) redirect("/login");
  if (!p.facultad) redirect("/profile");
  if (p.questionnaire_pre_completed_at) redirect("/candidatos");

  const step = Math.max(1, p.current_step_pre || 1);
  redirect(`/cuestionario-pre/${step}`);
}

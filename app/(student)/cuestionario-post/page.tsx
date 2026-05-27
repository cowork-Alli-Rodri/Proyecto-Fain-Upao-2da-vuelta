import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cuestionario · Post" };

export default async function CuestionarioPostIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "current_step_post, facultad, questionnaire_pre_completed_at, candidatos_completed_at, questionnaire_post_completed_at",
    )
    .eq("id", user.id)
    .single();

  const p = profile as
    | {
        current_step_post: number;
        facultad: string | null;
        questionnaire_pre_completed_at: string | null;
        candidatos_completed_at: string | null;
        questionnaire_post_completed_at: string | null;
      }
    | null;

  if (!p) redirect("/login");
  if (!p.facultad) redirect("/profile");
  if (!p.questionnaire_pre_completed_at) redirect("/cuestionario-pre");
  if (!p.candidatos_completed_at) redirect("/candidatos");
  if (p.questionnaire_post_completed_at) redirect("/preferencia");

  const step = Math.max(1, p.current_step_post || 1);
  redirect(`/cuestionario-post/${step}`);
}

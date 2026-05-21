import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cuestionario" };

export default async function CuestionarioIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Resume al step actual
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_step, facultad, questionnaire_completed_at")
    .eq("id", user.id)
    .single();

  const p = profile as
    | {
        current_step: number;
        facultad: string | null;
        questionnaire_completed_at: string | null;
      }
    | null;

  if (!p) redirect("/login");
  if (!p.facultad) redirect("/profile");
  if (p.questionnaire_completed_at) redirect("/comparador");

  const step = Math.max(1, p.current_step || 1);
  redirect(`/cuestionario/${step}`);
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PreferenceForm } from "./_components/PreferenceForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Marcar mi preferencia" };

export default async function PreferenciaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: existing }] = await Promise.all([
    supabase
      .from("profiles")
      .select("questionnaire_completed_at, compare_order")
      .eq("id", user.id)
      .single(),
    supabase
      .from("preferences")
      .select("id")
      .eq("student_id", user.id)
      .maybeSingle(),
  ]);

  const p = profile as
    | { questionnaire_completed_at: string | null; compare_order: string | null }
    | null;

  if (!p?.questionnaire_completed_at) redirect("/cuestionario");
  if (!p.compare_order) redirect("/comparador");
  if (existing) redirect("/cierre");

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-[var(--color-smoke)]">
            Última etapa
          </p>
          <h1 className="font-display text-3xl text-[var(--color-navy-upao)]">
            Tu preferencia final
          </h1>
          <p className="text-sm text-[var(--color-smoke)]">
            Tras explorar los planes del JNE, declara tu preferencia. Esta decisión es{" "}
            <strong>final</strong> y no podrás modificarla después.
          </p>
        </header>

        <PreferenceForm />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
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
    supabase.from("preferences").select("id").eq("student_id", user.id).maybeSingle(),
  ]);

  const p = profile as
    | { questionnaire_completed_at: string | null; compare_order: string | null }
    | null;

  if (!p?.questionnaire_completed_at) redirect("/cuestionario");
  if (!p.compare_order) redirect("/comparador");
  if (existing) redirect("/cierre");

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/comparador" className="flex items-center gap-3">
            <span className="block h-6 w-1 bg-[var(--color-navy-upao)]" aria-hidden />
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
              ← Volver al comparador
            </p>
          </Link>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
            Última etapa
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
        <aside className="space-y-8 lg:col-span-5">
          <div className="space-y-3">
            <p className="editorial-kicker">Tu preferencia · Final</p>
            <div className="editorial-rule" />
          </div>
          <h1 className="font-display text-[clamp(2.25rem,4vw,3.5rem)] font-medium leading-[1.05] text-[var(--color-navy-upao)]">
            Después de explorar,{" "}
            <span className="italic text-[var(--color-cyan-deep)]">tu opinión.</span>
          </h1>
          <p className="text-base leading-relaxed text-[var(--color-graphite)]">
            Esta declaración es <strong>final</strong>: una vez enviada, no podrás modificarla.
            El docente analizará las preferencias agregadas, no las individuales.
          </p>
          <div className="rounded-2xl border-l-2 border-[var(--color-coral-pulse)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <p className="editorial-kicker mb-2">Importante</p>
            <p className="text-sm leading-relaxed text-[var(--color-foreground)]">
              Tu respuesta no nos dice cómo votarás. Mide tu posición declarada tras la
              exposición a los planes oficiales del JNE.
            </p>
          </div>
        </aside>

        <section className="lg:col-span-7">
          <PreferenceForm />
        </section>
      </div>
    </main>
  );
}

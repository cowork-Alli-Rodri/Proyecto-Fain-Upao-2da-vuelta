import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PostSurveyForm } from "./_components/PostSurveyForm";
import { BrandBar } from "@/components/brand/BrandMark";
import { SignOutLink } from "@/components/brand/SignOutLink";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Encuesta final" };

export default async function EncuestaFinalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: existing }, { data: pref }] = await Promise.all([
    supabase
      .from("profiles")
      .select("questionnaire_post_completed_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("post_surveys" as never)
      .select("student_id")
      .eq("student_id", user.id)
      .maybeSingle(),
    supabase.from("preferences").select("id").eq("student_id", user.id).maybeSingle(),
  ]);

  const p = profile as
    | { questionnaire_post_completed_at: string | null }
    | null;

  // Flow v2: encuesta final solo después de cerrar POST + haber declarado preferencia.
  if (!p?.questionnaire_post_completed_at) redirect("/cuestionario-post");
  if (!pref) redirect("/preferencia");
  // Si ya respondió la encuesta, va al cierre.
  if (existing) redirect("/cierre");

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3" title="Volver al inicio">
            <BrandBar />
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
              ← Inicio
            </p>
          </Link>
          <div className="flex items-center gap-5">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
              Encuesta · 4 preguntas
            </p>
            <SignOutLink />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-12 lg:gap-16 lg:py-20">
        <aside className="space-y-7 lg:col-span-5">
          <div className="space-y-3">
            <p className="editorial-kicker">Cierre · Antes de decidir</p>
            <div className="editorial-rule" />
          </div>
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] text-[var(--color-navy-upao)]">
            Una pausa breve{" "}
            <span className="italic text-[var(--color-cyan-deep)]">antes</span> de tu
            decisión.
          </h1>
          <p className="text-base leading-relaxed text-[var(--color-graphite)]">
            Cuatro preguntas cortas para entender cómo el análisis influyó en tu mirada.
            Nos sirven para mejorar la herramienta y para el trabajo académico del curso.
          </p>
          <div className="rounded-2xl border-l-2 border-[var(--color-cyan-electric)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="editorial-kicker mb-2">Tiempo estimado</p>
            <p className="text-sm leading-relaxed text-[var(--color-foreground)]">
              Menos de <strong>2 minutos</strong>. Tus respuestas se procesan de forma
              agregada y anónima.
            </p>
          </div>
        </aside>

        <section className="lg:col-span-7">
          <PostSurveyForm />
        </section>
      </div>
    </main>
  );
}

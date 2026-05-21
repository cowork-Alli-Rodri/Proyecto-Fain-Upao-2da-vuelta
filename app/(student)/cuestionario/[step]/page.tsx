import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MultiStepForm } from "@/components/questionnaire/MultiStepForm";
import { OfflineIndicator } from "@/components/questionnaire/OfflineIndicator";
import type {
  AnswerValue,
  QuestionRecord,
} from "@/components/questionnaire/QuestionRenderer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cuestionario" };

interface DbQuestion {
  id: string;
  orden: number;
  enunciado: string;
  dimension_tematica: "social" | "economica" | "ambiental" | "institucional";
  tipo: "likert" | "single" | "multiple" | "text" | "ranking" | "comparison";
  fuente: string | null;
  opciones: unknown | null;
}

interface DbAnswer {
  question_id: string;
  valor: AnswerValue;
}

export default async function CuestionarioStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  const stepNum = Number(step);
  if (!Number.isFinite(stepNum) || stepNum < 1) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: questionsData }, { data: answersData }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("current_step, facultad, questionnaire_completed_at")
        .eq("id", user.id)
        .single(),
      supabase
        .from("questions")
        .select("id, orden, enunciado, dimension_tematica, tipo, fuente, opciones")
        .eq("activo", true)
        .order("orden", { ascending: true }),
      supabase
        .from("answers")
        .select("question_id, valor")
        .eq("student_id", user.id),
    ]);

  const p = profile as
    | { current_step: number; facultad: string | null; questionnaire_completed_at: string | null }
    | null;
  if (!p) redirect("/login");
  if (!p.facultad) redirect("/profile");
  if (p.questionnaire_completed_at) redirect("/comparador");

  const questions = ((questionsData ?? []) as DbQuestion[]) as QuestionRecord[];
  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--color-background)] py-20 px-6">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="editorial-kicker">Sin preguntas activas</p>
          <h1 className="font-display text-4xl text-[var(--color-navy-upao)]">
            Cuestionario en preparación
          </h1>
          <p className="text-sm text-[var(--color-graphite)]">
            El docente aún no ha publicado las preguntas. Vuelve más tarde.
          </p>
        </div>
      </main>
    );
  }

  if (stepNum > questions.length) {
    redirect(`/cuestionario/${questions.length}`);
  }

  const initialAnswers: Record<string, AnswerValue> = {};
  for (const a of (answersData ?? []) as DbAnswer[]) {
    initialAnswers[a.question_id] = a.valor as AnswerValue;
  }

  return (
    <>
      <OfflineIndicator />
      <main className="min-h-screen bg-[var(--color-background)]">
        {/* HEADER fijo con marca + indicador de sección */}
        <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="block h-6 w-1 bg-[var(--color-navy-upao)]" aria-hidden />
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
                Cuestionario · UPAO
              </p>
            </Link>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
              Voto Informado 2026
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-6 py-12">
          <MultiStepForm
            questions={questions}
            initialAnswers={initialAnswers}
            initialStep={stepNum}
          />
        </div>
      </main>
    </>
  );
}

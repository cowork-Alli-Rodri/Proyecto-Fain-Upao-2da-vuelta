import type { Metadata } from "next";
import Link from "next/link";

import { BrandBar, BrandMark } from "@/components/brand/BrandMark";
import { createClient } from "@/lib/supabase/server";

import { CandidatosSplitView } from "./_components/CandidatosSplitView";
import { PlanResumenSection } from "./_components/PlanResumenSection";
import { StudentDimensionTracker } from "./_components/StudentDimensionTracker";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: "Candidatos · Segunda Vuelta 2026",
  description:
    "Comparador oficial entre Keiko Fujimori (Fuerza Popular) y Roberto Sánchez (Juntos por el Perú): hoja de vida, plan de gobierno, video de presentación y debates JNE. Datos del Jurado Nacional de Elecciones.",
};

// Página dinámica (lee user) — sin revalidate estático.
export const dynamic = "force-dynamic";

type DimensionJne = "social" | "economica" | "ambiental" | "institucional";

export default async function CandidatosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let studentContext: {
    show: boolean;
    viewed: DimensionJne[];
    completed: boolean;
  } = { show: false, viewed: [], completed: false };

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "role, candidatos_dimensions_viewed, candidatos_completed_at, questionnaire_pre_completed_at",
      )
      .eq("id", user.id)
      .single();

    const p = profile as
      | {
          role: "student" | "teacher" | "admin";
          candidatos_dimensions_viewed: string[];
          candidatos_completed_at: string | null;
          questionnaire_pre_completed_at: string | null;
        }
      | null;

    // El tracker solo se muestra a estudiantes que ya completaron pre.
    if (p?.role === "student" && p.questionnaire_pre_completed_at) {
      studentContext = {
        show: true,
        viewed: (p.candidatos_dimensions_viewed ?? []) as DimensionJne[],
        completed: !!p.candidatos_completed_at,
      };
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <BrandBar />
            <BrandMark context="Candidatos · 2026" hideContextOnMobile />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            {studentContext.show ? null : (
              <>
                <Link
                  href="/inicio"
                  className="hidden font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] transition hover:text-[var(--color-navy-upao)] sm:inline sm:text-[0.7rem] sm:tracking-[0.2em]"
                >
                  ← Volver al inicio
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-[40px] items-center rounded-full border border-[var(--color-navy-upao)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-navy-upao)] transition hover:bg-[var(--color-navy-upao)] hover:text-white sm:px-4 sm:text-sm"
                >
                  Analizar planes →
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <CandidatosSplitView />

      <PlanResumenSection />

      {studentContext.show ? (
        <StudentDimensionTracker
          initialViewed={studentContext.viewed}
          initialCompleted={studentContext.completed}
        />
      ) : (
        <section className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] py-8 sm:py-10">
          <div className="mx-auto max-w-5xl space-y-3 px-4 sm:px-6">
            <p className="editorial-kicker">Importante</p>
            <p className="text-sm leading-relaxed text-[var(--color-graphite)]">
              Esta página reproduce los datos publicados por el Jurado Nacional de Elecciones en su plataforma oficial
              de Voto Informado. Las fotografías de los candidatos se presentan en estilo pixart como recurso visual
              del proyecto. Los enlaces a hoja de vida, plan de gobierno y debates llevan al sitio oficial del JNE.
            </p>
            <div className="flex flex-wrap gap-3 pt-2 text-sm">
              <Link
                href="/inicio"
                className="text-[var(--color-navy-upao)] underline-offset-4 hover:underline"
              >
                ← Volver al inicio
              </Link>
              <span aria-hidden className="text-[var(--color-border-strong)]">
                ·
              </span>
              <Link
                href="/no-te-dejes-sorprender"
                className="text-[var(--color-coral-pulse)] underline-offset-4 hover:underline"
              >
                No te dejes sorprender
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

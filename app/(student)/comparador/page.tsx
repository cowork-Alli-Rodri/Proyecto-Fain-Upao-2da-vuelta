import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SplitView, type SplitViewData } from "@/components/compare/SplitView";
import type { CandidateData, CandidateDimensionData } from "@/components/compare/CandidateColumn";
import { assignCompareOrderIfMissing } from "./_actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Comparador" };

const CANDIDATE_IDS = {
  keiko: 245741,
  roberto: 246281,
} as const;

type DimKey = "social" | "economica" | "ambiental" | "institucional";

interface DbCandidate {
  id: number;
  nombre_completo: string;
  partido: string;
  plan_pdf_url: string | null;
}
interface DbPlan {
  id: number;
  candidate_id: number;
}
interface DbDimension {
  plan_id: number;
  dimension: DimKey;
  problema: string | null;
  objetivo: string | null;
  indicador: string | null;
  meta: string | null;
}

export default async function ComparadorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("questionnaire_completed_at, facultad")
    .eq("id", user.id)
    .single();
  const p = profile as { questionnaire_completed_at: string | null; facultad: string | null } | null;
  if (!p?.facultad) redirect("/profile");
  if (!p.questionnaire_completed_at) redirect("/cuestionario");

  const orderResult = await assignCompareOrderIfMissing();
  const compareOrder = orderResult.ok ? orderResult.value.compareOrder : "keiko_left";

  const [{ data: candidatesData }, { data: plansData }, { data: dimensionsData }] =
    await Promise.all([
      supabase.from("candidates").select("id, nombre_completo, partido, plan_pdf_url"),
      supabase.from("plans").select("id, candidate_id"),
      supabase
        .from("plan_dimensions")
        .select("plan_id, dimension, problema, objetivo, indicador, meta"),
    ]);

  const candidates = (candidatesData ?? []) as DbCandidate[];
  const plans = (plansData ?? []) as DbPlan[];
  const dimensions = (dimensionsData ?? []) as DbDimension[];

  const keikoCandidate = candidates.find((c) => c.id === CANDIDATE_IDS.keiko);
  const robertoCandidate = candidates.find((c) => c.id === CANDIDATE_IDS.roberto);

  if (!keikoCandidate || !robertoCandidate) {
    return (
      <main className="min-h-screen bg-[var(--color-background)] py-20 px-6">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="editorial-kicker">Datos no disponibles</p>
          <h1 className="font-display text-4xl text-[var(--color-navy-upao)]">
            Sincronizando con el JNE
          </h1>
          <p className="text-sm text-[var(--color-graphite)]">
            Inténtalo de nuevo en unos minutos. El cron de actualización corre cada 24 horas.
          </p>
        </div>
      </main>
    );
  }

  const keikoPlan = plans.find((p) => p.candidate_id === keikoCandidate.id);
  const robertoPlan = plans.find((p) => p.candidate_id === robertoCandidate.id);

  function dimsFor(planId: number | undefined): Record<DimKey, CandidateDimensionData | null> {
    const out: Record<DimKey, CandidateDimensionData | null> = {
      social: null,
      economica: null,
      ambiental: null,
      institucional: null,
    };
    if (!planId) return out;
    for (const d of dimensions) {
      if (d.plan_id === planId) {
        out[d.dimension] = {
          problema: d.problema,
          objetivo: d.objetivo,
          indicador: d.indicador,
          meta: d.meta,
        };
      }
    }
    return out;
  }

  const keikoData: CandidateData = {
    id: keikoCandidate.id,
    nombre_completo: keikoCandidate.nombre_completo,
    partido: keikoCandidate.partido,
    plan_pdf_url: keikoCandidate.plan_pdf_url,
    candidate_key: "keiko",
  };
  const robertoData: CandidateData = {
    id: robertoCandidate.id,
    nombre_completo: robertoCandidate.nombre_completo,
    partido: robertoCandidate.partido,
    plan_pdf_url: robertoCandidate.plan_pdf_url,
    candidate_key: "roberto",
  };

  const data: SplitViewData =
    compareOrder === "keiko_left"
      ? {
          candidateLeft: keikoData,
          candidateRight: robertoData,
          dimensionsLeft: dimsFor(keikoPlan?.id),
          dimensionsRight: dimsFor(robertoPlan?.id),
        }
      : {
          candidateLeft: robertoData,
          candidateRight: keikoData,
          dimensionsLeft: dimsFor(robertoPlan?.id),
          dimensionsRight: dimsFor(keikoPlan?.id),
        };

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      {/* HEADER */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="block h-6 w-1 bg-[var(--color-navy-upao)]" aria-hidden />
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
              Comparador · UPAO
            </p>
          </Link>
          <Link
            href="/preferencia"
            className="rounded-full bg-[var(--color-navy-upao)] px-5 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)]"
          >
            Marcar mi preferencia →
          </Link>
        </div>
      </header>

      {/* HERO comparador */}
      <section className="border-b border-[var(--color-border)] py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="space-y-4">
            <p className="editorial-kicker">Planes oficiales · JNE · Segunda Vuelta 2026</p>
            <h1 className="max-w-3xl font-display text-[clamp(2.25rem,5vw,4.5rem)] font-medium leading-[1.05] tracking-tight text-[var(--color-navy-upao)]">
              Lado a lado, sin parafraseo.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-[var(--color-graphite)]">
              Texto exacto del Jurado Nacional de Elecciones en cuatro dimensiones oficiales. Si
              un campo no está declarado, se indica explícitamente. Orden izquierda/derecha
              asignado al azar al primer acceso, persistente para ti.
            </p>
          </div>
        </div>
      </section>

      {/* SPLIT VIEW */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6">
          <SplitView data={data} />
        </div>
      </section>
    </main>
  );
}

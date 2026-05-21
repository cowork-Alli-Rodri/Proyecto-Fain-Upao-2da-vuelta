import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SplitView, type SplitViewData } from "@/components/compare/SplitView";
import type { CandidateData, CandidateDimensionData } from "@/components/compare/CandidateColumn";
import { assignCompareOrderIfMissing } from "./_actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Comparador" };

// IDs estables del JNE
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

  // Bloquear si cuestionario incompleto (FR-013)
  const { data: profile } = await supabase
    .from("profiles")
    .select("questionnaire_completed_at, facultad")
    .eq("id", user.id)
    .single();
  const p = profile as { questionnaire_completed_at: string | null; facultad: string | null } | null;
  if (!p?.facultad) redirect("/profile");
  if (!p.questionnaire_completed_at) redirect("/cuestionario");

  // Asignar orden si falta
  const orderResult = await assignCompareOrderIfMissing();
  const compareOrder = orderResult.ok ? orderResult.value.compareOrder : "keiko_left";

  // Fetch candidatos + plans + dimensiones
  const [{ data: candidatesData }, { data: plansData }, { data: dimensionsData }] =
    await Promise.all([
      supabase
        .from("candidates")
        .select("id, nombre_completo, partido, plan_pdf_url"),
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
      <main className="min-h-screen bg-[var(--background)] py-12 px-4">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h1 className="font-display text-3xl text-[var(--color-navy-upao)]">
            Datos del JNE no disponibles
          </h1>
          <p className="text-sm text-[var(--color-smoke)]">
            Estamos sincronizando información del JNE. Inténtalo de nuevo en unos minutos.
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
    <main className="min-h-screen bg-[var(--background)] py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-[var(--color-smoke)]">
            Comparador oficial JNE · Segunda Vuelta 2026
          </p>
          <h1 className="font-display text-3xl text-[var(--color-navy-upao)] sm:text-4xl">
            Planes de gobierno lado a lado
          </h1>
          <p className="max-w-2xl text-sm text-[var(--color-smoke)]">
            Datos extraídos directamente del Jurado Nacional de Elecciones. Texto exacto del
            JNE, sin parafraseo. Si un campo falta, se muestra explícitamente.
          </p>
        </header>

        <SplitView data={data} />
      </div>
    </main>
  );
}

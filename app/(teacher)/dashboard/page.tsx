import type { Metadata } from "next";

import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { PreferenceDonut } from "@/components/dashboard/PreferenceDonut";
import { CareerCrosstab } from "@/components/dashboard/CareerCrosstab";
import { TimeEvolution } from "@/components/dashboard/TimeEvolution";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DimensionChangeBar } from "@/components/dashboard/DimensionChangeBar";
import { parseFilters } from "@/lib/dashboard/filters";
import {
  getKpiSummary,
  getPreferenceDistribution,
  getCareerCrosstab,
  getTimeSeries,
  getFilterOptions,
  getOpinionChangeByDimension,
} from "@/lib/dashboard/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);

  const [kpis, distribution, careers, timeSeries, options, opinionChange] = await Promise.all([
    getKpiSummary(filters),
    getPreferenceDistribution(filters),
    getCareerCrosstab(filters),
    getTimeSeries(filters),
    getFilterOptions(),
    getOpinionChangeByDimension(filters),
  ]);

  const isEmpty = kpis.total_inscritos === 0;

  return (
    <main>
      <section className="border-b border-[var(--color-border)] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="space-y-3">
            <p className="editorial-kicker">Análisis pedagógico · Segunda Vuelta 2026</p>
            <h1 className="font-display text-[clamp(2.25rem,5vw,4rem)] font-medium leading-[1.05] tracking-tight text-[var(--color-navy-upao)]">
              Resumen del grupo
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-graphite)] sm:text-base">
              Cifras del grupo completo: avance por bloque (pre / revisión / post), cambio de opinión por dimensión y
              preferencia declarada. Los estudiantes no ven nada de esto.
            </p>
          </div>
        </div>
      </section>

      <FiltersBar options={options} initialFilters={filters} />

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <section className="border-b border-[var(--color-border)] py-10 sm:py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <KpiGrid kpis={kpis} />
            </div>
          </section>

          <section className="border-b border-[var(--color-border)] py-10 sm:py-12">
            <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
              <SectionHeader
                kicker="Pivote pre / post"
                title="Cambio de opinión por dimensión"
                hint={`Compara el punto de vista antes y después de revisar los planes oficiales. ${Math.round(
                  kpis.opinion_change_rate * 100,
                )}% del grupo cambió de opinión en al menos una pregunta.`}
              />
              <DimensionChangeBar data={opinionChange} />
            </div>
          </section>

          <section className="border-b border-[var(--color-border)] py-10 sm:py-12">
            <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
              <SectionHeader
                kicker="Distribución"
                title="Preferencia declarada"
                hint={`${kpis.total_preferencias} estudiantes han declarado preferencia`}
              />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <PreferenceDonut data={distribution} />
                </div>
                <div className="lg:col-span-7">
                  <CareerCrosstab data={careers} />
                </div>
              </div>
            </div>
          </section>

          <section className="py-10 sm:py-12">
            <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
              <SectionHeader
                kicker="Tiempo"
                title="Evolución diaria"
                hint="Eventos por día: cierres de pre, cierres de post y preferencias declaradas."
              />
              <TimeEvolution data={timeSeries} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function SectionHeader({
  kicker,
  title,
  hint,
}: {
  kicker: string;
  title: string;
  hint?: string;
}) {
  return (
    <header className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
      <div className="space-y-1">
        <p className="editorial-kicker">{kicker}</p>
        <h2 className="font-display text-2xl font-medium text-[var(--color-navy-upao)] sm:text-3xl">
          {title}
        </h2>
      </div>
      {hint ? <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">{hint}</p> : null}
    </header>
  );
}

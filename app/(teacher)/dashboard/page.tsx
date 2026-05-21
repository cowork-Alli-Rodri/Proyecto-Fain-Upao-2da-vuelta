import type { Metadata } from "next";

import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { PreferenceDonut } from "@/components/dashboard/PreferenceDonut";
import { CareerCrosstab } from "@/components/dashboard/CareerCrosstab";
import { OrderEffectChart } from "@/components/dashboard/OrderEffectChart";
import { TimeEvolution } from "@/components/dashboard/TimeEvolution";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { parseFilters } from "@/lib/dashboard/filters";
import {
  getKpiSummary,
  getPreferenceDistribution,
  getCareerCrosstab,
  getOrderEffect,
  getTimeSeries,
  getFilterOptions,
} from "@/lib/dashboard/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);

  const [kpis, distribution, careers, orderEffect, timeSeries, options] = await Promise.all([
    getKpiSummary(filters),
    getPreferenceDistribution(filters),
    getCareerCrosstab(filters),
    getOrderEffect(filters),
    getTimeSeries(filters),
    getFilterOptions(),
  ]);

  const isEmpty = kpis.total_inscritos === 0;

  return (
    <main>
      {/* Hero del dashboard */}
      <section className="border-b border-[var(--color-border)] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="space-y-3">
            <p className="editorial-kicker">Análisis pedagógico · Voto Informado 2026</p>
            <h1 className="font-display text-[clamp(2.25rem,5vw,4rem)] font-medium leading-[1.05] tracking-tight text-[var(--color-navy-upao)]">
              Resumen del grupo
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-graphite)] sm:text-base">
              Datos agregados y anonimizables. Las preferencias individuales no se muestran a
              los estudiantes; solo a este dashboard.
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

          <section className="border-b border-[var(--color-border)] py-10 sm:py-12">
            <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
              <SectionHeader
                kicker="Control metodológico"
                title="Efecto del orden visual sobre la preferencia"
                hint="Q4 · El orden Keiko/Roberto se asigna 50/50 aleatorio. Esta vista mide si influyó."
              />
              <OrderEffectChart data={orderEffect} />
            </div>
          </section>

          <section className="py-10 sm:py-12">
            <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
              <SectionHeader
                kicker="Tiempo"
                title="Evolución diaria de preferencias"
                hint="Cada día, cuántos estudiantes declararon su preferencia y por quién."
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
      {hint ? <p className="text-sm text-[var(--color-muted-foreground)]">{hint}</p> : null}
    </header>
  );
}

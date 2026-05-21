import type { Metadata } from "next";

import { ExportPanel } from "@/components/dashboard/ExportPanel";
import { parseFilters } from "@/lib/dashboard/filters";

export const metadata: Metadata = { title: "Exportar resultados" };

export default async function ExportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);

  return (
    <main>
      <section className="border-b border-[var(--color-border)] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="space-y-3">
            <p className="editorial-kicker">Exportar resultados</p>
            <h1 className="font-display text-[clamp(2.25rem,5vw,4rem)] font-medium leading-[1.05] tracking-tight text-[var(--color-navy-upao)]">
              Cuatro formatos, cero fricción.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-graphite)] sm:text-base">
              CSV para análisis rápido, XLSX para presentar, HTML para Canva o un dataset
              tabular para Power BI Desktop. Los filtros activos en el dashboard se aplican al
              export.
            </p>
          </div>
        </div>
      </section>

      <ExportPanel filters={filters} />
    </main>
  );
}

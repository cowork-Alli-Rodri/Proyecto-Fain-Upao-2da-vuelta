import type { Metadata } from "next";

import { ExportPanel } from "@/components/dashboard/ExportPanel";
import { parseFilters } from "@/lib/dashboard/filters";
import { getCurrentRole } from "@/lib/auth/role";

export const metadata: Metadata = { title: "Exportar resultados" };

export default async function ExportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const role = await getCurrentRole();
  const isAdmin = role === "admin";

  return (
    <main>
      <section className="border-b border-[var(--color-border)] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="space-y-3">
            <p className="editorial-kicker">Descargar resultados</p>
            <h1 className="font-display text-[clamp(2.25rem,5vw,4rem)] font-medium leading-[1.05] tracking-tight text-[var(--color-navy-upao)]">
              Lleva los datos donde los necesites.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-graphite)] sm:text-base">
              Descarga la información en el formato que prefieras: Excel, una
              hoja para presentación o un archivo para Canva. Los filtros que
              tengas activos en el dashboard se aplican a lo que descargues.
            </p>
          </div>
        </div>
      </section>

      <ExportPanel filters={filters} isAdmin={isAdmin} />
    </main>
  );
}

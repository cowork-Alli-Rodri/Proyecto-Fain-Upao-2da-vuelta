"use client";

import { useState } from "react";

import { filtersToSearchParams, type DashboardFilters } from "@/lib/dashboard/filters";

type AnonymizeMode = "none" | "pseudonym" | "full";

const FORMATS = [
  {
    id: "csv",
    title: "CSV (preferencias)",
    desc: "Archivo plano, abre directo en Excel/Sheets. Incluye demografía + preferencia + motivo.",
    href: "/api/export/csv?view=preferencias",
  },
  {
    id: "csv-respuestas",
    title: "CSV (respuestas)",
    desc: "Una fila por respuesta del cuestionario. Útil para análisis detallado por pregunta.",
    href: "/api/export/csv?view=respuestas",
  },
  {
    id: "xlsx",
    title: "XLSX (Excel)",
    desc: "Tres hojas: Respuestas, Preferencias y KPIs. Header con estilo, freeze pane.",
    href: "/api/export/xlsx",
  },
  {
    id: "html",
    title: "HTML para Canva",
    desc: "HTML autocontenido con bloques editables. Importa en Canva con el código HTML.",
    href: "/api/export/html",
  },
  {
    id: "powerbi-csv",
    title: "Power BI · CSV plano",
    desc: "Dataset tabular plano para cargar en Power BI Desktop sin transformaciones.",
    href: "/api/export/powerbi?kind=csv",
  },
  {
    id: "powerbi-pbids",
    title: "Power BI · Manifest .pbids",
    desc: "Archivo .pbids que apunta al CSV de Power BI. Ábrelo con Power BI Desktop.",
    href: "/api/export/powerbi?kind=pbids",
  },
] as const;

export function ExportPanel({ filters }: { filters: DashboardFilters }) {
  const [anonymize, setAnonymize] = useState<AnonymizeMode>("pseudonym");

  function buildUrl(href: string) {
    const u = new URL(href, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    const sp = filtersToSearchParams(filters);
    sp.forEach((v, k) => u.searchParams.set(k, v));
    u.searchParams.set("anonymize", anonymize);
    return u.pathname + "?" + u.searchParams.toString();
  }

  return (
    <section className="py-10 sm:py-12">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6">
        {/* Anonimización */}
        <article className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
          <header className="space-y-1">
            <p className="editorial-kicker">Anonimización</p>
            <h2 className="font-display text-xl font-medium text-[var(--color-navy-upao)] sm:text-2xl">
              ¿Cuánta identidad incluir en el export?
            </h2>
          </header>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["pseudonym", "full"] as AnonymizeMode[]).map((mode) => (
              <AnonOption
                key={mode}
                id={mode}
                selected={anonymize === mode}
                onSelect={() => setAnonymize(mode)}
                title={mode === "pseudonym" ? "Pseudónimo (default)" : "Anónimo total"}
                desc={
                  mode === "pseudonym"
                    ? "Reemplaza nombre/email por un identificador estable. Permite joins entre exports."
                    : "Sin nombre, sin email, sin pseudo estable. Solo agregados."
                }
              />
            ))}
            <AnonOption
              id="none"
              selected={anonymize === "none"}
              onSelect={() => setAnonymize("none")}
              title="Sin anonimizar (admin)"
              desc="Solo disponible para admin. Incluye nombre y correo."
              disabledHint="Requiere rol admin"
            />
          </div>
        </article>

        {/* Formatos */}
        <article className="space-y-4">
          <header className="space-y-1">
            <p className="editorial-kicker">Formatos disponibles</p>
            <h2 className="font-display text-xl font-medium text-[var(--color-navy-upao)] sm:text-2xl">
              Elige cómo descargar
            </h2>
          </header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FORMATS.map((f) => (
              <a
                key={f.id}
                href={buildUrl(f.href)}
                download
                className="group flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] transition hover:border-[var(--color-navy-upao)] hover:shadow-[var(--shadow-fluffy)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-medium text-[var(--color-navy-upao)]">
                    {f.title}
                  </h3>
                  <span
                    aria-hidden
                    className="font-mono text-xs text-[var(--color-cyan-deep)] transition-transform group-hover:translate-x-1"
                  >
                    ↓
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[var(--color-graphite)]">{f.desc}</p>
              </a>
            ))}
          </div>
        </article>

        <p className="text-xs text-[var(--color-muted-foreground)]">
          Los exports respetan los filtros activos del dashboard (facultad, carrera, ciclo,
          fechas).
        </p>
      </div>
    </section>
  );
}

function AnonOption({
  id,
  selected,
  onSelect,
  title,
  desc,
  disabledHint,
}: {
  id: string;
  selected: boolean;
  onSelect: () => void;
  title: string;
  desc: string;
  disabledHint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col items-start gap-2 rounded-xl border-2 bg-[var(--color-surface)] p-4 text-left transition"
      style={{
        borderColor: selected
          ? "var(--color-navy-upao)"
          : "color-mix(in oklch, var(--color-smoke) 20%, transparent)",
        backgroundColor: selected
          ? "color-mix(in oklch, var(--color-navy-upao) 4%, white)"
          : undefined,
      }}
      aria-pressed={selected}
      aria-label={`${title}. ${desc}`}
    >
      <p className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--color-cyan-deep)]">
        {id}
      </p>
      <p className="text-sm font-medium text-[var(--color-foreground)]">{title}</p>
      <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">{desc}</p>
      {disabledHint ? (
        <p className="font-mono text-[0.65rem] text-[var(--color-coral-pulse)]">{disabledHint}</p>
      ) : null}
    </button>
  );
}

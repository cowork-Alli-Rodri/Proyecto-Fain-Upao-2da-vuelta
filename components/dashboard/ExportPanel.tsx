"use client";

import { useState } from "react";

import { filtersToSearchParams, type DashboardFilters } from "@/lib/dashboard/filters";

type AnonymizeMode = "none" | "pseudonym" | "full";

const FORMATS = [
  {
    id: "csv",
    title: "Preferencias (Excel/Sheets)",
    desc: "Una hoja con quién eligió a quién: nombre o código del estudiante, candidato, nivel de confianza, motivo y demografía. Se abre directo en Excel o Google Sheets.",
    href: "/api/export/csv?view=preferencias",
  },
  {
    id: "csv-respuestas",
    title: "Respuestas del cuestionario",
    desc: "Una hoja con cada respuesta a cada pregunta. Ideal si quieres analizar tendencias por pregunta o dimensión.",
    href: "/api/export/csv?view=respuestas",
  },
  {
    id: "xlsx",
    title: "Excel completo (3 hojas)",
    desc: "Un archivo .xlsx con tres pestañas: respuestas, preferencias y resumen general. Header con estilo y primera fila fijada.",
    href: "/api/export/xlsx",
  },
  {
    id: "html",
    title: "Para Canva",
    desc: "Archivo HTML con los datos listos para pegar en Canva. Útil para armar presentaciones rápido.",
    href: "/api/export/html",
  },
  {
    id: "powerbi-csv",
    title: "Power BI · Datos",
    desc: "Archivo plano para abrir directo en Power BI Desktop sin pasos extra de transformación.",
    href: "/api/export/powerbi?kind=csv",
  },
  {
    id: "powerbi-pbids",
    title: "Power BI · Conexión",
    desc: "Archivo de conexión que abre Power BI Desktop apuntando al archivo de datos anterior.",
    href: "/api/export/powerbi?kind=pbids",
  },
] as const;

export function ExportPanel({
  filters,
  isAdmin = false,
}: {
  filters: DashboardFilters;
  isAdmin?: boolean;
}) {
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
        {/* Privacidad del export */}
        <article className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
          <header className="space-y-1">
            <p className="editorial-kicker">Privacidad</p>
            <h2 className="font-display text-xl font-medium text-[var(--color-navy-upao)] sm:text-2xl">
              ¿Qué información personal de los estudiantes quieres en el archivo?
            </h2>
          </header>
          <div
            className={`grid grid-cols-1 gap-3 ${
              isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-2"
            }`}
          >
            <AnonOption
              id="01"
              selected={anonymize === "pseudonym"}
              onSelect={() => setAnonymize("pseudonym")}
              title="Identificador anónimo (recomendado)"
              desc="A cada estudiante se le asigna un código. No se ven nombres ni correos, pero puedes cruzar archivos porque el código es el mismo entre descargas."
            />
            <AnonOption
              id="02"
              selected={anonymize === "full"}
              onSelect={() => setAnonymize("full")}
              title="Solo conteos"
              desc="Únicamente cifras agregadas y porcentajes. No es posible identificar a nadie ni vincular archivos."
            />
            {isAdmin ? (
              <AnonOption
                id="03"
                selected={anonymize === "none"}
                onSelect={() => setAnonymize("none")}
                title="Con nombre y correo"
                desc="Incluye nombre completo, correo y toda la demografía. Útil si necesitas contactar a estudiantes específicos."
              />
            ) : null}
          </div>
        </article>

        {/* Formatos */}
        <article className="space-y-4">
          <header className="space-y-1">
            <p className="editorial-kicker">Formato del archivo</p>
            <h2 className="font-display text-xl font-medium text-[var(--color-navy-upao)] sm:text-2xl">
              ¿Cómo quieres descargar los datos?
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
          Cada descarga incluye solo los estudiantes que cumplen los filtros que
          tengas activos en el dashboard (facultad, carrera, ciclo, rango de fechas).
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
}: {
  id: string;
  selected: boolean;
  onSelect: () => void;
  title: string;
  desc: string;
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
    </button>
  );
}

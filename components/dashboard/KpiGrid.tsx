import type { KpiSummary } from "@/lib/dashboard/queries";

export function KpiGrid({ kpis }: { kpis: KpiSummary }) {
  const cards = [
    {
      kicker: "Inscritos",
      label: "Estudiantes registrados",
      value: kpis.total_inscritos,
      accent: "var(--color-navy-upao)",
    },
    {
      kicker: "Completaron",
      label: "Cuestionario terminado",
      value: kpis.total_completados,
      sub: `${kpis.pct_avance}% del grupo`,
      accent: "var(--color-cyan-deep)",
    },
    {
      kicker: "Preferencia",
      label: "Declararon su voto",
      value: kpis.total_preferencias,
      accent: "var(--color-mango-sun)",
    },
    {
      kicker: "Sin preferencia",
      label: "Completaron cuestionario sin declarar",
      value: kpis.total_sin_preferencia,
      accent: "var(--color-graphite)",
    },
    {
      kicker: "Confianza",
      label: "Promedio de confianza declarada",
      value: kpis.confianza_promedio === null ? "—" : `${kpis.confianza_promedio}/10`,
      accent: "var(--color-coral-pulse)",
      mono: true,
    },
    {
      kicker: "Avance",
      label: "Tasa de completitud",
      value: `${kpis.pct_avance}%`,
      accent: "var(--color-mint-success)",
      mono: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <article key={c.kicker} className="space-y-2 bg-[var(--color-surface)] p-5 sm:p-6">
          <p
            className="font-mono text-[0.65rem] uppercase tracking-[0.2em]"
            style={{ color: c.accent }}
          >
            {c.kicker}
          </p>
          <p
            className={
              c.mono
                ? "font-mono text-[clamp(2rem,4vw,3rem)] font-medium leading-none"
                : "font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-none"
            }
            style={{ color: c.accent }}
          >
            {c.value}
          </p>
          <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">{c.label}</p>
          {c.sub ? (
            <p className="font-mono text-[0.7rem] text-[var(--color-graphite)]">{c.sub}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

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
      kicker: "Completaron pre",
      label: "Cerraron el primer bloque",
      value: kpis.total_completaron_pre,
      sub: `${pct(kpis.total_completaron_pre, kpis.total_inscritos)}% del grupo`,
      accent: "var(--color-cyan-deep)",
    },
    {
      kicker: "Vieron candidatos",
      label: "Revisaron las 4 dimensiones JNE",
      value: kpis.total_completaron_candidatos,
      sub: `${pct(kpis.total_completaron_candidatos, kpis.total_inscritos)}% del grupo`,
      accent: "var(--color-coral-pulse)",
    },
    {
      kicker: "Completaron post",
      label: "Cerraron el segundo bloque",
      value: kpis.total_completaron_post,
      sub: `${pct(kpis.total_completaron_post, kpis.total_inscritos)}% del grupo`,
      accent: "var(--color-mint-success)",
    },
    {
      kicker: "Cambio opinión",
      label: "Cambió postura en al menos 1 pregunta",
      value: `${Math.round(kpis.opinion_change_rate * 100)}%`,
      accent: "var(--color-mango-sun)",
      mono: true,
    },
    {
      kicker: "Preferencia",
      label: "Declararon su voto",
      value: kpis.total_preferencias,
      sub: kpis.total_sin_preferencia > 0 ? `${kpis.total_sin_preferencia} sin declarar` : undefined,
      accent: "var(--color-navy-deep)",
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
      label: "Completaron flujo completo",
      value: `${kpis.pct_avance}%`,
      accent: "var(--color-mint-success)",
      mono: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2 lg:grid-cols-4">
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

function pct(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

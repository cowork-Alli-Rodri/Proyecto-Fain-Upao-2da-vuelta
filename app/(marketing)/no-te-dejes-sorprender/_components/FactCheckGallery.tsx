import { ArrowUpRight, ShieldAlert } from "lucide-react";

export interface PublishedFactCheck {
  id: string;
  titular_falso: string;
  contexto: string;
  fact_checker_name: string;
  fact_checker_url: string;
  candidato_relacionado: "keiko" | "roberto" | "ambos" | "ninguno" | null;
  fecha_origen: string | null;
  published_at: string | null;
}

const CANDIDATO_LABEL: Record<string, string> = {
  keiko: "Keiko Fujimori",
  roberto: "Roberto Sánchez",
  ambos: "Ambas candidaturas",
  ninguno: "Contexto general",
};

const CANDIDATO_COLOR: Record<string, string> = {
  keiko: "var(--color-candidate-keiko)",
  roberto: "var(--color-candidate-roberto)",
  ambos: "var(--color-orange-upao)",
  ninguno: "var(--color-graphite)",
};

/**
 * Sección server-rendered que lista los fact-checks ya curados.
 * Backed por Supabase con ISR de 30 minutos — cero llamadas a Google API
 * y una sola query a la DB por ventana de cache.
 */
export function FactCheckGallery({ items }: { items: PublishedFactCheck[] }) {
  if (items.length === 0) return null;

  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6">
        <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <p className="editorial-kicker text-[var(--color-coral-pulse)]">
              Casos destacados
            </p>
            <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-tight tracking-tight text-[var(--color-navy-upao)]">
              Desinformación{" "}
              <span className="italic text-[var(--color-coral-pulse)]">
                que ya circuló
              </span>
              .
            </h2>
          </div>
          <p className="max-w-sm text-sm text-[var(--color-graphite)]">
            Verificaciones recientes sobre la Segunda Vuelta 2026 publicadas
            por medios reconocidos. Si el verificador no encuentra tu frase,
            quizá esté aquí.
          </p>
        </header>

        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((fc) => (
            <FactCheckCard key={fc.id} fc={fc} />
          ))}
        </ul>

        <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
          La lista se actualiza cada 30 minutos. Para verificar una afirmación
          específica que no esté aquí, usa el verificador automático arriba.
        </p>
      </div>
    </section>
  );
}

function FactCheckCard({ fc }: { fc: PublishedFactCheck }) {
  const cand = fc.candidato_relacionado ?? "ninguno";
  const accent = CANDIDATO_COLOR[cand] ?? "var(--color-graphite)";
  const label = CANDIDATO_LABEL[cand] ?? "Contexto";

  return (
    <li
      className="group flex flex-col gap-3 rounded-2xl border bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-fluffy)]"
      style={{ borderColor: `color-mix(in oklch, ${accent} 25%, transparent)` }}
    >
      <header className="flex items-start justify-between gap-3">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white"
          style={{ backgroundColor: accent }}
        >
          <ShieldAlert className="h-3 w-3" aria-hidden />
          {label}
        </span>
        {fc.fecha_origen ? (
          <time
            dateTime={fc.fecha_origen}
            className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]"
          >
            {fc.fecha_origen}
          </time>
        ) : null}
      </header>

      <h3 className="font-display text-base font-medium leading-snug text-[var(--color-navy-upao)] sm:text-lg">
        {fc.titular_falso}
      </h3>

      <p className="text-xs leading-relaxed text-[var(--color-graphite)]">
        {fc.contexto.length > 180
          ? `${fc.contexto.slice(0, 180).trimEnd()}…`
          : fc.contexto}
      </p>

      <a
        href={fc.fact_checker_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-cyan-deep)] hover:underline"
      >
        Leer en {fc.fact_checker_name}
        <ArrowUpRight className="h-3 w-3 transition group-hover:translate-x-0.5" aria-hidden />
      </a>
    </li>
  );
}

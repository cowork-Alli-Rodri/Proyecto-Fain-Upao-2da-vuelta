import type { OpinionChangeByDimensionRow } from "@/lib/dashboard/queries";

const DIMENSION_LABEL: Record<OpinionChangeByDimensionRow["dimension"], string> = {
  educacion: "Educación",
  juventud: "Juventud",
  trabajo: "Trabajo",
  economia: "Economía",
  social_publicas: "Políticas públicas",
};

/**
 * Bar chart horizontal por dimensión cuestionario.
 * El eje 0 va al centro: barras a la izquierda = delta negativo (más en desacuerdo),
 * a la derecha = delta positivo (más de acuerdo).
 * Escala fija -4..+4 (rango teórico máximo en Likert 1-5).
 */
export function DimensionChangeBar({ data }: { data: OpinionChangeByDimensionRow[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Aún no hay suficientes respuestas pre/post para mostrar cambio por dimensión.
        </p>
      </div>
    );
  }

  const MAX_DELTA = 4;

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <header className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-graphite)]">
        <span>− En desacuerdo</span>
        <span>0</span>
        <span>+ De acuerdo</span>
      </header>

      <div className="space-y-3">
        {data.map((row) => {
          const pct = Math.min(Math.abs(row.avg_delta) / MAX_DELTA, 1) * 50;
          const isPositive = row.avg_delta >= 0;
          return (
            <div key={row.dimension} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-[var(--color-ink)]">
                  {DIMENSION_LABEL[row.dimension]}
                </span>
                <span className="font-mono text-xs text-[var(--color-graphite)]">
                  Δ {row.avg_delta > 0 ? "+" : ""}
                  {row.avg_delta} · {row.n_changed}/{row.n_total} cambiaron
                </span>
              </div>
              <div className="relative h-6 rounded-full bg-[var(--color-bone)]">
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-1/2 w-px bg-[var(--color-border-strong)]"
                />
                <div
                  className="absolute inset-y-1 rounded"
                  style={{
                    [isPositive ? "left" : "right"]: "50%",
                    width: `${pct}%`,
                    backgroundColor: isPositive
                      ? "var(--color-mint-success)"
                      : "var(--color-coral-pulse)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

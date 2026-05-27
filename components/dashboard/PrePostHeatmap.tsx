import type { PrePostHeatmapCell } from "@/lib/dashboard/queries";

/**
 * Matriz 5x5 Pre × Post para una pregunta Likert.
 * Las celdas en la diagonal = no cambió. Por encima = subió. Por debajo = bajó.
 * Color de la celda según count relativo (más oscuro = más casos).
 */
export function PrePostHeatmap({
  cells,
  questionTitle,
}: {
  cells: PrePostHeatmapCell[];
  questionTitle: string;
}) {
  const max = cells.reduce((m, c) => Math.max(m, c.count), 0);

  const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  for (const c of cells) {
    if (c.valor_pre >= 1 && c.valor_pre <= 5 && c.valor_post >= 1 && c.valor_post <= 5) {
      grid[c.valor_pre - 1]![c.valor_post - 1] = c.count;
    }
  }

  return (
    <figure className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <figcaption className="space-y-1">
        <p className="editorial-kicker">Heatmap pre × post</p>
        <p className="text-sm leading-snug text-[var(--color-ink)]">{questionTitle}</p>
      </figcaption>

      <div className="overflow-x-auto">
        <table className="mx-auto border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2 text-right font-mono uppercase text-[0.6rem] tracking-[0.18em] text-[var(--color-graphite)]">
                Pre ↓ / Post →
              </th>
              {[1, 2, 3, 4, 5].map((post) => (
                <th
                  key={post}
                  className="p-2 text-center font-mono uppercase text-[0.7rem] tracking-[0.18em] text-[var(--color-graphite)]"
                >
                  {post}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((pre) => (
              <tr key={pre}>
                <th
                  scope="row"
                  className="p-2 text-right font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-graphite)]"
                >
                  {pre}
                </th>
                {[1, 2, 3, 4, 5].map((post) => {
                  const count = grid[pre - 1]![post - 1]!;
                  const intensity = max > 0 ? count / max : 0;
                  const isDiagonal = pre === post;
                  return (
                    <td
                      key={post}
                      title={`Pre ${pre} → Post ${post}: ${count} estudiantes`}
                      className="h-12 w-12 border border-[var(--color-border)] text-center font-mono text-xs"
                      style={{
                        backgroundColor: isDiagonal
                          ? `color-mix(in oklch, var(--color-graphite) ${intensity * 60}%, white)`
                          : pre < post
                            ? `color-mix(in oklch, var(--color-mint-success) ${intensity * 70}%, white)`
                            : `color-mix(in oklch, var(--color-coral-pulse) ${intensity * 70}%, white)`,
                        color: intensity > 0.5 ? "white" : "var(--color-ink)",
                      }}
                    >
                      {count > 0 ? count : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)]">
        Diagonal = no cambió · Verde = subió · Coral = bajó
      </p>
    </figure>
  );
}

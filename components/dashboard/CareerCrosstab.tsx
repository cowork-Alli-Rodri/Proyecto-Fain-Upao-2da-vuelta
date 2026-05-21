import type { CareerRow } from "@/lib/dashboard/queries";

const KEIKO = "var(--color-candidate-keiko)";
const ROBERTO = "var(--color-candidate-roberto)";
const INDECISO = "var(--color-mist)";

export function CareerCrosstab({ data }: { data: CareerRow[] }) {
  if (data.length === 0) {
    return (
      <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-soft)]">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Aún no hay datos por carrera para los filtros seleccionados.
        </p>
      </article>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <p className="editorial-kicker mb-4">Cruce · preferencia × carrera</p>
      <ul className="space-y-3">
        {data.slice(0, 8).map((row) => {
          const widthPct = (row.total / maxTotal) * 100;
          return (
            <li key={`${row.facultad}|${row.carrera}`} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
                  {row.carrera}
                </p>
                <p className="font-mono text-xs text-[var(--color-muted-foreground)]">
                  {row.total}
                </p>
              </div>
              <div
                className="relative flex h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-3)]"
                style={{ width: `${widthPct}%` }}
                aria-label={`Total ${row.total} respuestas`}
              >
                {row.keiko > 0 ? (
                  <span
                    className="block h-full"
                    style={{
                      width: `${(row.keiko / row.total) * 100}%`,
                      backgroundColor: KEIKO,
                    }}
                  />
                ) : null}
                {row.roberto > 0 ? (
                  <span
                    className="block h-full"
                    style={{
                      width: `${(row.roberto / row.total) * 100}%`,
                      backgroundColor: ROBERTO,
                    }}
                  />
                ) : null}
                {row.indeciso > 0 ? (
                  <span
                    className="block h-full"
                    style={{
                      width: `${(row.indeciso / row.total) * 100}%`,
                      backgroundColor: INDECISO,
                    }}
                  />
                ) : null}
              </div>
              <p className="font-mono text-[0.65rem] text-[var(--color-muted-foreground)]">
                {row.facultad}
              </p>
            </li>
          );
        })}
      </ul>
      {data.length > 8 ? (
        <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--color-muted-foreground)]">
          {data.length - 8} carreras adicionales (exporta para ver todas)
        </p>
      ) : null}
      <Legend />
    </article>
  );
}

function Legend() {
  return (
    <ul className="mt-5 flex flex-wrap gap-4 border-t border-[var(--color-border)] pt-4 text-xs">
      <LegendItem color={KEIKO} label="Keiko" />
      <LegendItem color={ROBERTO} label="Roberto" />
      <LegendItem color={INDECISO} label="Indeciso/a" />
    </ul>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
      <span className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </li>
  );
}

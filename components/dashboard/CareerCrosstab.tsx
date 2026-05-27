"use client";

import { useTooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip";
import type { CareerRow } from "@/lib/dashboard/queries";

const KEIKO = "var(--color-candidate-keiko)";
const ROBERTO = "var(--color-candidate-roberto)";
const INDECISO = "var(--color-mist)";

const TOOLTIP_STYLES = {
  ...defaultStyles,
  background: "var(--color-surface)",
  border: "1px solid var(--color-border-strong)",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 12,
  color: "var(--color-foreground)",
  boxShadow: "var(--shadow-soft)",
} as const;

export function CareerCrosstab({ data }: { data: CareerRow[] }) {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<CareerRow>();

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
    <article className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <p className="editorial-kicker mb-4">Cruce · preferencia × carrera</p>
      <ul className="space-y-3">
        {data.slice(0, 8).map((row) => {
          const widthPct = (row.total / maxTotal) * 100;
          const handleEnter = (event: React.MouseEvent<HTMLLIElement>) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const parent = event.currentTarget.offsetParent?.getBoundingClientRect();
            showTooltip({
              tooltipData: row,
              tooltipLeft: event.clientX - (parent?.left ?? 0),
              tooltipTop: rect.top - (parent?.top ?? 0) - 8,
            });
          };
          const handleMove = (event: React.MouseEvent<HTMLLIElement>) => {
            const parent = event.currentTarget.offsetParent?.getBoundingClientRect();
            const rect = event.currentTarget.getBoundingClientRect();
            showTooltip({
              tooltipData: row,
              tooltipLeft: event.clientX - (parent?.left ?? 0),
              tooltipTop: rect.top - (parent?.top ?? 0) - 8,
            });
          };
          return (
            <li
              key={`${row.facultad}|${row.carrera}`}
              className="cursor-default space-y-1.5 rounded-md px-2 py-1 transition-colors hover:bg-[var(--color-surface-2)]"
              onMouseEnter={handleEnter}
              onMouseMove={handleMove}
              onMouseLeave={hideTooltip}
            >
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

      {tooltipOpen && tooltipData ? (
        <TooltipWithBounds
          top={tooltipTop}
          left={tooltipLeft}
          style={TOOLTIP_STYLES}
        >
          <div className="space-y-1">
            <p className="font-medium text-[var(--color-foreground)]">
              {tooltipData.facultad} · {tooltipData.carrera}
            </p>
            <ul className="space-y-0.5 font-mono text-[11px]">
              <li className="flex items-center gap-2">
                <span
                  className="block h-2 w-2 rounded-full"
                  style={{ backgroundColor: KEIKO }}
                />
                <span>Keiko: {tooltipData.keiko}</span>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="block h-2 w-2 rounded-full"
                  style={{ backgroundColor: ROBERTO }}
                />
                <span>Roberto: {tooltipData.roberto}</span>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="block h-2 w-2 rounded-full"
                  style={{ backgroundColor: INDECISO }}
                />
                <span>Indeciso/a: {tooltipData.indeciso}</span>
              </li>
            </ul>
            <p className="border-t border-[var(--color-border)] pt-1 text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)]">
              Total {tooltipData.total}
            </p>
          </div>
        </TooltipWithBounds>
      ) : null}
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

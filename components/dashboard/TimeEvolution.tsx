"use client";

import { Group } from "@visx/group";
import { LinePath, Bar, Line, Circle } from "@visx/shape";
import { scaleLinear, scaleTime } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { ParentSize } from "@visx/responsive";
import { useTooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip";

import type { TimeSeriesRow } from "@/lib/dashboard/queries";

const MARGIN = { top: 16, right: 24, bottom: 36, left: 36 };

const CANDIDATO_COLOR: Record<"keiko" | "roberto" | "indeciso", string> = {
  keiko: "var(--color-candidate-keiko)",
  roberto: "var(--color-candidate-roberto)",
  indeciso: "var(--color-mist)",
};

const CANDIDATO_LABEL: Record<"keiko" | "roberto" | "indeciso", string> = {
  keiko: "Keiko",
  roberto: "Roberto",
  indeciso: "Indeciso",
};

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

interface Series {
  candidato: "keiko" | "roberto" | "indeciso";
  points: { fecha: Date; n: number }[];
}

interface TooltipDatum {
  fecha: Date;
  keiko: number;
  roberto: number;
  indeciso: number;
}

function findClosestDate(dates: Date[], target: Date): Date | undefined {
  if (dates.length === 0) return undefined;
  const targetTime = target.getTime();
  let closest = dates[0]!;
  let minDiff = Math.abs(closest.getTime() - targetTime);
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.abs(dates[i]!.getTime() - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closest = dates[i]!;
    }
  }
  return closest;
}

export function TimeEvolution({ data }: { data: TimeSeriesRow[] }) {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<TooltipDatum>();

  // Convertir a series por candidato
  const candidatos: ("keiko" | "roberto" | "indeciso")[] = ["keiko", "roberto", "indeciso"];
  const byCandidato: Record<string, Map<string, number>> = {};
  for (const c of candidatos) byCandidato[c] = new Map();
  const fechasSet = new Set<string>();
  for (const r of data) {
    fechasSet.add(r.fecha);
    byCandidato[r.candidato]!.set(r.fecha, (byCandidato[r.candidato]!.get(r.fecha) ?? 0) + r.n);
  }
  const fechas = Array.from(fechasSet).sort();
  const fechaDates = fechas.map((f) => new Date(`${f}T00:00:00-05:00`));

  const series: Series[] = candidatos.map((c) => {
    const map = byCandidato[c]!;
    return {
      candidato: c,
      points: fechas.map((f) => ({
        fecha: new Date(`${f}T00:00:00-05:00`),
        n: map.get(f) ?? 0,
      })),
    };
  });

  const allValues = series.flatMap((s) => s.points.map((p) => p.n));
  const maxVal = Math.max(...allValues, 1);

  if (fechas.length === 0) {
    return (
      <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-soft)]">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Sin preferencias declaradas en el rango seleccionado.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <p className="editorial-kicker mb-4">Evolución diaria · Lima TZ</p>
      <div className="relative h-72 w-full">
        <ParentSize>
          {({ width, height }) => {
            if (width === 0) return null;
            const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
            const innerH = Math.max(0, height - MARGIN.top - MARGIN.bottom);

            const minDate = fechaDates[0] ?? new Date();
            const maxDate = fechaDates[fechaDates.length - 1] ?? new Date();

            const xScale = scaleTime({
              domain: [minDate, maxDate],
              range: [0, innerW],
            });
            const yScale = scaleLinear({
              domain: [0, maxVal],
              range: [innerH, 0],
              nice: true,
            });

            const handleMove = (
              event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>,
            ) => {
              const svgEl = event.currentTarget.ownerSVGElement;
              if (!svgEl) return;
              const point =
                "touches" in event
                  ? event.touches[0]
                  : (event as React.MouseEvent<SVGRectElement>);
              if (!point) return;
              const rect = svgEl.getBoundingClientRect();
              const xInSvg = point.clientX - rect.left;
              const xInChart = xInSvg - MARGIN.left;
              const x0 = xScale.invert(xInChart);
              const closest = findClosestDate(fechaDates, x0);
              if (!closest) return;
              const isoKey = fechas.find(
                (f) => new Date(`${f}T00:00:00-05:00`).getTime() === closest.getTime(),
              );
              if (!isoKey) return;
              const datum: TooltipDatum = {
                fecha: closest,
                keiko: byCandidato.keiko!.get(isoKey) ?? 0,
                roberto: byCandidato.roberto!.get(isoKey) ?? 0,
                indeciso: byCandidato.indeciso!.get(isoKey) ?? 0,
              };
              showTooltip({
                tooltipData: datum,
                tooltipLeft: MARGIN.left + xScale(closest),
                tooltipTop: point.clientY - rect.top,
              });
            };

            return (
              <svg width={width} height={height}>
                <Group left={MARGIN.left} top={MARGIN.top}>
                  <GridRows
                    scale={yScale}
                    width={innerW}
                    stroke="var(--color-border)"
                    strokeOpacity={0.6}
                    numTicks={4}
                  />

                  {series.map((s) => (
                    <LinePath
                      key={s.candidato}
                      data={s.points}
                      x={(d) => xScale(d.fecha) ?? 0}
                      y={(d) => yScale(d.n) ?? 0}
                      stroke={CANDIDATO_COLOR[s.candidato]}
                      strokeWidth={2.5}
                      curve={curveMonotoneX}
                      shapeRendering="geometricPrecision"
                    />
                  ))}

                  <AxisBottom
                    top={innerH}
                    scale={xScale}
                    stroke="var(--color-border)"
                    tickStroke="var(--color-border)"
                    numTicks={Math.min(5, fechas.length)}
                    tickFormat={(d) => {
                      const date = d as Date;
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                    tickLabelProps={() => ({
                      fontSize: 10,
                      fill: "var(--color-muted-foreground)",
                      textAnchor: "middle",
                    })}
                  />
                  <AxisLeft
                    scale={yScale}
                    stroke="var(--color-border)"
                    tickStroke="var(--color-border)"
                    numTicks={4}
                    tickLabelProps={() => ({
                      fontSize: 10,
                      fill: "var(--color-muted-foreground)",
                      textAnchor: "end",
                      dx: -4,
                    })}
                  />

                  {tooltipOpen && tooltipData ? (
                    <>
                      <Line
                        from={{ x: xScale(tooltipData.fecha), y: 0 }}
                        to={{ x: xScale(tooltipData.fecha), y: innerH }}
                        stroke="var(--color-border-strong)"
                        strokeWidth={1}
                        strokeDasharray="3,3"
                        pointerEvents="none"
                      />
                      {candidatos.map((c) => (
                        <Circle
                          key={`dot-${c}`}
                          cx={xScale(tooltipData.fecha)}
                          cy={yScale(tooltipData[c])}
                          r={4}
                          fill={CANDIDATO_COLOR[c]}
                          stroke="var(--color-surface)"
                          strokeWidth={2}
                          pointerEvents="none"
                        />
                      ))}
                    </>
                  ) : null}

                  <Bar
                    x={0}
                    y={0}
                    width={innerW}
                    height={innerH}
                    fill="transparent"
                    onMouseMove={handleMove}
                    onTouchMove={handleMove}
                    onMouseLeave={hideTooltip}
                    onTouchEnd={hideTooltip}
                  />
                </Group>
              </svg>
            );
          }}
        </ParentSize>

        {tooltipOpen && tooltipData ? (
          <TooltipWithBounds
            top={tooltipTop}
            left={tooltipLeft}
            style={TOOLTIP_STYLES}
          >
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-widest text-[var(--color-muted-foreground)]">
                {formatFechaLarga(tooltipData.fecha)}
              </p>
              <ul className="space-y-0.5 font-mono text-[11px]">
                {candidatos.map((c) => (
                  <li key={c} className="flex items-center gap-2">
                    <span
                      className="block h-2 w-2 rounded-full"
                      style={{ backgroundColor: CANDIDATO_COLOR[c] }}
                    />
                    <span>
                      {CANDIDATO_LABEL[c]}: {tooltipData[c]}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-[var(--color-border)] pt-1 font-mono text-[10px] text-[var(--color-muted-foreground)]">
                Total {tooltipData.keiko + tooltipData.roberto + tooltipData.indeciso}{" "}
                preferencias
              </p>
            </div>
          </TooltipWithBounds>
        ) : null}
      </div>

      <ul className="mt-4 flex flex-wrap gap-4 border-t border-[var(--color-border)] pt-4 text-xs">
        {candidatos.map((c) => (
          <li
            key={c}
            className="flex items-center gap-2 text-[var(--color-muted-foreground)]"
          >
            <span
              className="block h-0.5 w-4 rounded"
              style={{ backgroundColor: CANDIDATO_COLOR[c] }}
            />
            <span>{CANDIDATO_LABEL[c]}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function formatFechaLarga(d: Date): string {
  const MESES = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

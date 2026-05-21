"use client";

import { Group } from "@visx/group";
import { LinePath } from "@visx/shape";
import { scaleLinear, scaleTime } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { ParentSize } from "@visx/responsive";

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

interface Series {
  candidato: "keiko" | "roberto" | "indeciso";
  points: { fecha: Date; n: number }[];
}

export function TimeEvolution({ data }: { data: TimeSeriesRow[] }) {
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
      <div className="h-72 w-full">
        <ParentSize>
          {({ width, height }) => {
            if (width === 0) return null;
            const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
            const innerH = Math.max(0, height - MARGIN.top - MARGIN.bottom);

            const minDate = fechas[0] ? new Date(`${fechas[0]}T00:00:00-05:00`) : new Date();
            const maxDate = fechas[fechas.length - 1]
              ? new Date(`${fechas[fechas.length - 1]}T00:00:00-05:00`)
              : new Date();

            const xScale = scaleTime({
              domain: [minDate, maxDate],
              range: [0, innerW],
            });
            const yScale = scaleLinear({
              domain: [0, maxVal],
              range: [innerH, 0],
              nice: true,
            });

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
                </Group>
              </svg>
            );
          }}
        </ParentSize>
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

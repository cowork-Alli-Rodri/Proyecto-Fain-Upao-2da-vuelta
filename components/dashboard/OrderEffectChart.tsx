"use client";

import { Group } from "@visx/group";
import { BarGroupHorizontal, Bar } from "@visx/shape";
import { scaleBand, scaleLinear, scaleOrdinal } from "@visx/scale";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { ParentSize } from "@visx/responsive";

import type { OrderEffectRow } from "@/lib/dashboard/queries";

const MARGIN = { top: 16, right: 16, bottom: 36, left: 110 };

const CANDIDATO_COLOR: Record<"keiko" | "roberto" | "indeciso", string> = {
  keiko: "var(--color-candidate-keiko)",
  roberto: "var(--color-candidate-roberto)",
  indeciso: "var(--color-mist)",
};

const ORDEN_LABEL: Record<"keiko_left" | "roberto_left", string> = {
  keiko_left: "Keiko izquierda",
  roberto_left: "Roberto izquierda",
};

interface BarDatum {
  orden: "keiko_left" | "roberto_left";
  keiko: number;
  roberto: number;
  indeciso: number;
}

export function OrderEffectChart({ data }: { data: OrderEffectRow[] }) {
  // Reagrupa a 2 filas (una por orden) con 3 candidatos cada una
  const grouped: BarDatum[] = (["keiko_left", "roberto_left"] as const).map((orden) => {
    const row: BarDatum = { orden, keiko: 0, roberto: 0, indeciso: 0 };
    for (const d of data) {
      if (d.orden === orden) row[d.candidato] = d.n;
    }
    return row;
  });

  const allValues = grouped.flatMap((d) => [d.keiko, d.roberto, d.indeciso]);
  const maxVal = Math.max(...allValues, 1);
  const totalRespuestas = allValues.reduce((a, b) => a + b, 0);

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="editorial-kicker">Control de sesgo · Q4</p>
        <p className="font-mono text-xs text-[var(--color-muted-foreground)]">
          {totalRespuestas} respuestas
        </p>
      </div>

      {totalRespuestas === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
          Sin preferencias declaradas todavía.
        </p>
      ) : (
        <div className="mt-5 h-64 w-full">
          <ParentSize>
            {({ width, height }) => {
              if (width === 0) return null;
              const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
              const innerH = Math.max(0, height - MARGIN.top - MARGIN.bottom);

              const ordenScale = scaleBand({
                domain: ["keiko_left", "roberto_left"],
                range: [0, innerH],
                padding: 0.3,
              });
              const candidatoScale = scaleBand({
                domain: ["keiko", "roberto", "indeciso"],
                range: [0, ordenScale.bandwidth()],
                padding: 0.1,
              });
              const xScale = scaleLinear({
                domain: [0, maxVal],
                range: [0, innerW],
                nice: true,
              });
              const colorScale = scaleOrdinal({
                domain: ["keiko", "roberto", "indeciso"],
                range: [
                  CANDIDATO_COLOR.keiko,
                  CANDIDATO_COLOR.roberto,
                  CANDIDATO_COLOR.indeciso,
                ],
              });

              return (
                <svg width={width} height={height}>
                  <Group left={MARGIN.left} top={MARGIN.top}>
                    <BarGroupHorizontal
                      data={grouped}
                      keys={["keiko", "roberto", "indeciso"]}
                      width={innerW}
                      y0={(d) => d.orden}
                      y0Scale={ordenScale}
                      y1Scale={candidatoScale}
                      xScale={xScale}
                      color={(k) => colorScale(k) as string}
                    >
                      {(barGroups) =>
                        barGroups.map((group) => (
                          <Group
                            key={`bg-${group.index}`}
                            top={group.y0}
                          >
                            {group.bars.map((bar) => (
                              <Bar
                                key={`bar-${group.index}-${bar.index}`}
                                x={0}
                                y={bar.y}
                                width={bar.width}
                                height={bar.height}
                                fill={bar.color}
                                rx={3}
                              />
                            ))}
                          </Group>
                        ))
                      }
                    </BarGroupHorizontal>

                    <AxisLeft
                      scale={ordenScale}
                      tickFormat={(v) => ORDEN_LABEL[v as "keiko_left" | "roberto_left"]}
                      hideAxisLine
                      hideTicks
                      tickLabelProps={() => ({
                        fontSize: 11,
                        fill: "var(--color-foreground)",
                        textAnchor: "end",
                        dx: -8,
                        dy: 4,
                      })}
                    />
                    <AxisBottom
                      top={innerH}
                      scale={xScale}
                      stroke="var(--color-border)"
                      tickStroke="var(--color-border)"
                      numTicks={5}
                      tickLabelProps={() => ({
                        fontSize: 10,
                        fill: "var(--color-muted-foreground)",
                        textAnchor: "middle",
                      })}
                    />
                  </Group>
                </svg>
              );
            }}
          </ParentSize>
        </div>
      )}

      <ul className="mt-4 flex flex-wrap gap-4 border-t border-[var(--color-border)] pt-4 text-xs">
        <LegendItem color={CANDIDATO_COLOR.keiko} label="Keiko" />
        <LegendItem color={CANDIDATO_COLOR.roberto} label="Roberto" />
        <LegendItem color={CANDIDATO_COLOR.indeciso} label="Indeciso/a" />
      </ul>
    </article>
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

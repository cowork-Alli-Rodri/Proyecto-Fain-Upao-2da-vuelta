"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import type { PreferenceDistribution } from "@/lib/dashboard/queries";

const COLORS: Record<"keiko" | "roberto" | "indeciso", string> = {
  keiko: "var(--color-candidate-keiko)",
  roberto: "var(--color-candidate-roberto)",
  indeciso: "var(--color-mist)",
};

const LABELS: Record<"keiko" | "roberto" | "indeciso", string> = {
  keiko: "Keiko Fujimori",
  roberto: "Roberto Sánchez",
  indeciso: "Indeciso/a",
};

export function PreferenceDonut({ data }: { data: PreferenceDistribution[] }) {
  const chartData = data.map((d) => ({
    ...d,
    name: LABELS[d.candidato],
    fill: COLORS[d.candidato],
  }));

  const total = data.reduce((acc, d) => acc + d.n, 0);

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <p className="editorial-kicker mb-4">Distribución</p>
      <div className="relative aspect-square w-full max-w-sm">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="n"
              nameKey="name"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border-strong)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, name) => [`${value as number} respuestas`, name as string]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Centro del donut con total */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-mono text-4xl font-medium text-[var(--color-navy-upao)]">{total}</p>
          <p className="text-xs uppercase tracking-widest text-[var(--color-muted-foreground)]">
            preferencias
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {chartData.map((d) => (
          <li key={d.candidato} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span
                className="block h-3 w-3 rounded-full"
                style={{ backgroundColor: d.fill }}
                aria-hidden
              />
              <span className="text-[var(--color-foreground)]">{d.name}</span>
            </span>
            <span className="font-mono text-xs text-[var(--color-muted-foreground)]">
              {d.n} · {d.pct}%
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

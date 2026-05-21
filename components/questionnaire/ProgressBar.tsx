"use client";

import { motion } from "framer-motion";

const DIMENSION_COLOR: Record<string, string> = {
  Social: "var(--color-cyan-deep)",
  Económica: "var(--color-mango-sun)",
  Ambiental: "var(--color-mint-success)",
  Institucional: "var(--color-coral-pulse)",
};

export function ProgressBar({
  current,
  total,
  dimension,
}: {
  current: number;
  total: number;
  dimension: string;
}) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const color = DIMENSION_COLOR[dimension] ?? "var(--color-navy-upao)";

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-2xl font-medium text-[var(--color-navy-upao)]">
            {String(current).padStart(2, "0")}
          </span>
          <span className="text-sm text-[var(--color-muted-foreground)]">
            de {String(total).padStart(2, "0")}
          </span>
        </div>
        <span
          className="rounded-full px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.15em]"
          style={{
            backgroundColor: `color-mix(in oklch, ${color} 12%, white)`,
            color,
          }}
        >
          {dimension}
        </span>
      </div>

      <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
        <motion.div
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

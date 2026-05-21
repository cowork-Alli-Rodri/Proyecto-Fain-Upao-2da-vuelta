"use client";

import { Progress } from "@/components/ui/progress";

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
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[var(--color-smoke)]">
        <span>
          Pregunta {current} de {total}
        </span>
        <span aria-label="Dimensión actual">{dimension}</span>
      </div>
      <Progress
        value={pct}
        aria-label={`Avance del cuestionario: ${pct}%`}
        className="h-2"
      />
    </div>
  );
}

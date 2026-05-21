"use client";

import { cn } from "@/lib/utils";

export function RankingInput({
  items,
  order,
  onChange,
  disabled,
}: {
  items: string[];
  order: string[]; // array completo de items en el orden elegido (1 = mayor prioridad)
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const effective = order.length === items.length ? order : items;

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= effective.length) return;
    const next = [...effective];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  }

  return (
    <ol className="space-y-2" aria-label="Ordena las opciones de mayor a menor prioridad">
      {effective.map((item, i) => (
        <li
          key={item}
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius-card)] border bg-white p-3 text-sm transition",
            "border-[color-mix(in_oklch,var(--color-smoke)_20%,transparent)]",
          )}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy-upao)] font-mono text-sm font-bold text-white"
            aria-label={`Prioridad ${i + 1}`}
          >
            {i + 1}
          </span>
          <span className="flex-1 leading-relaxed text-[var(--color-ink)]">{item}</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={disabled || i === 0}
              aria-label="Subir prioridad"
              className="rounded-md border border-[color-mix(in_oklch,var(--color-smoke)_25%,transparent)] px-2 py-1 text-xs disabled:opacity-30 hover:border-[var(--color-cyan-electric)]"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={disabled || i === effective.length - 1}
              aria-label="Bajar prioridad"
              className="rounded-md border border-[color-mix(in_oklch,var(--color-smoke)_25%,transparent)] px-2 py-1 text-xs disabled:opacity-30 hover:border-[var(--color-cyan-electric)]"
            >
              ↓
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}

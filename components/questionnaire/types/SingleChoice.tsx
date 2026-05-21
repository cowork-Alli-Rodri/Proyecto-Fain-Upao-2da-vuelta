"use client";

import { cn } from "@/lib/utils";

interface Choice {
  id: string;
  label: string;
}

export function SingleChoice({
  choices,
  value,
  onChange,
  disabled,
}: {
  choices: Choice[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="sr-only">Selecciona una opción</legend>
      {choices.map((c) => {
        const selected = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(c.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-[var(--radius-card)] border bg-white p-4 text-left transition",
              "hover:border-[var(--color-cyan-electric)]",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--color-cyan-electric)]",
              selected
                ? "border-[var(--color-navy-upao)] bg-[color-mix(in_oklch,var(--color-navy-upao)_4%,white)] shadow-[var(--shadow-fluffy)]"
                : "border-[color-mix(in_oklch,var(--color-smoke)_20%,transparent)]",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-bold",
                selected
                  ? "border-[var(--color-navy-upao)] bg-[var(--color-navy-upao)] text-white"
                  : "border-[color-mix(in_oklch,var(--color-smoke)_40%,transparent)] text-[var(--color-smoke)]",
              )}
              aria-hidden
            >
              {c.id}
            </span>
            <span className="text-sm leading-relaxed text-[var(--color-ink)]">{c.label}</span>
          </button>
        );
      })}
    </fieldset>
  );
}

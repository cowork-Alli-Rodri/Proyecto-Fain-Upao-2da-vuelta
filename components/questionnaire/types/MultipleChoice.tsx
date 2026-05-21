"use client";

import { cn } from "@/lib/utils";

interface Choice {
  id: string;
  label: string;
}

export function MultipleChoice({
  choices,
  values,
  onChange,
  disabled,
}: {
  choices: Choice[];
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  function toggle(id: string) {
    if (values.includes(id)) {
      onChange(values.filter((v) => v !== id));
    } else {
      onChange([...values, id]);
    }
  }

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-xs text-[var(--color-smoke)]">
        Puedes seleccionar más de una opción.
      </legend>
      {choices.map((c) => {
        const selected = values.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(c.id)}
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
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-xs font-bold",
                selected
                  ? "border-2 border-[var(--color-navy-upao)] bg-[var(--color-navy-upao)] text-white"
                  : "border-2 border-[color-mix(in_oklch,var(--color-smoke)_40%,transparent)]",
              )}
              aria-hidden
            >
              {selected ? "✓" : c.id}
            </span>
            <span className="text-sm leading-relaxed text-[var(--color-ink)]">{c.label}</span>
          </button>
        );
      })}
    </fieldset>
  );
}

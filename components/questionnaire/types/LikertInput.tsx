"use client";

import { cn } from "@/lib/utils";

interface LikertScaleItem {
  value: number;
  label: string;
}

export function LikertInput({
  scale,
  value,
  onChange,
  disabled,
}: {
  scale: LikertScaleItem[];
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="sr-only">Escala</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        {scale.map((item) => {
          const selected = value === item.value;
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(item.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-[var(--radius-card)] border bg-white p-4 text-left transition",
                "hover:border-[var(--color-cyan-electric)] hover:shadow-[var(--shadow-neon)]",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--color-cyan-electric)]",
                selected
                  ? "border-[var(--color-navy-upao)] bg-[color-mix(in_oklch,var(--color-navy-upao)_5%,white)] shadow-[var(--shadow-fluffy)]"
                  : "border-[color-mix(in_oklch,var(--color-smoke)_20%,transparent)]",
              )}
            >
              <span className="font-mono text-2xl font-bold text-[var(--color-navy-upao)]">
                {item.value}
              </span>
              <span className="text-xs leading-tight text-[var(--color-smoke)]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

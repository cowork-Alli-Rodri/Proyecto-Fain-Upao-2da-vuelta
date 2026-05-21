"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export function ComparisonInput({
  keiko,
  roberto,
  onChange,
  disabled,
}: {
  keiko: number | null;
  roberto: number | null;
  onChange: (next: { keiko: number; roberto: number }) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-[var(--radius-card)] border bg-white p-4">
        <Label className="text-sm">Keiko Fujimori (Fuerza Popular)</Label>
        <Slider
          value={[keiko ?? 3]}
          min={1}
          max={5}
          step={1}
          disabled={disabled}
          onValueChange={(v) =>
            onChange({ keiko: v[0] ?? 3, roberto: roberto ?? 3 })
          }
        />
        <p className="font-mono text-xs text-[var(--color-smoke)]">Nivel: {keiko ?? "—"} / 5</p>
      </div>
      <div className="space-y-2 rounded-[var(--radius-card)] border bg-white p-4">
        <Label className="text-sm">Roberto Sánchez (Juntos por el Perú)</Label>
        <Slider
          value={[roberto ?? 3]}
          min={1}
          max={5}
          step={1}
          disabled={disabled}
          onValueChange={(v) =>
            onChange({ keiko: keiko ?? 3, roberto: v[0] ?? 3 })
          }
        />
        <p className="font-mono text-xs text-[var(--color-smoke)]">Nivel: {roberto ?? "—"} / 5</p>
      </div>
    </div>
  );
}

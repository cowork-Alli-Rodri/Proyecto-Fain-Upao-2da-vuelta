"use client";

import { Textarea } from "@/components/ui/textarea";

export function TextInput({
  value,
  onChange,
  disabled,
  maxLength = 1000,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        rows={6}
        className="w-full"
        placeholder="Escribe tu respuesta..."
      />
      <p className="text-right text-xs text-[var(--color-smoke)]">
        {value.length} / {maxLength}
      </p>
    </div>
  );
}

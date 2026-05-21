"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setCicloCierre } from "@/app/(admin)/admin/jne/_actions";
import { ERROR_MESSAGES } from "@/lib/errors";

/**
 * Configura `app_settings.ciclo_cierre_at`. El cron mensual de
 * anonimización usa este timestamp para detonar 12 meses después.
 *
 * El admin ingresa fecha y hora locales (Lima) en formato `datetime-local`;
 * se serializa a ISO 8601 UTC antes de mandar a la server action.
 */
export function CicloCierreForm({ initial }: { initial: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState<string>(toDateTimeLocal(initial));
  const [message, setMessage] = useState<
    | { kind: "success"; text: string }
    | { kind: "error"; text: string }
    | null
  >(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const iso = value ? new Date(value).toISOString() : null;
      const result = await setCicloCierre({ cierreAt: iso });
      if (!result.ok) {
        setMessage({
          kind: "error",
          text:
            result.error.code === "ValidationError"
              ? result.error.message
              : ERROR_MESSAGES[result.error.code],
        });
        return;
      }
      setMessage({
        kind: "success",
        text: iso
          ? "Fecha de cierre guardada. El cron de anonimización se activará 12 meses después."
          : "Cierre desactivado.",
      });
      router.refresh();
    });
  }

  function handleClear() {
    setValue("");
    setMessage(null);
    startTransition(async () => {
      const result = await setCicloCierre({ cierreAt: null });
      if (!result.ok) {
        setMessage({
          kind: "error",
          text:
            result.error.code === "ValidationError"
              ? result.error.message
              : ERROR_MESSAGES[result.error.code],
        });
        return;
      }
      setMessage({ kind: "success", text: "Cierre desactivado." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="cierreAt">Fecha y hora de cierre del ciclo</Label>
          <Input
            id="cierreAt"
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-graphite)]">
            Zona horaria local (Lima). Se guarda como UTC.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={handleSave} disabled={pending || value === ""}>
            {pending ? "Guardando..." : "Guardar"}
          </Button>
          {initial ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={pending}
            >
              Limpiar
            </Button>
          ) : null}
        </div>
      </div>

      {message ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            message.kind === "success"
              ? "border-[var(--color-mint-success)]/40 bg-[var(--color-mint-success)]/10 text-[var(--color-mint-success)]"
              : "border-[var(--color-coral-pulse)]/40 bg-[var(--color-coral-pulse)]/10 text-[var(--color-coral-pulse)]"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    // datetime-local espera formato YYYY-MM-DDTHH:mm en hora local del navegador.
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

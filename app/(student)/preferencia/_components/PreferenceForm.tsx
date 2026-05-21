"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ERROR_MESSAGES } from "@/lib/errors";
import { submitPreference } from "../_actions";

type Candidato = "keiko" | "roberto" | "indeciso";

const OPTIONS: { id: Candidato; label: string; sub: string; color: string }[] = [
  {
    id: "keiko",
    label: "Keiko Fujimori",
    sub: "Fuerza Popular",
    color: "var(--color-candidate-keiko)",
  },
  {
    id: "roberto",
    label: "Roberto Sánchez",
    sub: "Juntos por el Perú",
    color: "var(--color-candidate-roberto)",
  },
  {
    id: "indeciso",
    label: "Indeciso/a",
    sub: "Aún no tengo una preferencia clara",
    color: "var(--color-smoke)",
  },
];

export function PreferenceForm() {
  const [candidato, setCandidato] = useState<Candidato | null>(null);
  const [confianza, setConfianza] = useState<number>(5);
  const [motivo, setMotivo] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!candidato) {
      setError("Selecciona una opción.");
      return;
    }
    startTransition(async () => {
      const result = await submitPreference({
        candidatoPreferido: candidato,
        confianza,
        motivo: motivo.trim(),
      });
      if (!result.ok) {
        setError(
          result.error.code === "ValidationError"
            ? result.error.message
            : ERROR_MESSAGES[result.error.code],
        );
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-[var(--radius-card)] border border-[color-mix(in_oklch,var(--color-navy-upao)_15%,transparent)] bg-white p-6 shadow-sm"
    >
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--color-ink)]">
          ¿Cuál es tu preferencia tras explorar los planes?
        </legend>
        {OPTIONS.map((o) => {
          const selected = candidato === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setCandidato(o.id)}
              disabled={pending}
              className={cn(
                "flex w-full items-center gap-4 rounded-[var(--radius-card)] border-2 bg-white p-4 text-left transition",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--color-cyan-electric)]",
              )}
              style={
                selected
                  ? {
                      borderColor: o.color,
                      backgroundColor: `color-mix(in oklch, ${o.color} 6%, white)`,
                    }
                  : { borderColor: "color-mix(in oklch, var(--color-smoke) 20%, transparent)" }
              }
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-mono text-base font-bold text-white"
                style={{ backgroundColor: o.color }}
                aria-hidden
              >
                {o.label
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")}
              </span>
              <div className="flex-1 space-y-0.5">
                <p className="font-medium text-[var(--color-ink)]">{o.label}</p>
                <p className="text-xs text-[var(--color-smoke)]">{o.sub}</p>
              </div>
            </button>
          );
        })}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="confianza" className="text-sm font-medium">
          Nivel de confianza en tu decisión: <span className="font-mono">{confianza} / 10</span>
        </Label>
        <Slider
          id="confianza"
          min={1}
          max={10}
          step={1}
          value={[confianza]}
          onValueChange={(v) => setConfianza(v[0] ?? 5)}
          disabled={pending}
        />
        <div className="flex justify-between text-xs text-[var(--color-smoke)]">
          <span>1 — Poco seguro</span>
          <span>10 — Totalmente seguro</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="motivo" className="text-sm font-medium">
          Motivo (opcional)
        </Label>
        <Textarea
          id="motivo"
          rows={4}
          maxLength={500}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="¿Por qué? Tu respuesta ayuda al docente a analizar tendencias."
          disabled={pending}
        />
        <p className="text-right text-xs text-[var(--color-smoke)]">
          {motivo.length} / 500
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-coral-pulse)]">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || !candidato}
        className="w-full bg-[var(--color-navy-upao)] text-white hover:bg-[var(--color-navy-deep)]"
      >
        {pending ? "Enviando..." : "Enviar mi preferencia"}
      </Button>

      <p className="text-center text-xs text-[var(--color-smoke)]">
        Esta declaración es final. Después de enviar no podrás modificarla.
      </p>
    </form>
  );
}

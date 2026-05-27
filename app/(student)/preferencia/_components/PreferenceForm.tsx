"use client";

import { useState, useTransition } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ERROR_MESSAGES } from "@/lib/errors";
import { submitPreference } from "../_actions";

type Candidato = "keiko" | "roberto" | "indeciso";

interface Option {
  id: Candidato;
  label: string;
  sub: string;
  color: string;
  photo: string | null;
  logo: { src: string; isSvg: boolean } | null;
}

const OPTIONS: Option[] = [
  {
    id: "keiko",
    label: "Keiko Fujimori",
    sub: "Fuerza Popular",
    color: "var(--color-candidate-keiko)",
    photo: "/candidates/keiko-fujimori.webp",
    logo: { src: "/parties/fuerza-popular.webp", isSvg: false },
  },
  {
    id: "roberto",
    label: "Roberto Sánchez",
    sub: "Juntos por el Perú",
    color: "var(--color-candidate-roberto)",
    photo: "/candidates/roberto-sanchez.webp",
    logo: { src: "/parties/juntos-por-el-peru.svg", isSvg: true },
  },
  {
    id: "indeciso",
    label: "Indeciso/a",
    sub: "Aún no tengo una decisión clara",
    color: "var(--color-smoke)",
    photo: null,
    logo: null,
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
          ¿Cuál es tu decisión tras analizar los planes?
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
              {o.photo ? (
                <span
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${o.color} 18%, white)`,
                  }}
                  aria-hidden
                >
                  <Image
                    src={o.photo}
                    alt=""
                    fill
                    sizes="48px"
                    className="scale-[1.35] object-cover object-[50%_28%]"
                    unoptimized
                  />
                </span>
              ) : (
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-mono text-base font-bold text-white"
                  style={{ backgroundColor: o.color }}
                  aria-hidden
                >
                  ?
                </span>
              )}
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-medium text-[var(--color-ink)]">{o.label}</p>
                <div className="flex items-center gap-1.5">
                  {o.logo ? (
                    <span className="relative inline-block h-3.5 w-3.5 shrink-0">
                      {o.logo.isSvg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={o.logo.src}
                          alt=""
                          aria-hidden
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Image
                          src={o.logo.src}
                          alt=""
                          aria-hidden
                          fill
                          sizes="14px"
                          className="object-contain"
                          unoptimized
                        />
                      )}
                    </span>
                  ) : null}
                  <p className="truncate text-xs text-[var(--color-smoke)]">{o.sub}</p>
                </div>
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
        {pending ? "Enviando..." : "Decide bien · Enviar"}
      </Button>

      <p className="text-center text-xs text-[var(--color-smoke)]">
        Esta declaración es final. Después de enviar no podrás modificarla.
      </p>
    </form>
  );
}

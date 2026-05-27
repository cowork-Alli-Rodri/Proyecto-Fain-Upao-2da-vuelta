"use client";

import { useState, useTransition } from "react";

import { ERROR_MESSAGES } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { submitPostSurvey } from "../_actions";

type OpinionChange = "si_mucho" | "si_un_poco" | "no";
type DimensionTop = "social" | "economica" | "ambiental" | "institucional" | "ninguna";

const OPINION_OPTIONS: { id: OpinionChange; label: string; description: string }[] = [
  {
    id: "si_mucho",
    label: "Sí, mucho",
    description: "El análisis cambió bastante mi perspectiva.",
  },
  {
    id: "si_un_poco",
    label: "Sí, un poco",
    description: "Aclaré algunos puntos pero mi posición general se mantiene.",
  },
  {
    id: "no",
    label: "No",
    description: "Mi opinión sigue siendo la misma que antes de leer los planes.",
  },
];

const DIMENSION_OPTIONS: { id: DimensionTop; label: string }[] = [
  { id: "social", label: "Social" },
  { id: "economica", label: "Económica" },
  { id: "ambiental", label: "Ambiental" },
  { id: "institucional", label: "Institucional" },
  { id: "ninguna", label: "Ninguna en particular" },
];

export function PostSurveyForm() {
  const [opinion, setOpinion] = useState<OpinionChange | null>(null);
  const [dimension, setDimension] = useState<DimensionTop | null>(null);
  const [utility, setUtility] = useState<number>(7);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!opinion) return setError("Indica si tu opinión cambió.");
    if (!dimension) return setError("Selecciona la dimensión que más te impactó.");
    if (recommend === null) return setError("Indica si recomendarías la herramienta.");

    startTransition(async () => {
      const result = await submitPostSurvey({
        opinionChanged: opinion,
        dimensionTop: dimension,
        utilityRating: utility,
        wouldRecommend: recommend,
        comentario: comentario.trim(),
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* P1: ¿Cambió tu opinión? */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--color-ink)]">
          1 · Después de analizar los planes oficiales, ¿cambió tu opinión sobre las
          candidaturas?
        </legend>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {OPINION_OPTIONS.map((o) => {
            const selected = opinion === o.id;
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setOpinion(o.id)}
                disabled={pending}
                className={cn(
                  "flex h-full flex-col gap-1 rounded-xl border-2 p-4 text-left transition",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--color-cyan-electric)]",
                  selected
                    ? "border-[var(--color-cyan-deep)] bg-[var(--color-cyan-electric)]/5"
                    : "border-[var(--color-border)] bg-white hover:border-[var(--color-border-strong)]",
                )}
              >
                <span className="text-sm font-medium text-[var(--color-foreground)]">
                  {o.label}
                </span>
                <span className="text-xs leading-relaxed text-[var(--color-graphite)]">
                  {o.description}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* P2: Dimensión que más impactó */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--color-ink)]">
          2 · ¿Cuál de las cuatro dimensiones fue la que más te ayudó a decidir?
        </legend>
        <div className="flex flex-wrap gap-2">
          {DIMENSION_OPTIONS.map((d) => {
            const selected = dimension === d.id;
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setDimension(d.id)}
                disabled={pending}
                className={cn(
                  "rounded-full border-2 px-4 py-2 text-sm transition",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--color-cyan-electric)]",
                  selected
                    ? "border-[var(--color-navy-upao)] bg-[var(--color-navy-upao)] text-white"
                    : "border-[var(--color-border)] bg-white text-[var(--color-foreground)] hover:border-[var(--color-border-strong)]",
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* P3: Utilidad 1-10 */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--color-ink)]">
          3 · ¿Qué tan útil te fue la herramienta para tomar tu decisión?
        </legend>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={10}
            value={utility}
            onChange={(e) => setUtility(Number(e.target.value))}
            disabled={pending}
            className="flex-1"
            aria-label="Nivel de utilidad de 1 a 10"
          />
          <span className="w-12 font-mono text-2xl font-medium text-[var(--color-cyan-deep)]">
            {utility}
          </span>
        </div>
        <div className="flex justify-between text-xs text-[var(--color-graphite)]">
          <span>1 · Nada útil</span>
          <span>10 · Muy útil</span>
        </div>
      </fieldset>

      {/* P4: ¿Recomendarías? */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--color-ink)]">
          4 · ¿Recomendarías esta herramienta a otros estudiantes que voten por primera
          vez?
        </legend>
        <div className="flex gap-2.5">
          {[
            { id: true, label: "Sí" },
            { id: false, label: "No" },
          ].map((b) => {
            const selected = recommend === b.id;
            return (
              <button
                key={String(b.id)}
                type="button"
                aria-pressed={selected}
                onClick={() => setRecommend(b.id)}
                disabled={pending}
                className={cn(
                  "min-w-[80px] rounded-xl border-2 px-5 py-2.5 text-sm font-medium transition",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--color-cyan-electric)]",
                  selected
                    ? "border-[var(--color-orange-upao)] bg-[var(--color-orange-upao)]/10 text-[var(--color-orange-upao)]"
                    : "border-[var(--color-border)] bg-white text-[var(--color-foreground)] hover:border-[var(--color-border-strong)]",
                )}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Comentario opcional */}
      <div className="space-y-2">
        <label
          htmlFor="comentario"
          className="text-sm font-medium text-[var(--color-ink)]"
        >
          Comentario opcional (¿qué mejorarías?)
        </label>
        <textarea
          id="comentario"
          rows={3}
          maxLength={500}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          disabled={pending}
          className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm focus-visible:border-[var(--color-cyan-deep)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--color-cyan-electric)]"
          placeholder="Lo que te gustaría que mejoremos para futuras versiones."
        />
        <p className="text-right text-xs text-[var(--color-muted-foreground)]">
          {comentario.length} / 500
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-[var(--color-coral-pulse)]/40 bg-[var(--color-coral-pulse)]/5 px-4 py-3 text-sm text-[var(--color-coral-pulse)]"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-navy-upao)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Continuar a decidir"}
        <span
          aria-hidden
          className="inline-block transition-transform group-hover:translate-x-1"
        >
          →
        </span>
      </button>
    </form>
  );
}

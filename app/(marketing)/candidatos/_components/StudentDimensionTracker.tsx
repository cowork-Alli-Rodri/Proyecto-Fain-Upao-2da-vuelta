"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { markDimensionViewed } from "../_actions";

type DimensionJne = "social" | "economica" | "ambiental" | "institucional";

interface DimensionMeta {
  id: DimensionJne;
  label: string;
  description: string;
}

const DIMENSIONS: DimensionMeta[] = [
  {
    id: "social",
    label: "Social",
    description: "Educación, salud, vivienda, inclusión, programas sociales",
  },
  {
    id: "economica",
    label: "Económica",
    description: "Empleo, formalización, inversión, política fiscal y monetaria",
  },
  {
    id: "ambiental",
    label: "Ambiental",
    description: "Gestión de recursos, contaminación, cambio climático",
  },
  {
    id: "institucional",
    label: "Institucional",
    description: "Justicia, anticorrupción, organismos de control, descentralización",
  },
];

export function StudentDimensionTracker({
  initialViewed,
  initialCompleted,
}: {
  initialViewed: DimensionJne[];
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const [viewed, setViewed] = useState<Set<DimensionJne>>(new Set(initialViewed));
  const [completed, setCompleted] = useState(initialCompleted);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleMark(dim: DimensionJne) {
    if (viewed.has(dim)) return;
    setError(null);
    startTransition(async () => {
      const result = await markDimensionViewed(dim);
      if (!result.ok) {
        setError(
          result.error.code === "ValidationError" ? result.error.message : "No pudimos guardar tu progreso.",
        );
        return;
      }
      setViewed((prev) => new Set([...prev, dim]));
      if (result.value.completed) setCompleted(true);
    });
  }

  const remaining = DIMENSIONS.length - viewed.size;

  return (
    <section
      aria-label="Revisión obligatoria de dimensiones"
      className="border-t border-[var(--color-border)] bg-[var(--color-bone)] py-10 sm:py-14"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="space-y-3">
          <p className="editorial-kicker">Revisión guiada</p>
          <h2 className="font-display text-2xl text-[var(--color-navy-upao)] sm:text-3xl">
            Revisa las {DIMENSIONS.length} dimensiones del plan de ambos candidatos
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-graphite)]">
            Antes de responder el segundo bloque, asegúrate de haber leído las propuestas oficiales del JNE en cada
            dimensión. Marca cada una como revisada cuando termines.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {DIMENSIONS.map((d) => {
            const seen = viewed.has(d.id);
            return (
              <div
                key={d.id}
                className={`flex flex-col gap-3 rounded-2xl border-2 p-5 transition ${
                  seen
                    ? "border-[var(--color-mint-success)] bg-[color-mix(in_oklch,var(--color-mint-success)_8%,white)]"
                    : "border-[var(--color-border-strong)] bg-white hover:border-[var(--color-navy-upao)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg text-[var(--color-navy-upao)]">{d.label}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--color-graphite)]">{d.description}</p>
                  </div>
                  {seen ? (
                    <span
                      aria-label="Revisada"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-mint-success)] text-xs font-bold text-white"
                    >
                      ✓
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={seen || pending}
                  onClick={() => handleMark(d.id)}
                  className="mt-2 inline-flex items-center justify-center rounded-lg border border-[var(--color-navy-upao)] px-4 py-2 text-xs font-medium text-[var(--color-navy-upao)] transition hover:bg-[var(--color-navy-upao)] hover:text-white disabled:cursor-default disabled:opacity-60"
                >
                  {seen ? "Revisada" : "Marcar como revisada"}
                </button>
              </div>
            );
          })}
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-sm text-[var(--color-coral-pulse)]">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-graphite)]">
            {completed
              ? "Listo: revisaste las 4 dimensiones"
              : `Te faltan ${remaining} de ${DIMENSIONS.length} dimensiones`}
          </p>
          <button
            type="button"
            disabled={!completed || pending}
            onClick={() => router.push("/cuestionario-post")}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-navy-upao)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continuar al cuestionario final →
          </button>
        </div>
      </div>
    </section>
  );
}

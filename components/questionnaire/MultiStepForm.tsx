"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { ProgressBar } from "./ProgressBar";
import {
  QuestionRenderer,
  type AnswerValue,
  type QuestionRecord,
  isAnswerComplete,
  answerPayload,
} from "./QuestionRenderer";
import {
  saveAnswer,
  submitPreQuestionnaire,
  submitPostQuestionnaire,
} from "@/app/(student)/cuestionario/_actions";
import { ERROR_MESSAGES } from "@/lib/errors";
import { captureEvent } from "@/lib/analytics/posthog";
import { useTrackOnce } from "@/lib/analytics/useTrack";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

const DIMENSION_LABEL: Record<QuestionRecord["dimension_tematica"], string> = {
  social: "Social",
  economica: "Económica",
  ambiental: "Ambiental",
  institucional: "Institucional",
};

export function MultiStepForm({
  questions,
  initialAnswers,
  initialStep,
  momento,
  intro,
}: {
  questions: QuestionRecord[];
  initialAnswers: Record<string, AnswerValue>;
  initialStep: number;
  momento: "pre" | "post";
  intro?: string;
}) {
  const router = useRouter();
  const routeBase = `/cuestionario-${momento}`;
  const [stepIndex, setStepIndex] = useState(
    Math.max(0, Math.min(initialStep - 1, questions.length - 1)),
  );
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initialAnswers);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, startSubmitting] = useTransition();
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  // `dirty` marca que la respuesta actual cambió desde la última vez que
  // se persistió. Evita duplicar el saveAnswer al hacer click en Siguiente
  // cuando el autosave ya guardó. Es un ref para no re-renderizar.
  const dirty = useRef<Record<string, boolean>>({});
  // Guard contra dobles clicks / clicks durante navegación.
  const navigating = useRef(false);

  const current = questions[stepIndex];
  const total = questions.length;
  const currentAnswer = current ? answers[current.id] ?? null : null;
  const canAdvance = current ? isAnswerComplete(current, currentAnswer) : false;

  // Trackeo de inicio del cuestionario (una sola vez por sesión del componente).
  useTrackOnce(ANALYTICS_EVENTS.QUESTIONNAIRE_STARTED, { total_questions: total });

  // Autosave debounced 700ms — solo si la respuesta cambió desde la última save.
  useEffect(() => {
    if (!current || !currentAnswer || !isAnswerComplete(current, currentAnswer)) return;
    if (!dirty.current[current.id]) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    const questionId = current.id;
    const valor = answerPayload(current, currentAnswer);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      const result = await saveAnswer({ questionId, valor, momento });
      setSaving(false);
      if (result.ok) {
        dirty.current[questionId] = false;
        setError(null);
      } else {
        setError(
          result.error.code === "ValidationError"
            ? result.error.message
            : ERROR_MESSAGES[result.error.code],
        );
      }
    }, 700);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAnswer]);

  async function goNext() {
    if (!current || !canAdvance || navigating.current) return;
    navigating.current = true;

    // Cancela el timer del autosave para evitar guardado duplicado.
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    try {
      // Solo guarda si la respuesta actual está sin persistir.
      if (dirty.current[current.id]) {
        setSaving(true);
        const result = await saveAnswer({
          questionId: current.id,
          valor: answerPayload(current, currentAnswer!),
          momento,
        });
        setSaving(false);
        if (!result.ok) {
          setError(
            result.error.code === "ValidationError"
              ? result.error.message
              : ERROR_MESSAGES[result.error.code],
          );
          return;
        }
        dirty.current[current.id] = false;
      }

      setError(null);
      if (stepIndex < total - 1) {
        captureEvent(ANALYTICS_EVENTS.QUESTIONNAIRE_STEP_ADVANCED, {
          from_step: stepIndex + 1,
          to_step: stepIndex + 2,
          dimension: current.dimension_tematica,
        });
        setStepIndex(stepIndex + 1);
        router.replace(`${routeBase}/${stepIndex + 2}`);
      }
    } finally {
      navigating.current = false;
    }
  }

  function goPrev() {
    if (stepIndex === 0 || navigating.current) return;
    setStepIndex(stepIndex - 1);
    router.replace(`${routeBase}/${stepIndex}`);
  }

  function handleAnswerChange(next: AnswerValue) {
    if (!current) return;
    dirty.current[current.id] = true;
    setAnswers((prev) => ({ ...prev, [current.id]: next }));
  }

  function handleSubmit() {
    setError(null);
    startSubmitting(async () => {
      try {
        captureEvent(ANALYTICS_EVENTS.QUESTIONNAIRE_COMPLETED, {
          total_questions: total,
          momento,
        });
        if (momento === "pre") {
          await submitPreQuestionnaire();
        } else {
          await submitPostQuestionnaire();
        }
      } catch (e) {
        const errResult = e as { error?: { code?: string } };
        if (errResult?.error?.code === "MissingAnswers") {
          setError("Aún te faltan responder algunas preguntas.");
        } else {
          setError(ERROR_MESSAGES.Unexpected);
        }
      }
    });
  }

  const dimensionLabel = useMemo(
    () => (current ? DIMENSION_LABEL[current.dimension_tematica] : ""),
    [current],
  );

  if (!current) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-[var(--color-muted-foreground)]">
          No hay preguntas disponibles. Avisa al docente.
        </p>
      </div>
    );
  }

  const isLast = stepIndex === total - 1;
  const allAnswered = questions.every((q) => isAnswerComplete(q, answers[q.id] ?? null));

  return (
    <div className="space-y-10">
      {intro && stepIndex === 0 ? (
        <p className="rounded-2xl border-l-2 border-[var(--color-cyan-deep)] bg-[var(--color-surface-2)] px-5 py-4 text-sm leading-relaxed text-[var(--color-graphite)]">
          {intro}
        </p>
      ) : null}

      <ProgressBar current={stepIndex + 1} total={total} dimension={dimensionLabel} />

      <AnimatePresence mode="wait">
        <motion.article
          key={current.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          <header className="space-y-4">
            <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium leading-[1.15] tracking-tight text-[var(--color-navy-upao)]">
              {current.enunciado}
            </h2>
            {current.fuente ? (
              <p className="border-l-2 border-[var(--color-border-strong)] pl-4 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                <span className="font-mono uppercase tracking-wider">Fuente</span>
                <span className="mx-2">·</span>
                {current.fuente}
              </p>
            ) : null}
          </header>

          <QuestionRenderer
            question={current}
            answer={currentAnswer}
            onChange={handleAnswerChange}
            disabled={submitting}
          />

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-[var(--color-coral-pulse)]/40 bg-[var(--color-coral-pulse)]/5 px-4 py-3 text-sm text-[var(--color-coral-pulse)]"
            >
              {error}
            </p>
          ) : null}
        </motion.article>
      </AnimatePresence>

      {/* Footer navegación sticky */}
      <div className="sticky bottom-0 -mx-6 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={stepIndex === 0 || submitting}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-graphite)] transition hover:text-[var(--color-navy-upao)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span aria-hidden>←</span> Anterior
          </button>

          <p
            aria-live="polite"
            className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]"
          >
            {saving ? "Guardando…" : "Auto-guardado"}
          </p>

          {isLast ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-navy-upao)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Enviando…" : "Enviar cuestionario"}
              <span
                aria-hidden
                className="inline-block transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={!canAdvance || submitting}
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-navy-upao)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Guardando…" : "Siguiente"}
              <span
                aria-hidden
                className="inline-block transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

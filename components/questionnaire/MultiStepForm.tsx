"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ProgressBar } from "./ProgressBar";
import {
  QuestionRenderer,
  type AnswerValue,
  type QuestionRecord,
  isAnswerComplete,
  answerPayload,
} from "./QuestionRenderer";
import { saveAnswer, submitQuestionnaire } from "@/app/(student)/cuestionario/_actions";
import { ERROR_MESSAGES } from "@/lib/errors";

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
}: {
  questions: QuestionRecord[];
  initialAnswers: Record<string, AnswerValue>;
  initialStep: number;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(Math.max(0, Math.min(initialStep - 1, questions.length - 1)));
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initialAnswers);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [submitting, startSubmitting] = useTransition();
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const current = questions[stepIndex];
  const total = questions.length;
  const currentAnswer = current ? answers[current.id] ?? null : null;
  const canAdvance = current ? isAnswerComplete(current, currentAnswer) : false;

  // Autosave debounced 700ms
  useEffect(() => {
    if (!current || !currentAnswer || !isAnswerComplete(current, currentAnswer)) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startSaving(async () => {
        const result = await saveAnswer({
          questionId: current.id,
          valor: answerPayload(current, currentAnswer),
        });
        if (!result.ok) {
          setError(
            result.error.code === "ValidationError"
              ? result.error.message
              : ERROR_MESSAGES[result.error.code],
          );
        } else {
          setError(null);
        }
      });
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAnswer]);

  function goNext() {
    if (!current || !canAdvance) return;
    // Flush autosave inmediato antes de avanzar
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    startSaving(async () => {
      const result = await saveAnswer({
        questionId: current.id,
        valor: answerPayload(current, currentAnswer!),
      });
      if (!result.ok) {
        setError(
          result.error.code === "ValidationError"
            ? result.error.message
            : ERROR_MESSAGES[result.error.code],
        );
        return;
      }
      setError(null);
      if (stepIndex < total - 1) {
        setStepIndex(stepIndex + 1);
        router.replace(`/cuestionario/${stepIndex + 2}`);
      }
    });
  }

  function goPrev() {
    if (stepIndex === 0) return;
    setStepIndex(stepIndex - 1);
    router.replace(`/cuestionario/${stepIndex}`);
  }

  function handleSubmit() {
    setError(null);
    startSubmitting(async () => {
      try {
        await submitQuestionnaire();
        // submitQuestionnaire hace redirect, no debería volver
      } catch (e) {
        const errResult = e as { error?: { code?: string; questionIds?: string[] } };
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
        <p>No hay preguntas disponibles. Avisa al docente.</p>
      </div>
    );
  }

  const isLast = stepIndex === total - 1;
  const allAnswered = questions.every((q) => isAnswerComplete(q, answers[q.id] ?? null));

  return (
    <div className="space-y-8">
      <ProgressBar current={stepIndex + 1} total={total} dimension={dimensionLabel} />

      <article className="space-y-6">
        <header className="space-y-2">
          <h2 className="font-display text-2xl leading-tight text-[var(--color-navy-upao)]">
            {current.enunciado}
          </h2>
          {current.fuente ? (
            <p className="text-xs text-[var(--color-smoke)]">
              <span className="font-medium">Fuente:</span> {current.fuente}
            </p>
          ) : null}
        </header>

        <QuestionRenderer
          question={current}
          answer={currentAnswer}
          onChange={(next) =>
            setAnswers((prev) => ({ ...prev, [current.id]: next }))
          }
          disabled={saving || submitting}
        />

        {error ? (
          <p role="alert" className="text-sm text-[var(--color-coral-pulse)]">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={goPrev}
            disabled={stepIndex === 0 || saving || submitting}
          >
            Anterior
          </Button>

          <div className="flex items-center gap-2 text-xs text-[var(--color-smoke)]">
            {saving ? <span>Guardando...</span> : <span>Auto-guardado activo</span>}
          </div>

          {isLast ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered || saving || submitting}
              className="bg-[var(--color-navy-upao)] text-white hover:bg-[var(--color-navy-deep)]"
            >
              {submitting ? "Enviando..." : "Enviar cuestionario"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              disabled={!canAdvance || saving || submitting}
              className="bg-[var(--color-navy-upao)] text-white hover:bg-[var(--color-navy-deep)]"
            >
              Siguiente
            </Button>
          )}
        </div>
      </article>
    </div>
  );
}

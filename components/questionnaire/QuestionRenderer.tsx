"use client";

import { LikertInput } from "./types/LikertInput";
import { SingleChoice } from "./types/SingleChoice";
import { MultipleChoice } from "./types/MultipleChoice";
import { TextInput } from "./types/TextInput";
import { RankingInput } from "./types/RankingInput";
import { ComparisonInput } from "./types/ComparisonInput";

export interface QuestionRecord {
  id: string;
  orden: number;
  enunciado: string;
  dimension_tematica: "social" | "economica" | "ambiental" | "institucional";
  tipo: "likert" | "single" | "multiple" | "text" | "ranking" | "comparison";
  fuente: string | null;
  opciones: unknown | null;
}

export interface AnswerValue {
  value?: number;
  values?: string[];
  text?: string;
  order?: string[];
  keiko?: number;
  roberto?: number;
}

interface Props {
  question: QuestionRecord;
  answer: AnswerValue | null;
  onChange: (next: AnswerValue) => void;
  disabled?: boolean;
}

export function QuestionRenderer({ question, answer, onChange, disabled }: Props) {
  if (question.tipo === "likert") {
    const opts = question.opciones as { scale: { value: number; label: string }[] } | null;
    const scale = opts?.scale ?? [];
    return (
      <LikertInput
        scale={scale}
        value={answer?.value ?? null}
        onChange={(v) => onChange({ value: v })}
        disabled={disabled}
      />
    );
  }

  if (question.tipo === "single") {
    const opts = question.opciones as { choices: { id: string; label: string }[] } | null;
    const choices = opts?.choices ?? [];
    return (
      <SingleChoice
        choices={choices}
        value={(answer as { value?: string } | null)?.value ?? null}
        onChange={(id) => onChange({ value: id as unknown as number })}
        disabled={disabled}
      />
    );
  }

  if (question.tipo === "multiple") {
    const opts = question.opciones as { choices: { id: string; label: string }[] } | null;
    const choices = opts?.choices ?? [];
    return (
      <MultipleChoice
        choices={choices}
        values={answer?.values ?? []}
        onChange={(values) => onChange({ values })}
        disabled={disabled}
      />
    );
  }

  if (question.tipo === "text") {
    return (
      <TextInput
        value={answer?.text ?? ""}
        onChange={(t) => onChange({ text: t })}
        disabled={disabled}
      />
    );
  }

  if (question.tipo === "ranking") {
    const opts = question.opciones as { items: string[] } | null;
    const items = opts?.items ?? [];
    return (
      <RankingInput
        items={items}
        order={answer?.order ?? items}
        onChange={(order) => onChange({ order })}
        disabled={disabled}
      />
    );
  }

  if (question.tipo === "comparison") {
    return (
      <ComparisonInput
        keiko={answer?.keiko ?? null}
        roberto={answer?.roberto ?? null}
        onChange={(v) => onChange(v)}
        disabled={disabled}
      />
    );
  }

  return null;
}

/**
 * ¿La respuesta es válida para avanzar al siguiente paso?
 */
export function isAnswerComplete(question: QuestionRecord, answer: AnswerValue | null): boolean {
  if (!answer) return false;
  switch (question.tipo) {
    case "likert":
      return typeof answer.value === "number" && answer.value >= 1 && answer.value <= 5;
    case "single":
      return typeof (answer as { value?: unknown }).value === "string";
    case "multiple":
      return Array.isArray(answer.values) && answer.values.length >= 1;
    case "text":
      return typeof answer.text === "string" && answer.text.trim().length >= 1;
    case "ranking": {
      const opts = question.opciones as { items: string[] } | null;
      return (
        Array.isArray(answer.order) &&
        answer.order.length === (opts?.items.length ?? 0) &&
        new Set(answer.order).size === answer.order.length
      );
    }
    case "comparison":
      return (
        typeof answer.keiko === "number" &&
        typeof answer.roberto === "number"
      );
    default:
      return false;
  }
}

export function answerPayload(question: QuestionRecord, answer: AnswerValue): unknown {
  switch (question.tipo) {
    case "likert":
      return { value: answer.value };
    case "single":
      return { value: (answer as { value?: unknown }).value };
    case "multiple":
      return { values: answer.values };
    case "text":
      return { text: answer.text };
    case "ranking":
      return { order: answer.order };
    case "comparison":
      return { keiko: answer.keiko, roberto: answer.roberto };
  }
}

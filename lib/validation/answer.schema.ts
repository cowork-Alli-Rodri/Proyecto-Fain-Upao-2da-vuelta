import { z } from "zod";

/**
 * Validación del campo `valor` de una respuesta, en función del `tipo` de pregunta.
 * Estos schemas se usan tanto en el server action `saveAnswer` como en el form
 * cliente que renderiza cada tipo de input.
 */

// Likert 1-5
export const likertValueSchema = z.object({
  value: z.number().int().min(1).max(5),
});

// Single choice — value es el id de la opción (e.g. "A")
export const singleValueSchema = z.object({
  value: z.string().min(1).max(50),
});

// Multiple choice — array de ids no duplicados, al menos 1
export const multipleValueSchema = z.object({
  values: z.array(z.string().min(1).max(50)).min(1).refine(
    (arr) => new Set(arr).size === arr.length,
    "No duplicar opciones.",
  ),
});

// Texto libre — 1-1000 chars
export const textValueSchema = z.object({
  text: z.string().min(1, "Escribe tu respuesta.").max(1000, "Máximo 1000 caracteres."),
});

// Ranking — array completo sin duplicados (validación adicional contra el set
// de opciones se hace en server action al comparar contra questions.opciones)
export const rankingValueSchema = z.object({
  order: z.array(z.string().min(1)).min(2).refine(
    (arr) => new Set(arr).size === arr.length,
    "No duplicar opciones.",
  ),
});

// Comparison — sliders Keiko vs Roberto por dimensión
export const comparisonValueSchema = z.object({
  keiko: z.number().int().min(1).max(5),
  roberto: z.number().int().min(1).max(5),
});

// Discriminated union — el servidor lee questions.tipo y aplica el schema correcto.
export const answerValueByType = {
  likert: likertValueSchema,
  single: singleValueSchema,
  multiple: multipleValueSchema,
  text: textValueSchema,
  ranking: rankingValueSchema,
  comparison: comparisonValueSchema,
} as const;

export type AnswerType = keyof typeof answerValueByType;

export const saveAnswerSchema = z.object({
  questionId: z.string().uuid("ID de pregunta inválido."),
  valor: z.unknown(), // valida dinámicamente según questions.tipo en el server
});

export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;

import { z } from "zod";

/**
 * Validación del banco de preguntas (admin CRUD).
 *
 * El campo `opciones` (jsonb en DB) tiene un shape distinto por tipo de
 * pregunta. Usamos un discriminated union para mantener tipado preciso y
 * validar la combinación (tipo, opciones) en una sola pasada.
 *
 * El CHECK constraint en DB refuerza el invariante crítico:
 *   (tipo = 'text' AND opciones IS NULL)
 *   OR (tipo <> 'text' AND opciones IS NOT NULL)
 */

export const DIMENSION_VALUES = ["social", "economica", "ambiental", "institucional"] as const;
export const QUESTION_TYPE_VALUES = [
  "likert",
  "single",
  "multiple",
  "text",
  "ranking",
  "comparison",
] as const;

export type DimensionTematica = (typeof DIMENSION_VALUES)[number];
export type QuestionType = (typeof QUESTION_TYPE_VALUES)[number];

export const DIMENSION_LABEL: Record<DimensionTematica, string> = {
  social: "Social",
  economica: "Económica",
  ambiental: "Ambiental",
  institucional: "Institucional",
};

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  likert: "Escala Likert (1-5)",
  single: "Opción única",
  multiple: "Opción múltiple",
  text: "Texto libre",
  ranking: "Ranking ordenable",
  comparison: "Comparación Keiko vs Roberto",
};

const scaleItem = z.object({
  value: z.number().int().min(1).max(5),
  label: z.string().min(1, "Etiqueta requerida.").max(120),
});

const choiceItem = z.object({
  id: z
    .string()
    .min(1, "El id es requerido.")
    .max(20, "Máximo 20 caracteres.")
    .regex(/^[A-Za-z0-9_-]+$/u, "Solo letras, números, guion o guion bajo."),
  label: z.string().min(1, "Etiqueta requerida.").max(240),
});

const likertOpcionesSchema = z.object({
  scale: z
    .array(scaleItem)
    .min(2, "Mínimo 2 niveles en la escala.")
    .max(5, "Máximo 5 niveles.")
    .refine(
      (arr) => new Set(arr.map((s) => s.value)).size === arr.length,
      "No repitas valores numéricos en la escala.",
    ),
});

const singleOpcionesSchema = z.object({
  mode: z.literal("single"),
  choices: z
    .array(choiceItem)
    .min(2, "Mínimo 2 opciones.")
    .max(8, "Máximo 8 opciones.")
    .refine(
      (arr) => new Set(arr.map((c) => c.id)).size === arr.length,
      "Los ids de opciones deben ser únicos.",
    ),
});

const multipleOpcionesSchema = z.object({
  mode: z.literal("multiple"),
  choices: z
    .array(choiceItem)
    .min(2, "Mínimo 2 opciones.")
    .max(10, "Máximo 10 opciones.")
    .refine(
      (arr) => new Set(arr.map((c) => c.id)).size === arr.length,
      "Los ids de opciones deben ser únicos.",
    ),
});

const rankingOpcionesSchema = z.object({
  items: z
    .array(z.string().min(1, "Ítem vacío.").max(160))
    .min(2, "Mínimo 2 ítems para rankear.")
    .max(8, "Máximo 8 ítems.")
    .refine(
      (arr) => new Set(arr).size === arr.length,
      "No repitas ítems.",
    ),
});

const comparisonOpcionesSchema = z.object({
  mode: z.literal("comparison"),
  axis_label: z.string().min(1).max(80).optional(),
});

/** Mapa tipo → schema de opciones. Útil para refinar dinámicamente. */
export const OPCIONES_SCHEMA_BY_TYPE = {
  likert: likertOpcionesSchema,
  single: singleOpcionesSchema,
  multiple: multipleOpcionesSchema,
  ranking: rankingOpcionesSchema,
  comparison: comparisonOpcionesSchema,
} as const;

const baseFields = {
  orden: z
    .number({ message: "El orden es obligatorio." })
    .int()
    .min(1, "El orden debe ser mayor o igual a 1.")
    .max(200),
  dimension_tematica: z.enum(DIMENSION_VALUES),
  enunciado: z
    .string()
    .min(8, "Enunciado muy corto.")
    .max(500, "Enunciado máximo 500 caracteres."),
  // `fuente` es opcional. El admin action normaliza vacío → null, así que el
  // schema debe aceptar null/undefined/"" (string vacío) además de texto.
  fuente: z
    .string()
    .max(240, "Fuente máximo 240 caracteres.")
    .nullish(),
  activo: z.boolean().default(true),
};

/**
 * Discriminated union sobre `tipo`. Cada variante exige el shape correcto
 * de `opciones`. Esto evita combinaciones inválidas en una sola validación.
 */
export const questionInputSchema = z.discriminatedUnion("tipo", [
  z.object({ ...baseFields, tipo: z.literal("likert"), opciones: likertOpcionesSchema }),
  z.object({ ...baseFields, tipo: z.literal("single"), opciones: singleOpcionesSchema }),
  z.object({ ...baseFields, tipo: z.literal("multiple"), opciones: multipleOpcionesSchema }),
  z.object({ ...baseFields, tipo: z.literal("ranking"), opciones: rankingOpcionesSchema }),
  z.object({ ...baseFields, tipo: z.literal("comparison"), opciones: comparisonOpcionesSchema }),
  z.object({ ...baseFields, tipo: z.literal("text"), opciones: z.null().default(null) }),
]);

export type QuestionInput = z.infer<typeof questionInputSchema>;

export const reorderQuestionsSchema = z.object({
  idsInOrder: z
    .array(z.string().uuid("ID inválido."))
    .min(1)
    .refine(
      (arr) => new Set(arr).size === arr.length,
      "No se permiten ids duplicados en el reordenado.",
    ),
});

export type ReorderQuestionsInput = z.infer<typeof reorderQuestionsSchema>;

export const toggleQuestionActiveSchema = z.object({
  id: z.string().uuid("ID inválido."),
  active: z.boolean(),
});

export type ToggleQuestionActiveInput = z.infer<typeof toggleQuestionActiveSchema>;

/**
 * Opciones por defecto al cambiar tipo en el editor — facilita la UI:
 * el componente reemplaza `opciones` por el default del nuevo tipo sin
 * tener que reconstruirlo desde cero.
 */
export function defaultOpcionesForType(tipo: QuestionType): unknown {
  switch (tipo) {
    case "likert":
      return {
        scale: [
          { value: 1, label: "Muy en desacuerdo" },
          { value: 2, label: "En desacuerdo" },
          { value: 3, label: "Neutral" },
          { value: 4, label: "De acuerdo" },
          { value: 5, label: "Muy de acuerdo" },
        ],
      };
    case "single":
      return {
        mode: "single",
        choices: [
          { id: "A", label: "" },
          { id: "B", label: "" },
        ],
      };
    case "multiple":
      return {
        mode: "multiple",
        choices: [
          { id: "A", label: "" },
          { id: "B", label: "" },
          { id: "C", label: "" },
        ],
      };
    case "ranking":
      return { items: ["", ""] };
    case "comparison":
      return { mode: "comparison" };
    case "text":
      return null;
  }
}

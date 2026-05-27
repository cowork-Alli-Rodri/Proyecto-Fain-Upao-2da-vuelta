import { z } from "zod";

/**
 * Schemas para fact checks ("No te dejes sorprender", B6).
 *
 * - factCheckSchema: lo que el admin crea/edita (CRUD curado).
 * - factCheckSuggestionSchema: lo que un estudiante sugiere para revisión.
 */

export const factCheckSchema = z.object({
  titularFalso: z
    .string()
    .min(5, "Mínimo 5 caracteres.")
    .max(220, "Máximo 220 caracteres."),
  contexto: z
    .string()
    .min(20, "Describe en al menos 20 caracteres qué se ha verificado.")
    .max(1000, "Máximo 1000 caracteres."),
  factCheckerName: z
    .string()
    .min(2, "Indica el nombre del medio verificador.")
    .max(80, "Máximo 80 caracteres."),
  factCheckerUrl: z
    .string()
    .url("Debe ser una URL válida (https://...).")
    .startsWith("http", "La URL debe empezar con http o https."),
  candidatoRelacionado: z.enum(["keiko", "roberto", "ambos", "ninguno"]).optional(),
  fechaOrigen: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD.")
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

export type FactCheckInput = z.infer<typeof factCheckSchema>;

export const factCheckSuggestionSchema = z.object({
  titularSospechoso: z
    .string()
    .min(10, "Describe el titular sospechoso (mínimo 10 caracteres).")
    .max(220, "Máximo 220 caracteres."),
  urlOFuente: z
    .string()
    .min(5, "Comparte la URL o la fuente.")
    .max(500, "Máximo 500 caracteres."),
  comentario: z
    .string()
    .max(500, "Máximo 500 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type FactCheckSuggestionInput = z.infer<typeof factCheckSuggestionSchema>;

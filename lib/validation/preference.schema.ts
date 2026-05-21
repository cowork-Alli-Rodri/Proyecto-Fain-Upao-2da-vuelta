import { z } from "zod";

/**
 * Preferencia final (FR-020, FR-021 inmutable v1).
 */
export const preferenceSchema = z.object({
  candidatoPreferido: z.enum(["keiko", "roberto", "indeciso"], {
    message: "Selecciona una opción.",
  }),
  confianza: z
    .number({ message: "Selecciona tu nivel de confianza." })
    .int()
    .min(1, "Nivel de confianza entre 1 y 10.")
    .max(10, "Nivel de confianza entre 1 y 10."),
  motivo: z
    .string()
    .max(500, "Máximo 500 caracteres.")
    .optional()
    .or(z.literal("")),
  turnstileToken: z.string().optional(),
});

export type PreferenceInput = z.infer<typeof preferenceSchema>;

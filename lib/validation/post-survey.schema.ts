import { z } from "zod";

/**
 * Encuesta final (post-cuestionario).
 *
 * Mide el efecto pedagógico de la exposición a los planes de gobierno
 * mostrados en /candidatos. La data se usa en el dashboard del docente
 * (agregada, sin identificar al estudiante).
 */
export const postSurveySchema = z.object({
  opinionChanged: z.enum(["si_mucho", "si_un_poco", "no"], {
    message: "Selecciona una opción.",
  }),
  dimensionTop: z.enum(
    ["social", "economica", "ambiental", "institucional", "ninguna"],
    { message: "Selecciona la dimensión que más te impactó." },
  ),
  utilityRating: z
    .number({ message: "Selecciona qué tan útil te fue la herramienta." })
    .int()
    .min(1, "El nivel va de 1 a 10.")
    .max(10, "El nivel va de 1 a 10."),
  wouldRecommend: z.boolean({ message: "Selecciona si la recomendarías." }),
  comentario: z
    .string()
    .max(500, "Máximo 500 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type PostSurveyInput = z.infer<typeof postSurveySchema>;

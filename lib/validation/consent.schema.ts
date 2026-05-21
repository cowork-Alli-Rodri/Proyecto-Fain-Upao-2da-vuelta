import { z } from "zod";

/**
 * Consentimiento informado (Ley 29733, FR-004 + FR-004a, Q3).
 * Ambos campos DEBEN estar marcados activamente (no pre-marcado).
 */
export const consentSchema = z.object({
  termsAccepted: z.literal(true, {
    message: "Debes aceptar los términos para continuar.",
  }),
  dataUseAccepted: z.literal(true, {
    message: "Debes autorizar el uso de tus datos para investigación académica del docente.",
  }),
  consentVersion: z.string().min(1).default("v1"),
  turnstileToken: z.string().optional(),
});

export type ConsentInput = z.infer<typeof consentSchema>;

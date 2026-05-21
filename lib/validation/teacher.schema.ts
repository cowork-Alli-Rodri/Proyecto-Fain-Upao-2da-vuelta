import { z } from "zod";

export const addAllowedTeacherSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es obligatorio.")
    .email("Correo inválido.")
    .max(255)
    .transform((v) => v.trim().toLowerCase()),
  note: z
    .string()
    .max(240, "Máximo 240 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type AddAllowedTeacherInput = z.infer<typeof addAllowedTeacherSchema>;

export const removeAllowedTeacherSchema = z.object({
  email: z
    .string()
    .min(1)
    .email("Correo inválido.")
    .transform((v) => v.trim().toLowerCase()),
});

export type RemoveAllowedTeacherInput = z.infer<typeof removeAllowedTeacherSchema>;

export const demoteTeacherSchema = z.object({
  userId: z.string().uuid("ID inválido."),
});

export type DemoteTeacherInput = z.infer<typeof demoteTeacherSchema>;

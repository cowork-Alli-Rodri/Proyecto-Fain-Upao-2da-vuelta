import { z } from "zod";

import {
  CARRERAS_POR_FACULTAD,
  FACULTADES,
  GENEROS,
  RANGOS_EDAD,
} from "@/lib/constants/upao";

const facultadValues = FACULTADES as readonly [string, ...string[]];
const generoValues = GENEROS.map((g) => g.value) as unknown as readonly [string, ...string[]];
const rangoEdadValues = RANGOS_EDAD as readonly [string, ...string[]];

/**
 * Datos demográficos mínimos (FR-006). Género opcional (FR-006).
 * Cross-row validation: carrera debe pertenecer a la facultad declarada.
 */
export const profileSchema = z
  .object({
    nombres: z
      .string()
      .min(2, "Ingresa tu(s) nombre(s).")
      .max(100, "Máximo 100 caracteres.")
      .regex(/^[\p{L}\p{M}'\-\s]+$/u, "Solo letras, tildes, espacios, guiones y apóstrofos."),
    apellidos: z
      .string()
      .min(2, "Ingresa tus apellidos.")
      .max(100, "Máximo 100 caracteres.")
      .regex(/^[\p{L}\p{M}'\-\s]+$/u, "Solo letras, tildes, espacios, guiones y apóstrofos."),
    facultad: z.enum(facultadValues, { message: "Selecciona tu facultad." }),
    carrera: z.string().min(2, "Selecciona tu carrera."),
    ciclo: z
      .number({ message: "Selecciona tu ciclo." })
      .int()
      .min(1, "Ciclo entre 1 y 14.")
      .max(14, "Ciclo entre 1 y 14."),
    rango_edad: z.enum(rangoEdadValues, { message: "Selecciona tu rango de edad." }),
    genero: z.enum(generoValues).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const facultad = data.facultad as keyof typeof CARRERAS_POR_FACULTAD;
    const valid = CARRERAS_POR_FACULTAD[facultad];
    if (!valid || !valid.includes(data.carrera)) {
      ctx.addIssue({
        code: "custom",
        path: ["carrera"],
        message: "Esta carrera no pertenece a la facultad seleccionada.",
      });
    }
  });

export type ProfileInput = z.infer<typeof profileSchema>;

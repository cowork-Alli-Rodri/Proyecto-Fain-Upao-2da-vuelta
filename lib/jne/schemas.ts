import { z } from "zod";

/**
 * Zod schemas del API JNE `web.jne.gob.pe/serviciovotoinformado`.
 *
 * Los shapes provienen de los JSONs reales auditados en `data/jne/raw/` —
 * no son inventados ni parafraseados (constitución I).
 *
 * Si el JNE cambia el shape, `parse()` falla, el refresh aborta y la copia
 * válida previa queda en DB (FR-035).
 */

// ============================================================================
// Token de sesión
// ============================================================================

/**
 * Endpoint `GET /api/authentication/token`.
 *
 * El payload exacto no está documentado. Algunos endpoints públicos del JNE
 * devuelven `{ token: "..." }`, otros devuelven el token plano. Aceptamos
 * varias formas y normalizamos en el cliente.
 */
export const JneTokenResponseSchema = z.union([
  z.object({ token: z.string().min(10) }),
  z.object({ data: z.object({ token: z.string().min(10) }) }),
  z.object({ jwt: z.string().min(10) }),
  z.string().min(10),
]);

export type JneTokenResponse = z.infer<typeof JneTokenResponseSchema>;

// ============================================================================
// Plan Header (búsqueda paginada)
// ============================================================================

const JnePlanHeaderRowSchema = z.object({
  idPlanGobierno: z.number().int().positive(),
  idOrganizacionPolitica: z.number().int().positive(),
  txOrganizacionPolitica: z.string().min(1),
  idTipoEleccion: z.number().int(),
  txTipoEleccion: z.string(),
  txRutaCompleto: z.string().nullable().optional(),
  txRutaResumen: z.string().nullable().optional(),
  txTipoPlan: z.string(),
  txEstadoLista: z.string(),
});

export type JnePlanHeaderRow = z.infer<typeof JnePlanHeaderRowSchema>;

export const JnePlanHeaderResponseSchema = z.object({
  pageIndex: z.number().int(),
  pageSize: z.number().int(),
  count: z.number().int(),
  data: z.array(JnePlanHeaderRowSchema).min(1),
  totalPages: z.number().int().optional(),
  messageLog: z.unknown().nullable().optional(),
});

export type JnePlanHeaderResponse = z.infer<typeof JnePlanHeaderResponseSchema>;

// ============================================================================
// Plan Detalle (4 dimensiones)
// ============================================================================

export const JneDimensionId = z.union([
  z.literal(1), // social
  z.literal(2), // economica
  z.literal(3), // ambiental
  z.literal(4), // institucional
]);

export type JneDimensionId = z.infer<typeof JneDimensionId>;

export const JnePlanDimensionItemSchema = z.object({
  idPlanGobDimension: z.number().int().positive(),
  txPgProblema: z.string().nullable(),
  txPgObjetivo: z.string().nullable(),
  txPgIndicador: z.string().nullable(),
  txPgMeta: z.string().nullable(),
  idPgDimension: JneDimensionId,
  idEstado: z.number().int().optional(),
  nuPorcentaje: z.number().optional(),
});

export type JnePlanDimensionItem = z.infer<typeof JnePlanDimensionItemSchema>;

const JnePlanDatoGeneralSchema = z.object({
  idPlanGobierno: z.number().int().positive(),
  idTipoEleccion: z.number().int(),
  txTipoEleccion: z.string(),
  idOrganizacionPolitica: z.number().int().positive(),
  txOrganizacionPolitica: z.string().min(1),
  txTipoPlan: z.string(),
  txRutaCompleto: z.string().nullable().optional(),
  txRutaResumen: z.string().nullable().optional(),
  idProcesoElectoral: z.number().int(),
});

export const JnePlanDetalleSchema = z.object({
  datoGeneral: JnePlanDatoGeneralSchema,
  dimensionSocial: z.array(JnePlanDimensionItemSchema),
  dimensionEconomica: z.array(JnePlanDimensionItemSchema),
  dimensionAmbiental: z.array(JnePlanDimensionItemSchema),
  dimensionInstitucional: z.array(JnePlanDimensionItemSchema),
});

export type JnePlanDetalle = z.infer<typeof JnePlanDetalleSchema>;

// ============================================================================
// Fórmula (candidato + vice)
// ============================================================================

const JneFormulaRowSchema = z.object({
  idHojaVida: z.number().int().positive(),
  idOrganizacionPolitica: z.number().int().positive(),
  organizacionPolitica: z.string().min(1),
  numeroDocumento: z.string().optional(),
  nombreCompleto: z.string().min(1),
  cargoObj: z.array(z.string()).optional(),
  cargo: z.string(),
  numeroCandidato: z.number().int().optional(),
  estado: z.string().optional(),
  txGuidFoto: z.string().nullable().optional(),
  txNombre: z.string().nullable().optional(),
});

export type JneFormulaRow = z.infer<typeof JneFormulaRowSchema>;

export const JneFormulaResponseSchema = z.object({
  pageIndex: z.number().int(),
  pageSize: z.number().int(),
  count: z.number().int(),
  data: z.array(JneFormulaRowSchema).min(1),
  totalPages: z.number().int().optional(),
  messageLog: z.unknown().nullable().optional(),
});

export type JneFormulaResponse = z.infer<typeof JneFormulaResponseSchema>;

// ============================================================================
// Mapeo idPgDimension → enum DB
// ============================================================================

export const JNE_DIMENSION_TO_ENUM: Record<
  JneDimensionId,
  "social" | "economica" | "ambiental" | "institucional"
> = {
  1: "social",
  2: "economica",
  3: "ambiental",
  4: "institucional",
};

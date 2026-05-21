/**
 * Tipos públicos del módulo JNE.
 *
 * Derivados de los Zod schemas vía `z.infer` para que tipo y validación
 * estén siempre en sync. Si necesitas un tipo nuevo, agrégalo en
 * `schemas.ts` con su Zod schema y re-expórtalo aquí.
 */

export type {
  JnePlanHeaderResponse,
  JnePlanHeaderRow,
  JnePlanDetalle,
  JnePlanDimensionItem,
  JneFormulaResponse,
  JneFormulaRow,
  JneTokenResponse,
  JneDimensionId,
} from "./schemas";

export { JNE_DIMENSION_TO_ENUM } from "./schemas";

// ============================================================================
// IDs estables del JNE para los dos finalistas de la Segunda Vuelta 2026.
// Documentados en data/jne/README.md.
// ============================================================================

export const JNE_FINALISTAS = {
  keiko: {
    idHojaVida: 245741,
    idOrganizacionPolitica: 1366,
    idPlanGobierno: 29690,
    nombreCompleto: "KEIKO SOFIA FUJIMORI HIGUCHI",
    partido: "FUERZA POPULAR",
  },
  roberto: {
    idHojaVida: 246281,
    idOrganizacionPolitica: 1264,
    idPlanGobierno: 29688,
    nombreCompleto: "ROBERTO HELBERT SANCHEZ PALOMINO",
    partido: "JUNTOS POR EL PERU",
  },
} as const;

export const JNE_PROCESO_ELECTORAL = 124; // Elecciones Generales 2026
export const JNE_TIPO_ELECCION_PRESIDENCIAL = 1;

export interface JneRefreshSummary {
  candidatesUpdated: number;
  dimensionsUpdated: number;
  finishedAt: string;
  durationMs: number;
}

export type JneRefreshTrigger = "cron" | "admin" | "cli";

// ============================================================================
// Errores tipados del módulo JNE
// ============================================================================

export class JneAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JneAuthError";
  }
}

export class JneNetworkError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "JneNetworkError";
  }
}

export class JneSchemaError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "JneSchemaError";
  }
}

export class JneTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JneTimeoutError";
  }
}

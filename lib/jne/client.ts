import {
  JneAuthError,
  JneNetworkError,
  JneSchemaError,
  JneTimeoutError,
} from "./types";

import { z } from "zod";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types";

/**
 * Cliente del nuevo servicio JNE (`votoinformadoia.jne.gob.pe`).
 *
 * Migración de mayo 2026: el JNE migró del endpoint clásico (4 dimensiones
 * estructuradas en JSON) a un servicio que expone un resumen textual del plan
 * de gobierno generado por IA. Mantenemos la capa de cliente para encapsular
 * retries, timeout y schema validation.
 *
 * El nuevo servicio es público (no requiere token), así que `JneTokenStore`
 * existe solo por compatibilidad con el `JneClient` que importa el resto del
 * proyecto (cache util, refresh). El token nunca se usa.
 */

const DEFAULT_BASE_URL = "https://votoinformadoia.jne.gob.pe/ServiciosWeb";
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_USER_AGENT =
  "VotoInformadoUPAO/1.0 (academic; +https://github.com/MrWoffi)";

// Backoff exponencial: 1s, 2s, 4s — total ~7s antes de fallar.
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];

export interface JneTokenStore {
  get(): Promise<{ token: string; expiresAt: string } | null>;
  set(token: string, expiresAt: string): Promise<void>;
}

export const JnePlanResumenSchema = z.object({
  success: z.boolean(),
  type: z.number().optional(),
  message: z.string().optional(),
  data: z
    .object({
      idOrganizacionPolitica: z.union([z.string(), z.number()]),
      resumen: z.string(),
    })
    .nullable(),
});

export type JnePlanResumen = z.infer<typeof JnePlanResumenSchema>;

export class JneClient {
  constructor(
    // tokenStore se mantiene en la firma para no romper callers existentes.
    _tokenStore: JneTokenStore,
    private readonly options: {
      baseUrl?: string;
      timeoutMs?: number;
      userAgent?: string;
      fetch?: typeof fetch;
      /** Backoff entre reintentos (ms). Inyectable para tests (ej. [0, 0]) y así
       *  no parchear `globalThis.setTimeout`, que desestabiliza timers de Node. */
      retryDelaysMs?: number[];
    } = {},
  ) {}

  private get baseUrl(): string {
    return this.options.baseUrl ?? DEFAULT_BASE_URL;
  }

  private get timeoutMs(): number {
    return this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private get retryDelays(): number[] {
    return this.options.retryDelaysMs ?? RETRY_DELAYS_MS;
  }

  private get fetchImpl(): typeof fetch {
    return this.options.fetch ?? fetch;
  }

  /**
   * Devuelve el resumen textual del plan de gobierno de una organización
   * política. Backed por:
   *   POST /api/v1/plan-gobierno/resumen-por-organizacion
   *   body: {"idOrganizacionPolitica": <id>}
   */
  async getPlanResumen(idOrganizacionPolitica: number): Promise<string> {
    const url = `${this.baseUrl}/api/v1/plan-gobierno/resumen-por-organizacion`;
    const payload = await this.fetchJson(url, {
      idOrganizacionPolitica,
    });

    const parsed = JnePlanResumenSchema.safeParse(payload);
    if (!parsed.success) {
      throw new JneSchemaError(
        "Respuesta inesperada de resumen-por-organizacion",
        parsed.error,
      );
    }
    if (!parsed.data.success || !parsed.data.data?.resumen) {
      throw new JneNetworkError(
        `JNE devolvió success=false o resumen vacío para ${idOrganizacionPolitica}: ${parsed.data.message ?? "(sin mensaje)"}`,
      );
    }
    return parsed.data.data.resumen;
  }

  // --------------------------------------------------------------------------
  // Internal — manejo de retries y timeout
  // --------------------------------------------------------------------------

  private async fetchJson(url: string, body: unknown): Promise<unknown> {
    let lastError: unknown = null;

    const retryDelays = this.retryDelays;
    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
      try {
        const response = await this.rawFetch(url, body);

        if (response.status === 401 || response.status === 403) {
          throw new JneAuthError(`${response.status} en ${url}`);
        }

        if (response.status >= 500) {
          throw new JneNetworkError(`${response.status} en ${url}`, response.status);
        }

        if (!response.ok) {
          throw new JneNetworkError(`HTTP ${response.status} en ${url}`, response.status);
        }

        return await safeJson(response);
      } catch (e) {
        lastError = e;

        if (e instanceof JneAuthError || e instanceof JneSchemaError) {
          throw e;
        }

        const delay = retryDelays[attempt];
        if (delay === undefined) break;
        await sleep(delay);
      }
    }

    if (lastError instanceof Error) throw lastError;
    throw new JneNetworkError(`Refresh JNE agotó retries en ${url}`);
  }

  private async rawFetch(url: string, body: unknown): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": this.options.userAgent ?? DEFAULT_USER_AGENT,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await this.fetchImpl(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new JneTimeoutError(`Timeout ${this.timeoutMs}ms en ${url}`);
      }
      if (e instanceof Error) {
        throw new JneNetworkError(`Fallo de red en ${url}: ${e.message}`);
      }
      throw new JneNetworkError(`Fallo de red desconocido en ${url}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// ============================================================================
// Helpers internos
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeJson(response: Response): Promise<unknown> {
  const text = await response.text();
  const clean = text.replace(/^﻿/, "");
  if (clean.length === 0) return null;
  try {
    return JSON.parse(clean);
  } catch (e) {
    throw new JneSchemaError(
      `Respuesta no es JSON válido (status ${response.status}): ${clean.slice(0, 200)}`,
      e,
    );
  }
}

// ============================================================================
// TokenStore stubs — el nuevo endpoint no necesita token, pero conservamos las
// fábricas para que llamadores existentes (refresh, tests) sigan compilando.
// ============================================================================

export function createSupabaseTokenStore(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _client: SupabaseClient<Database>,
): JneTokenStore {
  // El nuevo endpoint /resumen-por-organizacion no requiere token, pero
  // mantenemos la firma para no romper a los callers existentes.
  return createMemoryTokenStore();
}

export function createMemoryTokenStore(initial?: {
  token: string;
  expiresAt: string;
}): JneTokenStore {
  let state: { token: string; expiresAt: string } | null = initial ?? null;
  return {
    async get() {
      return state;
    },
    async set(token, expiresAt) {
      state = { token, expiresAt };
    },
  };
}

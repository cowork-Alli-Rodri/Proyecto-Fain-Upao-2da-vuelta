import {
  JneFormulaResponseSchema,
  JnePlanDetalleSchema,
  JnePlanHeaderResponseSchema,
  JneTokenResponseSchema,
} from "./schemas";
import {
  JneAuthError,
  JneNetworkError,
  JneSchemaError,
  JneTimeoutError,
  JNE_PROCESO_ELECTORAL,
  JNE_TIPO_ELECCION_PRESIDENCIAL,
  type JneFormulaResponse,
  type JnePlanDetalle,
  type JnePlanHeaderResponse,
} from "./types";

/**
 * Interfaz mínima para persistir el token de sesión entre llamadas.
 * El backend usa `app_settings` (single row), pero los tests pueden inyectar
 * una implementación en memoria.
 */
export interface JneTokenStore {
  get(): Promise<{ token: string; expiresAt: string } | null>;
  set(token: string, expiresAt: string): Promise<void>;
}

const DEFAULT_BASE_URL = "https://web.jne.gob.pe/serviciovotoinformado";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_USER_AGENT = "VotoInformadoUPAO/1.0 (academic; +https://github.com/MrWoffi)";

// Backoff exponencial: 1s, 2s, 4s — total ~7s antes de fallar.
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];

/**
 * Cliente tipado para `web.jne.gob.pe/serviciovotoinformado`.
 *
 * Garantías:
 *  - 401: reintenta UNA vez tras forzar nuevo token.
 *  - 5xx: hasta 3 retries con backoff exponencial.
 *  - Schema mismatch: lanza `JneSchemaError` (no escribe DB).
 *  - Timeout: 10s por request, lanza `JneTimeoutError`.
 *
 * El token de sesión vive ~24h. Lo cacheamos en `app_settings` para no
 * golpear el endpoint `/authentication/token` en cada request.
 */
export class JneClient {
  constructor(
    private readonly tokenStore: JneTokenStore,
    private readonly options: {
      baseUrl?: string;
      timeoutMs?: number;
      userAgent?: string;
      fetch?: typeof fetch;
    } = {},
  ) {}

  private get baseUrl(): string {
    return this.options.baseUrl ?? DEFAULT_BASE_URL;
  }

  private get timeoutMs(): number {
    return this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private get fetchImpl(): typeof fetch {
    return this.options.fetch ?? fetch;
  }

  async getToken(force = false): Promise<string> {
    if (!force) {
      const cached = await this.tokenStore.get();
      if (cached && new Date(cached.expiresAt).getTime() > Date.now() + 5 * 60 * 1000) {
        return cached.token;
      }
    }

    const response = await this.rawFetch(`${this.baseUrl}/api/authentication/token`, {
      withAuth: false,
    });

    const payload = await safeJson(response);
    const parsed = JneTokenResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new JneSchemaError("Respuesta inesperada del endpoint /authentication/token", parsed.error);
    }

    const token = extractToken(parsed.data);
    // TTL conservador: 23h para refrescar antes de que expire.
    const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString();
    await this.tokenStore.set(token, expiresAt);
    return token;
  }

  async getPlanHeader(idOrganizacionPolitica: number): Promise<JnePlanHeaderResponse> {
    const url = `${this.baseUrl}/api/PlanGobiernoP/getPlanGobiernoByIdProcesoElectoral?idProcesoElectoral=${JNE_PROCESO_ELECTORAL}&idTipoEleccion=${JNE_TIPO_ELECCION_PRESIDENCIAL}&idOrganizacionPolitica=${idOrganizacionPolitica}`;
    const payload = await this.fetchJson(url);
    const parsed = JnePlanHeaderResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new JneSchemaError("Respuesta inesperada de getPlanGobiernoByIdProcesoElectoral", parsed.error);
    }
    return parsed.data;
  }

  async getPlanDetalle(idPlanGobierno: number): Promise<JnePlanDetalle> {
    const url = `${this.baseUrl}/api/PlanGobiernoP/getPlanGobiernoDetalleByIdPlanGobierno?idPlanGobierno=${idPlanGobierno}`;
    const payload = await this.fetchJson(url);
    const parsed = JnePlanDetalleSchema.safeParse(payload);
    if (!parsed.success) {
      throw new JneSchemaError("Respuesta inesperada de getPlanGobiernoDetalleByIdPlanGobierno", parsed.error);
    }
    return parsed.data;
  }

  async getFormula(idOrganizacionPolitica: number): Promise<JneFormulaResponse> {
    const url = `${this.baseUrl}/api/ConsultaFormulasP/getFormulasByIdProcesoElectoral?idProcesoElectoral=${JNE_PROCESO_ELECTORAL}&idTipoEleccion=${JNE_TIPO_ELECCION_PRESIDENCIAL}&idOrganizacionPolitica=${idOrganizacionPolitica}`;
    const payload = await this.fetchJson(url);
    const parsed = JneFormulaResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new JneSchemaError("Respuesta inesperada de getFormulasByIdProcesoElectoral", parsed.error);
    }
    return parsed.data;
  }

  // --------------------------------------------------------------------------
  // Internal — manejo de retries, timeout y 401 con refresh de token
  // --------------------------------------------------------------------------

  private async fetchJson(url: string): Promise<unknown> {
    let triedRefresh = false;
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        const response = await this.rawFetch(url, { withAuth: true });

        if (response.status === 401) {
          if (triedRefresh) {
            throw new JneAuthError(`401 sostenido en ${url}`);
          }
          triedRefresh = true;
          await this.getToken(true);
          continue;
        }

        if (response.status >= 500) {
          // Throw para entrar al catch y aplicar backoff.
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

        // 5xx o timeout o network — aplicar backoff si quedan retries
        const delay = RETRY_DELAYS_MS[attempt];
        if (delay === undefined) break;
        await sleep(delay);
      }
    }

    if (lastError instanceof Error) throw lastError;
    throw new JneNetworkError(`Refresh JNE agotó retries en ${url}`);
  }

  private async rawFetch(
    url: string,
    opts: { withAuth: boolean },
  ): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": this.options.userAgent ?? DEFAULT_USER_AGENT,
    };

    if (opts.withAuth) {
      const token = await this.getToken(false);
      headers["X-Session-Token"] = token;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await this.fetchImpl(url, {
        method: "GET",
        headers,
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
  // El JNE eventualmente sirve respuestas con BOM UTF-8 — limpiar.
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

function extractToken(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (typeof payload === "object" && payload !== null) {
    if ("token" in payload && typeof (payload as { token: unknown }).token === "string") {
      return (payload as { token: string }).token;
    }
    if ("jwt" in payload && typeof (payload as { jwt: unknown }).jwt === "string") {
      return (payload as { jwt: string }).jwt;
    }
    if ("data" in payload) {
      const inner = (payload as { data: unknown }).data;
      if (
        typeof inner === "object" &&
        inner !== null &&
        "token" in inner &&
        typeof (inner as { token: unknown }).token === "string"
      ) {
        return (inner as { token: string }).token;
      }
    }
  }
  throw new JneSchemaError("No pudimos extraer el token de la respuesta.");
}

// ============================================================================
// TokenStore real respaldado por Supabase `app_settings`
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types";

export function createSupabaseTokenStore(
  client: SupabaseClient<Database>,
): JneTokenStore {
  return {
    async get() {
      const { data } = await client
        .from("app_settings")
        .select("jne_session_token, jne_token_expires_at")
        .eq("id", 1)
        .maybeSingle();
      const row = data as { jne_session_token: string | null; jne_token_expires_at: string | null } | null;
      if (!row?.jne_session_token || !row.jne_token_expires_at) return null;
      return { token: row.jne_session_token, expiresAt: row.jne_token_expires_at };
    },
    async set(token, expiresAt) {
      await client
        .from("app_settings")
        .update({ jne_session_token: token, jne_token_expires_at: expiresAt })
        .eq("id", 1);
    },
  };
}

/**
 * In-memory token store — útil para tests y CLI scripts efímeros.
 */
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

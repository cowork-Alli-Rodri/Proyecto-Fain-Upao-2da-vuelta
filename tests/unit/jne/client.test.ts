/**
 * Tests del JneClient — mock fetch inyectado vía opciones.
 *
 * No usamos MSW acá porque el cliente acepta un `fetch` custom; inyectar
 * mocks directamente es más rápido y deja el test 100% determinista.
 */

import { describe, expect, it, vi } from "vitest";

import { JneClient, createMemoryTokenStore } from "@/lib/jne/client";
import {
  JneAuthError,
  JneNetworkError,
  JneSchemaError,
  type JnePlanDetalle,
} from "@/lib/jne/types";

function fakePlanDetalle(idPlan: number): JnePlanDetalle {
  const baseItem = {
    idPlanGobDimension: 1,
    txPgProblema: "Problema",
    txPgObjetivo: "Objetivo",
    txPgIndicador: "Indicador",
    txPgMeta: "Meta",
    idEstado: 1,
    nuPorcentaje: 100,
  };
  return {
    datoGeneral: {
      idPlanGobierno: idPlan,
      idTipoEleccion: 1,
      txTipoEleccion: "PRESIDENCIAL",
      idOrganizacionPolitica: 1366,
      txOrganizacionPolitica: "FUERZA POPULAR",
      txTipoPlan: "PLAN DE GOBIERNO",
      idProcesoElectoral: 124,
    },
    dimensionSocial: [{ ...baseItem, idPgDimension: 1 }],
    dimensionEconomica: [{ ...baseItem, idPgDimension: 2 }],
    dimensionAmbiental: [{ ...baseItem, idPgDimension: 3 }],
    dimensionInstitucional: [{ ...baseItem, idPgDimension: 4 }],
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("JneClient", () => {
  it("getToken cachea el token y solo golpea el endpoint la primera vez", async () => {
    const store = createMemoryTokenStore();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ token: "tok-abc-123-456" }));

    const client = new JneClient(store, { fetch: fetchMock });
    const t1 = await client.getToken();
    const t2 = await client.getToken();

    expect(t1).toBe("tok-abc-123-456");
    expect(t2).toBe("tok-abc-123-456");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getToken acepta variantes de payload (string plano, { token }, { data.token }, { jwt })", async () => {
    for (const payload of [
      "raw-token-12345",
      { token: "obj-token-12345" },
      { data: { token: "nested-token-12345" } },
      { jwt: "jwt-token-12345" },
    ]) {
      const store = createMemoryTokenStore();
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(payload));
      const client = new JneClient(store, { fetch: fetchMock });
      const t = await client.getToken(true);
      expect(t.length).toBeGreaterThan(10);
    }
  });

  it("renueva el token al recibir 401 una vez y reintenta", async () => {
    const store = createMemoryTokenStore({
      token: "old-token-1234567890",
      expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    });

    const fetchMock = vi
      .fn()
      // 1ª call: getPlanDetalle → 401 forzado
      .mockResolvedValueOnce(jsonResponse({ error: "expired" }, 401))
      // 2ª call: getToken con force=true → nuevo token
      .mockResolvedValueOnce(jsonResponse({ token: "new-token-9999999999" }))
      // 3ª call: retry getPlanDetalle → 200
      .mockResolvedValueOnce(jsonResponse(fakePlanDetalle(29690)));

    const client = new JneClient(store, { fetch: fetchMock });
    const detalle = await client.getPlanDetalle(29690);

    expect(detalle.datoGeneral.idPlanGobierno).toBe(29690);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const cached = await store.get();
    expect(cached?.token).toBe("new-token-9999999999");
  });

  it("lanza JneAuthError si el 401 persiste tras renovar token", async () => {
    const store = createMemoryTokenStore({
      token: "old-token-1234567890",
      expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "401" }, 401))
      .mockResolvedValueOnce(jsonResponse({ token: "new-token-9999999999" }))
      .mockResolvedValueOnce(jsonResponse({ error: "401" }, 401));

    const client = new JneClient(store, { fetch: fetchMock });
    await expect(client.getPlanDetalle(29690)).rejects.toBeInstanceOf(JneAuthError);
  });

  it("reintenta hasta 3 veces en 5xx antes de fallar", async () => {
    const store = createMemoryTokenStore({
      token: "token-cached-1234567890",
      expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    });

    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "boom" }, 503));
    const client = new JneClient(store, {
      fetch: fetchMock,
      // Acortar timeouts internos no es necesario porque el cliente solo
      // espera entre intentos — usamos un fetch fake instantáneo.
    });

    // Para no esperar 7s reales por el backoff, monkey-patchamos setTimeout.
    const realSetTimeout = globalThis.setTimeout;
    vi.stubGlobal(
      "setTimeout",
      ((fn: () => void) => realSetTimeout(fn, 0)) as unknown as typeof setTimeout,
    );

    try {
      await expect(client.getPlanDetalle(29690)).rejects.toBeInstanceOf(JneNetworkError);
      // Intento inicial + 3 retries = 4 calls
      expect(fetchMock).toHaveBeenCalledTimes(4);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("lanza JneSchemaError cuando la respuesta no matchea el shape esperado", async () => {
    const store = createMemoryTokenStore({
      token: "token-cached-1234567890",
      expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    });

    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        // Falta `datoGeneral` y las dimensiones — schema mismatch.
        unexpected: "shape",
      }),
    );

    const client = new JneClient(store, { fetch: fetchMock });
    await expect(client.getPlanDetalle(29690)).rejects.toBeInstanceOf(JneSchemaError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("incluye el header X-Session-Token en endpoints autenticados", async () => {
    const store = createMemoryTokenStore({
      token: "token-header-test-1234",
      expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    });

    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(fakePlanDetalle(29688)));
    const client = new JneClient(store, { fetch: fetchMock });

    await client.getPlanDetalle(29688);

    const callArgs = fetchMock.mock.calls[0]!;
    const init = callArgs[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Session-Token"]).toBe("token-header-test-1234");
  });
});

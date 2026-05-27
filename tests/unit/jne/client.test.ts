/**
 * Tests del JneClient — mock fetch inyectado vía opciones.
 *
 * No usamos MSW acá porque el cliente acepta un `fetch` custom; inyectar
 * mocks directamente es más rápido y deja el test 100% determinista.
 */

import { describe, expect, it, vi } from "vitest";

import { JneClient, createMemoryTokenStore } from "@/lib/jne/client";
import {
  JneNetworkError,
  JneSchemaError,
} from "@/lib/jne/types";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function fakeResumen(idOrg: number, text = "Resumen del plan."): unknown {
  return {
    success: true,
    type: 1,
    message: "",
    data: {
      idOrganizacionPolitica: idOrg,
      resumen: text,
    },
  };
}

describe("JneClient (nueva API votoinformadoia)", () => {
  it("getPlanResumen retorna el texto del resumen cuando success=true", async () => {
    const store = createMemoryTokenStore();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(fakeResumen(1366, "Plan FP texto.")));

    const client = new JneClient(store, { fetch: fetchMock });
    const resumen = await client.getPlanResumen(1366);
    expect(resumen).toBe("Plan FP texto.");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0]!;
    const init = call[1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ idOrganizacionPolitica: 1366 });
  });

  it("lanza JneNetworkError si la API responde success=false", async () => {
    const store = createMemoryTokenStore();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ success: false, type: 2, message: "No data", data: null }),
    );
    const client = new JneClient(store, { fetch: fetchMock });
    await expect(client.getPlanResumen(9999)).rejects.toBeInstanceOf(JneNetworkError);
  });

  it("lanza JneSchemaError cuando la respuesta no matchea el shape esperado", async () => {
    const store = createMemoryTokenStore();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        // Faltan `success` y `data` — schema mismatch.
        unexpected: "shape",
      }),
    );
    const client = new JneClient(store, { fetch: fetchMock });
    await expect(client.getPlanResumen(1366)).rejects.toBeInstanceOf(JneSchemaError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reintenta hasta 3 veces en 5xx antes de fallar", async () => {
    const store = createMemoryTokenStore();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "boom" }, 503));
    const client = new JneClient(store, { fetch: fetchMock });

    const realSetTimeout = globalThis.setTimeout;
    vi.stubGlobal(
      "setTimeout",
      ((fn: () => void) => realSetTimeout(fn, 0)) as unknown as typeof setTimeout,
    );

    try {
      await expect(client.getPlanResumen(1366)).rejects.toBeInstanceOf(JneNetworkError);
      // Intento inicial + 3 retries = 4 calls
      expect(fetchMock).toHaveBeenCalledTimes(4);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

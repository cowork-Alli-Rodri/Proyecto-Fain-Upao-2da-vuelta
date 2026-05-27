/**
 * Helper para mockear `createClient` de `@/lib/supabase/server` en unit tests.
 *
 * Devuelve un objeto chainable que registra cada llamada y permite stubear
 * resultados por tabla/operación. No replica todo el query builder de Supabase,
 * solo lo que necesitan los tests de server actions del flujo estudiante.
 */

import { vi } from "vitest";

export type MockUser = { id: string; email?: string } | null;

export interface MockTableResult {
  data?: unknown;
  error?: { code: string; message: string } | null;
  count?: number | null;
}

export interface MockSupabaseConfig {
  user: MockUser;
  tables?: Record<string, MockTableResult | ((op: string) => MockTableResult)>;
  rpc?: Record<string, unknown>;
}

export interface MockSupabaseCall {
  table: string;
  op: string;
  payload?: unknown;
}

export function createMockSupabase(config: MockSupabaseConfig) {
  const calls: MockSupabaseCall[] = [];

  function resolveTable(name: string, op: string): MockTableResult {
    const entry = config.tables?.[name];
    if (typeof entry === "function") return entry(op);
    return entry ?? { data: null, error: null };
  }

  function builder(table: string) {
    let currentOp = "select";
    let payload: unknown = null;

    const chain = {
      select: vi.fn((_cols?: string, opts?: { count?: string; head?: boolean }) => {
        currentOp = opts?.head ? "select.head" : "select";
        calls.push({ table, op: currentOp, payload: { cols: _cols, opts } });
        return chain;
      }),
      insert: vi.fn((data: unknown) => {
        currentOp = "insert";
        payload = data;
        calls.push({ table, op: "insert", payload });
        return chain;
      }),
      update: vi.fn((data: unknown) => {
        currentOp = "update";
        payload = data;
        calls.push({ table, op: "update", payload });
        return chain;
      }),
      upsert: vi.fn((data: unknown) => {
        currentOp = "upsert";
        payload = data;
        calls.push({ table, op: "upsert", payload });
        return chain;
      }),
      delete: vi.fn(() => {
        currentOp = "delete";
        calls.push({ table, op: "delete" });
        return chain;
      }),
      eq: vi.fn(() => chain),
      not: vi.fn(() => chain),
      in: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      single: vi.fn(() => Promise.resolve(resolveTable(table, currentOp))),
      maybeSingle: vi.fn(() => Promise.resolve(resolveTable(table, currentOp))),
      then: (resolve: (v: MockTableResult) => unknown) =>
        Promise.resolve(resolveTable(table, currentOp)).then(resolve),
    };

    return chain;
  }

  const client = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: config.user },
        error: config.user ? null : { message: "Unauthenticated" },
      })),
    },
    from: vi.fn((table: string) => builder(table)),
    rpc: vi.fn(async (name: string) => ({
      data: config.rpc?.[name] ?? null,
      error: null,
    })),
  };

  return { client, calls };
}

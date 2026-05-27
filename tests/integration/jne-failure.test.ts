/**
 * Integration test — `jneRefresh` ante falla sostenida del JNE.
 *
 * Verifica FR-035: si el JNE devuelve 500 persistente, la copia previa
 * en DB queda intacta y la bitácora registra `status='failed'`.
 *
 * Auto-skip si no se detecta Supabase local.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { JneClient, createMemoryTokenStore } from "@/lib/jne/client";
import { jneRefresh } from "@/lib/jne/refresh";
import { JNE_FINALISTAS } from "@/lib/jne/types";
import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isLocal =
  !!url && (url.includes("127.0.0.1") || url.includes("localhost")) && !!serviceKey;

(isLocal ? describe : describe.skip)(
  "jneRefresh — falla sostenida del JNE",
  () => {
    let supabase: SupabaseClient<Database>;

    beforeAll(() => {
      supabase = createClient<Database>(url!, serviceKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    });

    it("no escribe en DB cuando el JNE devuelve 500 persistente; log status='failed'", async () => {
      // Snapshot del nombre de Keiko antes del refresh fallido.
      const { data: before } = await supabase
        .from("candidates")
        .select("nombre_completo, last_synced_at")
        .eq("id", JNE_FINALISTAS.keiko.idHojaVida)
        .single();
      const beforeName = (before as { nombre_completo: string }).nombre_completo;

      // Fetch que siempre devuelve 500.
      const failingFetch = async (): Promise<Response> => {
        return new Response("Internal Server Error", { status: 500 });
      };

      const client = new JneClient(createMemoryTokenStore(), {
        fetch: failingFetch,
      });

      // Para no esperar el backoff completo, monkey-patch setTimeout dentro
      // del cliente. (Vitest no permite stub global persistente entre tests
      // sin afterEach, así que lo hacemos inline.)
      const originalSetTimeout = globalThis.setTimeout;
      globalThis.setTimeout = ((fn: () => void) =>
        originalSetTimeout(fn, 0)) as unknown as typeof globalThis.setTimeout;

      let result;
      try {
        result = await jneRefresh({ triggeredBy: "admin", client });
      } finally {
        globalThis.setTimeout = originalSetTimeout;
      }

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(["Failed", "PartialFailure"]).toContain(result.error.code);

      // La copia previa de candidates debe estar intacta.
      const { data: after } = await supabase
        .from("candidates")
        .select("nombre_completo")
        .eq("id", JNE_FINALISTAS.keiko.idHojaVida)
        .single();
      expect((after as { nombre_completo: string }).nombre_completo).toBe(beforeName);

      // La última entrada del log debe ser failed o partial.
      const { data: log } = await supabase
        .from("jne_refresh_log")
        .select("status, error_message")
        .order("started_at", { ascending: false })
        .limit(1)
        .single();
      const row = log as { status: string; error_message: string | null };
      expect(["failed", "partial"]).toContain(row.status);
      expect(row.error_message ?? "").not.toBe("");
    }, 15_000);
  },
);

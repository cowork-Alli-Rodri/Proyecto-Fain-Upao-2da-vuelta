/**
 * Integration test — jneRefresh contra Supabase local + nueva API JNE.
 *
 * Inyecta un fetch fake (simulando POST a votoinformadoia/.../resumen-por-organizacion)
 * y verifica que `jneRefresh()` actualice `candidates.plan_resumen` y deje una
 * entrada `success` en `jne_refresh_log`.
 *
 * Requiere Supabase local corriendo (`pnpm exec supabase start`). Si no se
 * detecta, el suite se omite — no rompe CI sin Docker.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { JneClient, createMemoryTokenStore } from "@/lib/jne/client";
import { jneRefresh } from "@/lib/jne/refresh";
import { JNE_FINALISTAS } from "@/lib/jne/types";
import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isLocal =
  !!url && (url.includes("127.0.0.1") || url.includes("localhost")) && !!serviceKey;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeFakeFetch() {
  return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const u = typeof input === "string" ? input : input.toString();
    if (u.includes("/api/v1/plan-gobierno/resumen-por-organizacion")) {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      const idOrg = Number(body.idOrganizacionPolitica ?? 0);
      const resumen =
        idOrg === JNE_FINALISTAS.keiko.idOrganizacionPolitica
          ? "Resumen FP: orden, economía y social."
          : "Resumen JpP: democracia, soberanía y reforma.";
      return jsonResponse({
        success: true,
        type: 1,
        message: "",
        data: { idOrganizacionPolitica: idOrg, resumen },
      });
    }
    return jsonResponse({ detail: "Not Found" }, 404);
  };
}

(isLocal ? describe : describe.skip)(
  "jneRefresh — integración con Supabase local y fetch JNE mockeado",
  () => {
    let supabase: SupabaseClient<Database>;

    beforeAll(() => {
      supabase = createClient<Database>(url!, serviceKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    });

    it("upsert exitoso: actualiza candidatos con plan_resumen y deja log success", async () => {
      const client = new JneClient(createMemoryTokenStore(), {
        fetch: makeFakeFetch(),
      });

      const result = await jneRefresh({ triggeredBy: "admin", client });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.summary.candidatesUpdated).toBe(2);

      const { data: candidates } = await supabase
        .from("candidates")
        .select("id, plan_resumen")
        .in("id", [
          JNE_FINALISTAS.keiko.idHojaVida,
          JNE_FINALISTAS.roberto.idHojaVida,
        ]);
      const rows = (candidates ?? []) as Array<{ id: number; plan_resumen: string | null }>;
      const keiko = rows.find((r) => r.id === JNE_FINALISTAS.keiko.idHojaVida);
      const roberto = rows.find((r) => r.id === JNE_FINALISTAS.roberto.idHojaVida);
      expect(keiko?.plan_resumen).toContain("Resumen FP");
      expect(roberto?.plan_resumen).toContain("Resumen JpP");

      const { data: log } = await supabase
        .from("jne_refresh_log")
        .select("triggered_by, status, candidates_updated")
        .order("started_at", { ascending: false })
        .limit(1)
        .single();
      expect((log as { status: string }).status).toBe("success");
      expect((log as { triggered_by: string }).triggered_by).toBe("admin");
    });

    afterAll(() => {
      // No restauramos: el test sobre-escribe plan_resumen con el mock; un
      // refresh real contra JNE volverá a poner el contenido oficial.
    });
  },
);

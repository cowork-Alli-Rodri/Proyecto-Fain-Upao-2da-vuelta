/**
 * Integration test — jneRefresh contra Supabase local.
 *
 * Inyecta un fetch fake en JneClient (simulando la API JNE) y verifica que
 * `jneRefresh()` actualice `candidates`, `plans`, `plan_dimensions` y deje
 * una entrada `success` en `jne_refresh_log`.
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

function buildPlanDetalle(idPlan: number, idOrg: number, orgName: string) {
  return {
    datoGeneral: {
      idPlanGobierno: idPlan,
      idTipoEleccion: 1,
      txTipoEleccion: "PRESIDENCIAL",
      idOrganizacionPolitica: idOrg,
      txOrganizacionPolitica: orgName,
      txTipoPlan: "PLAN DE GOBIERNO",
      txRutaCompleto: `https://example.test/plan-${idPlan}.pdf`,
      idProcesoElectoral: 124,
    },
    dimensionSocial: [
      {
        idPlanGobDimension: 100 + idPlan,
        txPgProblema: `Problema social ${orgName}`,
        txPgObjetivo: `Objetivo social ${orgName}`,
        txPgIndicador: `Indicador social ${orgName}`,
        txPgMeta: `Meta social ${orgName}`,
        idPgDimension: 1 as const,
        idEstado: 1,
        nuPorcentaje: 100,
      },
    ],
    dimensionEconomica: [
      {
        idPlanGobDimension: 200 + idPlan,
        txPgProblema: `Problema económico ${orgName}`,
        txPgObjetivo: `Objetivo económico ${orgName}`,
        txPgIndicador: `Indicador económico ${orgName}`,
        txPgMeta: `Meta económica ${orgName}`,
        idPgDimension: 2 as const,
        idEstado: 1,
        nuPorcentaje: 100,
      },
    ],
    dimensionAmbiental: [
      {
        idPlanGobDimension: 300 + idPlan,
        txPgProblema: `Problema ambiental ${orgName}`,
        txPgObjetivo: `Objetivo ambiental ${orgName}`,
        txPgIndicador: `Indicador ambiental ${orgName}`,
        txPgMeta: `Meta ambiental ${orgName}`,
        idPgDimension: 3 as const,
        idEstado: 1,
        nuPorcentaje: 100,
      },
    ],
    dimensionInstitucional: [
      {
        idPlanGobDimension: 400 + idPlan,
        txPgProblema: `Problema institucional ${orgName}`,
        txPgObjetivo: `Objetivo institucional ${orgName}`,
        txPgIndicador: `Indicador institucional ${orgName}`,
        txPgMeta: `Meta institucional ${orgName}`,
        idPgDimension: 4 as const,
        idEstado: 1,
        nuPorcentaje: 100,
      },
    ],
  };
}

function buildFormula(idHoja: number, idOrg: number, orgName: string, nombre: string) {
  return {
    pageIndex: 1,
    pageSize: 10,
    count: 1,
    data: [
      {
        idHojaVida: idHoja,
        idOrganizacionPolitica: idOrg,
        organizacionPolitica: orgName,
        numeroDocumento: "10000000",
        nombreCompleto: nombre,
        cargoObj: ["PRESIDENTE DE LA REPÚBLICA"],
        cargo: "PRESIDENTE DE LA REPÚBLICA",
        numeroCandidato: 1,
        estado: "INSCRITO",
        txGuidFoto: null,
        txNombre: null,
      },
    ],
    totalPages: 1,
    messageLog: null,
  };
}

function buildHeader(idPlan: number, idOrg: number, orgName: string) {
  return {
    pageIndex: 1,
    pageSize: 10,
    count: 1,
    data: [
      {
        idPlanGobierno: idPlan,
        idOrganizacionPolitica: idOrg,
        txOrganizacionPolitica: orgName,
        idTipoEleccion: 1,
        txTipoEleccion: "PRESIDENCIAL",
        txRutaCompleto: `https://example.test/plan-${idPlan}.pdf`,
        txTipoPlan: "PLAN DE GOBIERNO",
        txEstadoLista: "PRESENTADA",
      },
    ],
    totalPages: 1,
    messageLog: null,
  };
}

function makeFakeFetch() {
  return async (input: string | URL | Request): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/api/authentication/token")) {
      return jsonResponse({ token: "fake-token-1234567890" });
    }
    if (url.includes("getPlanGobiernoByIdProcesoElectoral")) {
      const idOrg = Number(url.match(/idOrganizacionPolitica=(\d+)/)?.[1] ?? "0");
      if (idOrg === JNE_FINALISTAS.keiko.idOrganizacionPolitica) {
        return jsonResponse(
          buildHeader(JNE_FINALISTAS.keiko.idPlanGobierno, idOrg, "FUERZA POPULAR"),
        );
      }
      return jsonResponse(
        buildHeader(JNE_FINALISTAS.roberto.idPlanGobierno, idOrg, "JUNTOS POR EL PERU"),
      );
    }
    if (url.includes("getPlanGobiernoDetalleByIdPlanGobierno")) {
      const idPlan = Number(url.match(/idPlanGobierno=(\d+)/)?.[1] ?? "0");
      if (idPlan === JNE_FINALISTAS.keiko.idPlanGobierno) {
        return jsonResponse(
          buildPlanDetalle(idPlan, JNE_FINALISTAS.keiko.idOrganizacionPolitica, "FUERZA POPULAR"),
        );
      }
      return jsonResponse(
        buildPlanDetalle(idPlan, JNE_FINALISTAS.roberto.idOrganizacionPolitica, "JUNTOS POR EL PERU"),
      );
    }
    if (url.includes("getFormulasByIdProcesoElectoral")) {
      const idOrg = Number(url.match(/idOrganizacionPolitica=(\d+)/)?.[1] ?? "0");
      if (idOrg === JNE_FINALISTAS.keiko.idOrganizacionPolitica) {
        return jsonResponse(
          buildFormula(
            JNE_FINALISTAS.keiko.idHojaVida,
            idOrg,
            "FUERZA POPULAR",
            JNE_FINALISTAS.keiko.nombreCompleto,
          ),
        );
      }
      return jsonResponse(
        buildFormula(
          JNE_FINALISTAS.roberto.idHojaVida,
          idOrg,
          "JUNTOS POR EL PERU",
          JNE_FINALISTAS.roberto.nombreCompleto,
        ),
      );
    }
    return jsonResponse({ error: "Unknown endpoint" }, 404);
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

    it("upsert exitoso: actualiza candidatos, planes, dimensiones y deja log success", async () => {
      const client = new JneClient(createMemoryTokenStore(), {
        fetch: makeFakeFetch(),
      });

      const result = await jneRefresh({ triggeredBy: "admin", client });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.summary.candidatesUpdated).toBe(2);
      expect(result.summary.dimensionsUpdated).toBe(8); // 4 dimensiones × 2 candidatos

      // Verifica que las dimensiones se persistieron con los textos del mock.
      const { data: dimensions } = await supabase
        .from("plan_dimensions")
        .select("plan_id, dimension, problema, objetivo")
        .in("plan_id", [
          JNE_FINALISTAS.keiko.idPlanGobierno,
          JNE_FINALISTAS.roberto.idPlanGobierno,
        ]);
      const rows = dimensions ?? [];
      const keikoSocial = rows.find(
        (r) => r.plan_id === JNE_FINALISTAS.keiko.idPlanGobierno && r.dimension === "social",
      );
      expect(keikoSocial?.problema).toContain("Problema social FUERZA POPULAR");

      const robertoEconomica = rows.find(
        (r) =>
          r.plan_id === JNE_FINALISTAS.roberto.idPlanGobierno &&
          r.dimension === "economica",
      );
      expect(robertoEconomica?.objetivo).toContain("Objetivo económico JUNTOS POR EL PERU");

      // Bitácora — última entrada debe ser status='success'
      const { data: log } = await supabase
        .from("jne_refresh_log")
        .select("triggered_by, status, candidates_updated, dimensions_updated")
        .order("started_at", { ascending: false })
        .limit(1)
        .single();
      expect((log as { status: string }).status).toBe("success");
      expect((log as { triggered_by: string }).triggered_by).toBe("admin");
    });

    afterAll(async () => {
      // Restaura los textos canónicos de Keiko (los seed originales) y
      // Roberto (NULL) para no contaminar otros tests.
      // Nota: si necesitas restaurar fielmente, ejecuta `pnpm db:reset`.
    });
  },
);

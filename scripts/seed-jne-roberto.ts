/**
 * Script CLI: completa las 4 dimensiones de Roberto Sánchez (plan 29688) en
 * la tabla `plan_dimensions` a partir del JSON real del JNE.
 *
 * Uso:
 *   pnpm exec tsx scripts/seed-jne-roberto.ts
 *
 * El JNE devuelve N items por dimensión (Roberto tiene 4 en Social, 5 en
 * Económica, 2 en Ambiental, 3 en Institucional). El esquema actual asume
 * 1 row por (plan_id, dimension), así que concatenamos los textos verbatim
 * con un separador "\n\n---\n\n" para preservar la integridad de cada item
 * sin parafrasear (constitución I).
 *
 * Idempotente: hace UPDATE sobre los rows placeholder creados por la migración
 * 0005_seed_jne.sql.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/supabase/database.types";

const SEPARATOR = "\n\n---\n\n";

const JNE_TO_DIM: Record<number, "social" | "economica" | "ambiental" | "institucional"> = {
  1: "social",
  2: "economica",
  3: "ambiental",
  4: "institucional",
};

interface JneItem {
  idPlanGobDimension: number;
  txPgProblema: string | null;
  txPgObjetivo: string | null;
  txPgIndicador: string | null;
  txPgMeta: string | null;
  idPgDimension: 1 | 2 | 3 | 4;
}

interface JnePlanDetalle {
  datoGeneral: { idPlanGobierno: number };
  dimensionSocial: JneItem[];
  dimensionEconomica: JneItem[];
  dimensionAmbiental: JneItem[];
  dimensionInstitucional: JneItem[];
}

function concatField(items: JneItem[], field: keyof JneItem): string | null {
  const texts = items
    .map((i) => i[field])
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  if (texts.length === 0) return null;
  return texts.join(SEPARATOR);
}

async function main() {
  const jsonPath = resolve(process.cwd(), "data/jne/raw/roberto-jpp-plan-detalle.json");
  // El JSON viene con BOM UTF-8 — strip antes de parsear.
  const fileContent = readFileSync(jsonPath, "utf-8").replace(/^﻿/, "");
  const raw = JSON.parse(fileContent) as JnePlanDetalle;

  const planId = raw.datoGeneral.idPlanGobierno;
  if (planId !== 29688) {
    console.error(`idPlanGobierno inesperado: ${planId}. Esperaba 29688.`);
    process.exit(1);
  }

  const dimensions: { key: keyof Pick<JnePlanDetalle, "dimensionSocial" | "dimensionEconomica" | "dimensionAmbiental" | "dimensionInstitucional">; items: JneItem[] }[] = [
    { key: "dimensionSocial", items: raw.dimensionSocial },
    { key: "dimensionEconomica", items: raw.dimensionEconomica },
    { key: "dimensionAmbiental", items: raw.dimensionAmbiental },
    { key: "dimensionInstitucional", items: raw.dimensionInstitucional },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const { items } of dimensions) {
    if (items.length === 0) continue;
    const idPg = items[0]!.idPgDimension;
    const dimEnum = JNE_TO_DIM[idPg];
    if (!dimEnum) {
      console.warn(`Dimensión JNE ${idPg} desconocida, salto.`);
      continue;
    }

    const problema = concatField(items, "txPgProblema");
    const objetivo = concatField(items, "txPgObjetivo");
    const indicador = concatField(items, "txPgIndicador");
    const meta = concatField(items, "txPgMeta");

    const { error } = await supabase
      .from("plan_dimensions")
      .update({
        problema,
        objetivo,
        indicador,
        meta,
        raw_json: { items } as never,
        last_synced_at: new Date().toISOString(),
      })
      .eq("plan_id", planId)
      .eq("dimension", dimEnum);

    if (error) {
      console.error(`Error actualizando dimensión ${dimEnum}:`, error.message);
      continue;
    }
    console.warn(`OK: dimensión ${dimEnum} (${items.length} items concatenados).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

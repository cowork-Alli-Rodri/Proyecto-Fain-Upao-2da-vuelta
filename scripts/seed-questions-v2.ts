/**
 * Script CLI: carga el banco v2 desde data/questions/draft_v2.md a `public.questions`.
 *
 * Cambios respecto a seed-questions.ts (v1):
 *   - Parsea `momento`, `dimension_cuestionario`, `dimension_jne_mapping`.
 *   - Setea también `dimension_tematica` (legacy, NOT NULL en DB) con el mismo
 *     valor que `dimension_jne_mapping` para mantener compatibilidad.
 *   - Desactiva (activo=false) cualquier pregunta v1 cuyo orden no esté en el
 *     draft v2 — preserva histórico de answers pero las saca del flujo nuevo.
 *
 * Uso:
 *   pnpm run seed:questions-v2
 *
 * Idempotente: UPSERT por `orden`. Re-ejecutar es seguro.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/supabase/database.types";

type Momento = "pre" | "post" | "both";
type DimCuestionario = "educacion" | "juventud" | "trabajo" | "economia" | "social_publicas";
type DimJne = "social" | "economica" | "ambiental" | "institucional";
type QuestionType = "likert" | "single" | "multiple" | "text" | "ranking" | "comparison";

interface ParsedQuestion {
  orden: number;
  momento: Momento;
  dimension_cuestionario: DimCuestionario;
  dimension_jne_mapping: DimJne;
  tipo: QuestionType;
  enunciado: string;
  opciones: unknown | null;
  fuente: string | null;
}

function parseDraft(content: string): ParsedQuestion[] {
  const blocks = content.split(/^### Pregunta \d+/m).slice(1);
  const questions: ParsedQuestion[] = [];

  for (const block of blocks) {
    const yamlMatch = block.match(/```yaml\s*([\s\S]*?)```/);
    if (!yamlMatch?.[1]) continue;

    const yaml = yamlMatch[1];
    const orden = Number(yaml.match(/orden:\s*(\d+)/)?.[1]);
    const momento = yaml.match(/momento:\s*(\w+)/)?.[1] as Momento | undefined;
    const dimCues = yaml.match(/dimension_cuestionario:\s*(\w+)/)?.[1] as DimCuestionario | undefined;
    const dimJne = yaml.match(/dimension_jne_mapping:\s*(\w+)/)?.[1] as DimJne | undefined;
    const tipo = yaml.match(/tipo:\s*(\w+)/)?.[1] as QuestionType | undefined;
    const fuenteMatch = yaml.match(/fuente:\s*"([^"]+)"/);

    if (!orden || !momento || !dimCues || !dimJne || !tipo) continue;

    const enunciadoMatch = block.match(/\*\*Enunciado\*\*:\s*(.+?)(?=\n\n|\n\*\*)/s);
    const enunciado = enunciadoMatch?.[1]?.trim();
    if (!enunciado) continue;

    let opciones: unknown | null = null;

    if (tipo === "likert") {
      const escalaSection = block.match(/\*\*Escala \(1-5\)\*\*[\s\S]*?(?=\n###|\n---|$)/);
      if (escalaSection) {
        const items: { value: number; label: string }[] = [];
        for (const m of escalaSection[0].matchAll(/^- (\d):\s*(.+)$/gm)) {
          items.push({ value: Number(m[1]), label: m[2]!.trim() });
        }
        opciones = { scale: items };
      }
    } else if (tipo === "single" || tipo === "multiple") {
      const optsSection = block.match(/\*\*Opciones \(([^)]+)\)\*\*[\s\S]*?(?=\n###|\n---|$)/);
      if (optsSection) {
        const items: { id: string; label: string }[] = [];
        for (const m of optsSection[0].matchAll(/^- ([A-Z]):\s*(.+)$/gm)) {
          items.push({ id: m[1]!, label: m[2]!.trim() });
        }
        opciones = { choices: items, mode: tipo };
      }
    }

    questions.push({
      orden,
      momento,
      dimension_cuestionario: dimCues,
      dimension_jne_mapping: dimJne,
      tipo,
      enunciado,
      opciones,
      fuente: fuenteMatch?.[1] ?? null,
    });
  }

  return questions;
}

async function main() {
  const draftPath = resolve(process.cwd(), "data/questions/draft_v2.md");
  const content = readFileSync(draftPath, "utf-8");
  const questions = parseDraft(content);

  if (questions.length === 0) {
    console.error("No se pudieron parsear preguntas del draft v2.");
    process.exit(1);
  }

  console.warn(`Parseadas ${questions.length} preguntas v2. Cargando a DB...`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let inserted = 0;
  let updated = 0;

  for (const q of questions) {
    const { data: existing } = await supabase
      .from("questions")
      .select("id")
      .eq("orden", q.orden)
      .maybeSingle();

    const payload = {
      orden: q.orden,
      momento: q.momento,
      dimension_cuestionario: q.dimension_cuestionario,
      dimension_jne_mapping: q.dimension_jne_mapping,
      // dimension_tematica es NOT NULL en el schema v1, lo seteamos al mapping JNE.
      dimension_tematica: q.dimension_jne_mapping,
      tipo: q.tipo,
      enunciado: q.enunciado,
      opciones: q.opciones === null ? null : (q.opciones as never),
      fuente: q.fuente,
      activo: true,
    };

    if (existing) {
      const { error } = await supabase
        .from("questions")
        .update(payload)
        .eq("id", (existing as { id: string }).id);
      if (error) {
        console.error(`Error actualizando orden=${q.orden}: ${error.message}`);
        continue;
      }
      updated++;
    } else {
      const { error } = await supabase.from("questions").insert(payload);
      if (error) {
        console.error(`Error insertando orden=${q.orden}: ${error.message}`);
        continue;
      }
      inserted++;
    }
  }

  // Desactivar preguntas v1 que NO están en el draft v2.
  const ordenesV2 = new Set(questions.map((q) => q.orden));
  const { data: allActive } = await supabase
    .from("questions")
    .select("id, orden")
    .eq("activo", true);

  let deactivated = 0;
  for (const q of (allActive ?? []) as { id: string; orden: number }[]) {
    if (!ordenesV2.has(q.orden)) {
      const { error } = await supabase
        .from("questions")
        .update({ activo: false })
        .eq("id", q.id);
      if (!error) deactivated++;
    }
  }

  console.warn(
    `Listo. Insertadas: ${inserted}, actualizadas: ${updated}, desactivadas v1: ${deactivated}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

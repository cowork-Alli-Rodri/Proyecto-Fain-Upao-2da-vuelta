/**
 * Script CLI: carga el banco inicial de preguntas desde data/questions/draft_v1.md
 * a la tabla `public.questions` vía service-role.
 *
 * Uso:
 *   pnpm run seed:questions
 *
 * Idempotente: hace UPSERT por `orden`. Si el orden ya existe, actualiza los demás
 * campos. Si no existe, inserta. Las preguntas no incluidas en el draft NO se
 * desactivan automáticamente (eso lo hace el admin desde /admin/preguntas).
 *
 * Formato del draft: ver data/questions/draft_v1.md. Cada pregunta tiene un
 * bloque YAML con `orden`, `dimension_tematica`, `tipo`, `fuente`, seguido del
 * enunciado en negrita y una lista de opciones (cuando aplica).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/supabase/database.types";

interface ParsedQuestion {
  orden: number;
  dimension_tematica: "social" | "economica" | "ambiental" | "institucional";
  tipo: "likert" | "single" | "multiple" | "text" | "ranking" | "comparison";
  enunciado: string;
  opciones: unknown | null;
  fuente: string | null;
}

function parseDraft(content: string): ParsedQuestion[] {
  // Cada pregunta empieza con `### Pregunta N`
  const blocks = content.split(/^### Pregunta \d+/m).slice(1);
  const questions: ParsedQuestion[] = [];

  for (const block of blocks) {
    // Extraer bloque YAML entre ```yaml y ```
    const yamlMatch = block.match(/```yaml\s*([\s\S]*?)```/);
    if (!yamlMatch?.[1]) continue;

    const yaml = yamlMatch[1];
    const orden = Number(yaml.match(/orden:\s*(\d+)/)?.[1]);
    const dim = yaml.match(/dimension_tematica:\s*(\w+)/)?.[1];
    const tipo = yaml.match(/tipo:\s*(\w+)/)?.[1];
    const fuenteMatch = yaml.match(/fuente:\s*"([^"]+)"/);

    if (!orden || !dim || !tipo) continue;

    // Enunciado: línea que empieza con `**Enunciado**:`
    const enunciadoMatch = block.match(/\*\*Enunciado\*\*:\s*(.+?)(?=\n\n|\n\*\*)/s);
    const enunciado = enunciadoMatch?.[1]?.trim();
    if (!enunciado) continue;

    // Opciones: dependen del tipo
    let opciones: unknown | null = null;

    if (tipo === "likert") {
      // Bloque `**Escala (1-5)**` seguido de bullets `- N: Label`
      const escalaSection = block.match(/\*\*Escala \(1-5\)\*\*[\s\S]*?(?=\n###|\n---|$)/);
      if (escalaSection) {
        const items: { value: number; label: string }[] = [];
        for (const m of escalaSection[0].matchAll(/^- (\d):\s*(.+)$/gm)) {
          items.push({ value: Number(m[1]), label: m[2]!.trim() });
        }
        opciones = { scale: items };
      }
    } else if (tipo === "single" || tipo === "multiple") {
      // Bloque `**Opciones (...)**` seguido de `- LETRA: texto`
      const optsSection = block.match(/\*\*Opciones \(([^)]+)\)\*\*[\s\S]*?(?=\n###|\n---|$)/);
      if (optsSection) {
        const items: { id: string; label: string }[] = [];
        for (const m of optsSection[0].matchAll(/^- ([A-Z]):\s*(.+)$/gm)) {
          items.push({ id: m[1]!, label: m[2]!.trim() });
        }
        opciones = { choices: items, mode: tipo };
      }
    } else if (tipo === "ranking") {
      // Bloque `**Opciones (ranking ...)**` con `- item` (sin letra/número)
      const optsSection = block.match(/\*\*Opciones \(ranking[^)]*\)\*\*[\s\S]*?(?=\n###|\n---|$)/);
      if (optsSection) {
        const items: string[] = [];
        for (const m of optsSection[0].matchAll(/^- (.+)$/gm)) {
          items.push(m[1]!.trim());
        }
        opciones = { items };
      }
    } else if (tipo === "text") {
      opciones = null;
    } else if (tipo === "comparison") {
      // Estructura libre — el editor del admin lo afina
      opciones = { mode: "comparison" };
    }

    questions.push({
      orden,
      dimension_tematica: dim as ParsedQuestion["dimension_tematica"],
      tipo: tipo as ParsedQuestion["tipo"],
      enunciado,
      opciones,
      fuente: fuenteMatch?.[1] ?? null,
    });
  }

  return questions;
}

async function main() {
  const draftPath = resolve(process.cwd(), "data/questions/draft_v1.md");
  const content = readFileSync(draftPath, "utf-8");
  const questions = parseDraft(content);

  if (questions.length === 0) {
    console.error("No se pudieron parsear preguntas del draft. Verifica el formato.");
    process.exit(1);
  }

  console.warn(`Parseadas ${questions.length} preguntas. Cargando a DB...`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let inserted = 0;
  let updated = 0;

  for (const q of questions) {
    // Verifica si ya existe pregunta con ese orden
    const { data: existing } = await supabase
      .from("questions")
      .select("id")
      .eq("orden", q.orden)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("questions")
        .update({
          dimension_tematica: q.dimension_tematica,
          tipo: q.tipo,
          enunciado: q.enunciado,
          opciones: q.opciones === null ? null : (q.opciones as never),
          fuente: q.fuente,
          activo: true,
        })
        .eq("id", existing.id as string);
      if (error) {
        console.error(`Error actualizando pregunta orden=${q.orden}:`, error.message);
        continue;
      }
      updated++;
    } else {
      const { error } = await supabase.from("questions").insert({
        orden: q.orden,
        dimension_tematica: q.dimension_tematica,
        tipo: q.tipo,
        enunciado: q.enunciado,
        opciones: q.opciones === null ? null : (q.opciones as never),
        fuente: q.fuente,
        activo: true,
      });
      if (error) {
        console.error(`Error insertando pregunta orden=${q.orden}:`, error.message);
        continue;
      }
      inserted++;
    }
  }

  console.warn(`Listo. Insertadas: ${inserted}, actualizadas: ${updated}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

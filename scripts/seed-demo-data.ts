/**
 * Script CLI: genera estudiantes ficticios con respuestas + preferencias para
 * que el dashboard del docente tenga datos al revisarlo.
 *
 * Uso (solo en desarrollo local):
 *   pnpm tsx scripts/seed-demo-data.ts --count 40
 *
 * Crea usuarios reales en auth.users vía admin API. Sus correos siguen el
 * patrón `demo-NNNN@voto-informado.test`. Limpia los demo previos antes de
 * crear nuevos para evitar acumulación.
 *
 * SEGURO: el script aborta si detecta que está corriendo contra un URL
 * que no sea localhost (no usar en producción).
 */

import { createClient } from "@supabase/supabase-js";

import { FACULTADES, CARRERAS_POR_FACULTAD } from "../lib/constants/upao";
import type { Database } from "../lib/supabase/database.types";

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getArg(name: string): string | null {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

const NOMBRES = [
  "Ana",
  "Carlos",
  "María",
  "Luis",
  "Karen",
  "José",
  "Sofía",
  "Diego",
  "Valeria",
  "Andrés",
  "Camila",
  "Mateo",
  "Lucía",
  "Sebastián",
  "Isabella",
  "Daniel",
  "Mariana",
  "Joaquín",
];
const APELLIDOS = [
  "Vásquez",
  "Torres",
  "Rodríguez",
  "García",
  "Pérez",
  "Sánchez",
  "Muñoz",
  "Rojas",
  "Castro",
  "Herrera",
  "Quispe",
  "Mendoza",
  "Ríos",
  "Salazar",
  "Cruz",
  "Vega",
  "Cabrera",
  "Lozano",
];

const RANGOS = ["18-19", "20-22", "23-25", "26+"] as const;
const GENEROS = ["femenino", "masculino", "otro", "prefiero_no_decir"] as const;

const MOTIVOS = [
  "Su plan en seguridad ciudadana me parece más concreto.",
  "Me convencen sus propuestas sobre transparencia y lucha anticorrupción.",
  "Su enfoque en educación pública me parece prioritario.",
  "Veo más coherencia entre problema, objetivo y meta en su plan.",
  "Me genera más confianza su trayectoria.",
  "Aún tengo dudas, pero esta opción se acerca más a mi posición.",
  "No me convence ninguno por completo.",
  null,
  null,
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const allowCloud = process.argv.includes("--allow-cloud");
  const isLocal = url.includes("127.0.0.1") || url.includes("localhost");

  if (!isLocal && !allowCloud) {
    console.error("ABORT: detectada URL de Supabase Cloud:", url);
    console.error("       Para sembrar demos en Cloud (testing previo a entrega) usa el flag");
    console.error("       --allow-cloud. Los demos quedan identificados por correo");
    console.error("       demo-NNNN@voto-informado.test y se limpian con pnpm run seed:demo:clean.");
    process.exit(1);
  }
  if (!isLocal && allowCloud) {
    console.warn("⚠  Sembrando datos demo en Supabase CLOUD (--allow-cloud activo).");
    console.warn("   URL:", url);
  }

  const supabase = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const countStr = getArg("count") ?? "40";
  const count = Math.max(5, Math.min(200, Number(countStr) || 40));

  console.warn(`Generando ${count} estudiantes demo en Supabase local...`);

  // 1. Limpiar demos previos
  console.warn("Limpiando demos previos...");
  const { data: existingProfiles } = await supabase
    .from("profiles")
    .select("id")
    .like("email", "demo-%@voto-informado.test");
  if (existingProfiles && existingProfiles.length > 0) {
    for (const p of existingProfiles as { id: string }[]) {
      await supabase.auth.admin.deleteUser(p.id);
    }
  }

  // 2. Fetch preguntas activas
  const { data: questionsData } = await supabase
    .from("questions")
    .select("id, enunciado, dimension_tematica, tipo, opciones")
    .eq("activo", true)
    .order("orden");
  const questions = (questionsData ?? []) as Array<{
    id: string;
    enunciado: string;
    dimension_tematica: "social" | "economica" | "ambiental" | "institucional";
    tipo: "likert" | "single" | "multiple" | "text" | "ranking" | "comparison";
    opciones: unknown;
  }>;

  if (questions.length === 0) {
    console.error("No hay preguntas activas. Corre `pnpm seed:questions` primero.");
    process.exit(1);
  }

  let created = 0;

  for (let i = 0; i < count; i++) {
    const num = String(i + 1).padStart(4, "0");
    const email = `demo-${num}@voto-informado.test`;
    const password = "demo-password-1234";

    const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userErr || !userData.user) {
      console.error(`Error creando usuario ${email}:`, userErr?.message);
      continue;
    }

    const userId = userData.user.id;
    const nombres = pick(NOMBRES);
    const apellidos = pick(APELLIDOS);
    const facultad = pick(FACULTADES);
    const carreras = CARRERAS_POR_FACULTAD[facultad];
    const carrera = pick(carreras);
    const ciclo = randomInt(1, 14);
    const rango_edad = pick(RANGOS);
    const genero = Math.random() > 0.2 ? pick(GENEROS) : null;

    // Update profile
    const completedAt = new Date(
      Date.now() - randomInt(0, 14) * 24 * 60 * 60 * 1000,
    ).toISOString();

    await supabase
      .from("profiles")
      .update({
        nombres,
        apellidos,
        facultad,
        carrera,
        ciclo,
        rango_edad,
        genero,
        current_step: questions.length,
        questionnaire_completed_at: completedAt,
      })
      .eq("id", userId);

    // Consent
    await supabase.from("consent_events").insert({
      user_id: userId,
      accepted_terms_at: completedAt,
      accepted_data_use_at: completedAt,
      consent_version: "v1",
    });

    // Respuestas
    for (const q of questions) {
      let valor: unknown;
      if (q.tipo === "likert") {
        valor = { value: randomInt(1, 5) };
      } else if (q.tipo === "single") {
        const opts = (q.opciones as { choices?: { id: string }[] })?.choices ?? [];
        valor = { value: opts.length > 0 ? pick(opts).id : "A" };
      } else if (q.tipo === "multiple") {
        const opts = (q.opciones as { choices?: { id: string }[] })?.choices ?? [];
        const picked = opts
          .filter(() => Math.random() < 0.4)
          .map((o) => o.id);
        valor = { values: picked.length > 0 ? picked : opts.slice(0, 1).map((o) => o.id) };
      } else if (q.tipo === "text") {
        valor = { text: "Respuesta de demo." };
      } else if (q.tipo === "ranking") {
        const items = (q.opciones as { items?: string[] })?.items ?? [];
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        valor = { order: shuffled };
      } else {
        valor = { keiko: randomInt(1, 5), roberto: randomInt(1, 5) };
      }
      await supabase.from("answers").insert({
        student_id: userId,
        question_id: q.id,
        valor: valor as never,
        question_snapshot: q.enunciado,
        dimension_snapshot: q.dimension_tematica,
        tipo_snapshot: q.tipo,
        momento_snapshot: "pre",
      });
    }

    // 75% declara preferencia
    if (Math.random() < 0.75) {
      const candidatos = ["keiko", "roberto", "indeciso"] as const;
      const weights = [0.45, 0.40, 0.15];
      const r = Math.random();
      let candidato: (typeof candidatos)[number] = "indeciso";
      let acc = 0;
      for (let j = 0; j < candidatos.length; j++) {
        acc += weights[j]!;
        if (r < acc) {
          candidato = candidatos[j]!;
          break;
        }
      }
      await supabase.from("preferences").insert({
        student_id: userId,
        candidato_preferido: candidato,
        confianza: randomInt(3, 10),
        motivo: pick(MOTIVOS),
        submitted_at: completedAt,
      });
    }

    created++;
    if (created % 10 === 0) console.warn(`  ${created}/${count}...`);
  }

  console.warn(`Listo. ${created} estudiantes demo creados con respuestas y preferencias.`);
  console.warn("Para limpiar después: pnpm tsx scripts/seed-demo-data.ts --count 0 (limpia y no crea).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

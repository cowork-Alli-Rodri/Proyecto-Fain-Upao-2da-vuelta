/**
 * Script CLI: añade un correo a la whitelist `allowed_teachers`.
 *
 * Uso:
 *   pnpm run add-teacher -- --email docente@upao.edu.pe --note "Curso Política 2026-I"
 *
 * Si el correo ya tiene un `profiles` row con rol student, lo eleva a teacher.
 * Si no existe profile, queda en la whitelist y el trigger
 * `on_auth_user_created` lo elevará automáticamente cuando inicie sesión.
 *
 * Útil para preparar accesos antes de que el docente entre por primera vez.
 */

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/supabase/database.types";

function getArg(name: string): string | null {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const emailRaw = getArg("email");
  const note = getArg("note");

  if (!emailRaw) {
    console.error(
      'Uso: pnpm run add-teacher -- --email <correo> [--note "texto"]',
    );
    process.exit(1);
  }

  const email = emailRaw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    console.error("Correo inválido.");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await supabase
    .from("allowed_teachers")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    console.warn(`Ya estaba habilitado: ${email}.`);
    return;
  }

  const { error: insErr } = await supabase
    .from("allowed_teachers")
    .insert({ email, note: note ?? null });
  if (insErr) {
    console.error("Error insertando en allowed_teachers:", insErr.message);
    process.exit(1);
  }

  const { error: updErr } = await supabase
    .from("profiles")
    .update({ role: "teacher" })
    .eq("email", email)
    .eq("role", "student");
  if (updErr) {
    console.error("Profile encontrado pero no se pudo elevar el rol:", updErr.message);
    process.exit(1);
  }

  console.warn(`OK: ${email} habilitado como docente.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

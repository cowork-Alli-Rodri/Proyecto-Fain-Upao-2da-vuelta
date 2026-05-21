/**
 * Script CLI: promueve un usuario existente a teacher o admin.
 *
 * Uso:
 *   pnpm tsx scripts/promote-user.ts --email rodrigo@ejemplo.com --role admin
 *   pnpm tsx scripts/promote-user.ts --email docente@upao.edu.pe --role teacher
 *
 * El usuario debe haberse registrado primero vía /login (signup).
 * Si rol=teacher, también lo agrega a allowed_teachers para que en futuros logins
 * conserve el rol.
 */

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/supabase/database.types";

function getArg(name: string): string | null {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const email = getArg("email");
  const role = getArg("role");

  if (!email || !role) {
    console.error("Uso: pnpm tsx scripts/promote-user.ts --email <correo> --role <teacher|admin>");
    process.exit(1);
  }

  if (role !== "teacher" && role !== "admin") {
    console.error("Rol inválido. Usa 'teacher' o 'admin'.");
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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("Error buscando profile:", error.message);
    process.exit(1);
  }

  if (!profile) {
    console.error(`No se encontró un usuario con correo ${email}. Primero debe registrarse en /login.`);
    process.exit(1);
  }

  const p = profile as { id: string; email: string | null; role: string };

  const { error: upErr } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", p.id);

  if (upErr) {
    console.error("Error actualizando rol:", upErr.message);
    process.exit(1);
  }

  if (role === "teacher") {
    await supabase
      .from("allowed_teachers")
      .upsert(
        { email: email.toLowerCase(), note: "Promovido vía CLI" },
        { onConflict: "email" },
      );
  }

  console.warn(`OK: ${email} (${p.role}) → ${role}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

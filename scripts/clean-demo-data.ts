/**
 * Script CLI: elimina todos los estudiantes demo creados por seed-demo-data.ts.
 *
 * Uso:
 *   pnpm run seed:demo:clean
 *
 * Identifica los demos por el patrón de correo `demo-NNNN@voto-informado.test`.
 * Borra de `auth.users` (lo cual cascadea a profiles → answers → preferences
 * → consent_events vía las foreign keys con ON DELETE CASCADE).
 *
 * Funciona tanto contra Supabase local como contra Cloud (no requiere flag —
 * borrar demos siempre es seguro).
 */

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/supabase/database.types";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.warn(`Buscando estudiantes demo en ${url}...`);

  const { data: demos } = await supabase
    .from("profiles")
    .select("id, email")
    .like("email", "demo-%@voto-informado.test");

  const list = (demos ?? []) as Array<{ id: string; email: string | null }>;

  if (list.length === 0) {
    console.warn("No hay datos demo para limpiar.");
    return;
  }

  console.warn(`Encontrados ${list.length} estudiantes demo. Borrando...`);

  let deleted = 0;
  for (const profile of list) {
    const { error } = await supabase.auth.admin.deleteUser(profile.id);
    if (error) {
      console.error(`  ✗ ${profile.email}: ${error.message}`);
      continue;
    }
    deleted++;
  }

  console.warn(`OK · ${deleted}/${list.length} estudiantes demo eliminados.`);
  console.warn(
    "Sus respuestas, preferencias y eventos de consentimiento se borraron en cascada.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

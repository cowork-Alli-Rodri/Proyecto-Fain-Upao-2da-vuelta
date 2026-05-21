import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Cliente Supabase con SERVICE_ROLE.
 *
 * **NUNCA exponer al cliente.** Bypassa RLS — uso restringido a:
 *  - Cron handlers (`app/api/cron/*`)
 *  - Server actions de admin que necesitan ignorar RLS para tareas operativas
 *    (refresh JNE, anonimización, gestión de allowed_teachers)
 *  - Scripts CLI (`scripts/*`)
 *
 * Comprueba al inicio que está corriendo en server (process en undefined si
 * estás en navegador) para falla en caliente si alguien lo importa mal.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient solo puede usarse en server-side.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Cliente Supabase para Client Components.
 *
 * Usado en componentes `"use client"` que necesitan suscripciones realtime,
 * subscripciones a cambios de auth, o queries que dependen de interacción
 * del usuario en el navegador.
 *
 * Para RSC y Server Actions usa `lib/supabase/server.ts`.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

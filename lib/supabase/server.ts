import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";

/**
 * Cliente Supabase para React Server Components y Server Actions.
 *
 * Maneja la sesión mediante las cookies de Next.js. El `set/remove` envuelve
 * cualquier error porque RSC no permite mutar cookies — solo Server Actions
 * y Route Handlers pueden. En esos casos el refresh ocurre desde middleware.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `setAll` puede ser llamado desde un RSC. Lo ignoramos silenciosamente:
            // el middleware refresca la sesión en cada request, así que no hay
            // pérdida funcional.
          }
        },
      },
    },
  );
}

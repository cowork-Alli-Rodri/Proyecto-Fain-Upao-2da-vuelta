import Link from "next/link";

import { resolveStudentResumePath } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const PRIMARY_BTN =
  "inline-flex min-h-[44px] items-center rounded-full border border-white/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-[var(--color-navy-upao)] sm:px-5";
const LOGOUT_LINK =
  "font-mono text-[0.65rem] uppercase tracking-[0.18em] text-white/75 transition hover:text-white sm:text-[0.7rem] sm:tracking-[0.2em]";

/**
 * Nav del header de la landing, sensible a la sesión.
 *  - Sin sesión → "Ingresar" (/login).
 *  - Con sesión → botón al área que le corresponde + "Cerrar sesión".
 *
 * El destino lo decide `resolveStudentResumePath` — la misma función que usa el
 * callback de auth — así el botón nunca contradice a dónde te mandaría un login:
 *    /admin     → admin                       → "Admin"
 *    /dashboard → docente                     → "Docente"
 *    /cierre    → estudiante que ya terminó    → sin botón (solo cerrar sesión)
 *    otro       → estudiante en curso          → "Continuar" a su paso pendiente
 */
export async function LandingHeaderNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link href="/login" className={PRIMARY_BTN}>
        Ingresar
      </Link>
    );
  }

  const dest = await resolveStudentResumePath(user.id);
  const primary =
    dest === "/admin"
      ? { href: "/admin", label: "Admin" }
      : dest === "/dashboard"
        ? { href: "/dashboard", label: "Docente" }
        : dest === "/cierre" || dest === "/login"
          ? null
          : { href: dest, label: "Continuar" };

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {primary ? (
        <Link href={primary.href} className={PRIMARY_BTN}>
          {primary.label}
        </Link>
      ) : null}
      {/* <a> nativo (no <Link>): fuerza navegación completa para que el signout
          server-side limpie cookies y la landing se re-renderice sin sesión. Con
          <Link> el router client-side reusa el RSC cacheado y el header no cambia. */}
      <a href="/auth/signout" className={LOGOUT_LINK}>
        Cerrar sesión
      </a>
    </div>
  );
}

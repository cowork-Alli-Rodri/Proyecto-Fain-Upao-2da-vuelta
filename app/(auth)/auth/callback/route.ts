import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { resolveStudentResumePath } from "@/lib/auth/session";

/**
 * Auth callback unificado.
 *
 * Maneja dos casos:
 *   1. OAuth (Google/Microsoft) → llega con `?code=...` PKCE → intercambia
 *      el código por sesión, valida consentimiento y resume.
 *   2. Email + password → ya tiene cookies de sesión (las puso
 *      `signInWithPassword` en el cliente). Sin `code`. Saltamos el exchange
 *      y vamos directo a validar consentimiento + resume.
 *
 * Si llega un visitante sin code y sin sesión, vuelve a /login.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Ni code ni sesión preexistente — el usuario llegó acá por error.
    return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(next)}`);
  }

  // Verifica consentimiento. Si no aceptó → /consent.
  const { data: consent } = await supabase
    .from("consent_events")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!consent) {
    return NextResponse.redirect(`${origin}/consent?next=${encodeURIComponent(next)}`);
  }

  // Resume al step correcto (perfil incompleto, cuestionario, encuesta final...).
  // Si el caller pasó `?next=` apuntando a una ruta válida del flujo, respetamos
  // su intención sobre la resolución por defecto.
  const resumePath = await resolveStudentResumePath(user.id);
  const finalPath = next && next !== "/" && next.startsWith("/") ? next : resumePath;
  return NextResponse.redirect(`${origin}${finalPath}`);
}

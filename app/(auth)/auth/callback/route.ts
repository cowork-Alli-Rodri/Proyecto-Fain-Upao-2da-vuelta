import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { resolveStudentResumePath } from "@/lib/auth/session";

/**
 * OAuth callback (FR-001).
 *
 * Recibe el `code` de PKCE flow, lo intercambia por sesión, y redirige
 * al estudiante al paso del flujo donde quedó (FR-010, edge case sesión 24h).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
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

  // Resume al step correcto (perfil incompleto, cuestionario, comparador...)
  const resumePath = await resolveStudentResumePath(user.id);
  return NextResponse.redirect(`${origin}${resumePath}`);
}

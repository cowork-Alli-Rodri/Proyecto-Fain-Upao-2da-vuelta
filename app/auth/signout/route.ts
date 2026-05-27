import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Endpoint para cerrar sesión. Soporta GET (uso simple desde un enlace) y
 * POST (con CSRF protection via mismo origen). Cierra la sesión de Supabase
 * y redirige a la home.
 */
async function handleSignOut(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = new URL(request.url);
  return NextResponse.redirect(`${url.origin}/`, { status: 303 });
}

export async function GET(request: Request) {
  return handleSignOut(request);
}

export async function POST(request: Request) {
  return handleSignOut(request);
}

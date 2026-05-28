import { type NextRequest, NextResponse } from "next/server";

import { createMiddlewareClient } from "@/lib/supabase/middleware";

const STUDENT_ONLY_PATHS = [
  "/cuestionario",
  "/cuestionario-pre",
  "/cuestionario-post",
  "/preferencia",
  "/cierre",
  "/encuesta-final",
];
const TEACHER_ADMIN_PATHS = ["/dashboard"];
const ADMIN_ONLY_PATHS = ["/admin"];
const PUBLIC_PATHS = [
  "/",
  "/como-funciona",
  "/candidatos",
  "/no-te-dejes-sorprender",
  "/inicio",
  "/login",
  "/docente",
  "/auth/callback",
  "/auth/signout",
  "/consent",
  "/profile",
];

// Auto-logout duro: cualquier sesión con más de 8h de antigüedad se cierra.
// El timestamp `auth_at` se escribe la primera vez que el middleware ve a un
// usuario autenticado sin cookie previa, y se compara en cada request.
const AUTH_TTL_MS = 8 * 60 * 60 * 1000;
const AUTH_AT_COOKIE = "vi_auth_at";

export async function proxy(request: NextRequest) {
  // Server Actions de Next.js 16 (header Next-Action) y cualquier POST/PUT/DELETE:
  // skip TOTAL del middleware. NextResponse.next() aún crea un response que puede
  // interferir con los headers RSC del Server Action y disparar E394
  // "An unexpected response was received from the server". Retornar undefined
  // hace que Next.js continúe el chain directo al handler sin pasar por aquí.
  if (
    request.headers.get("next-action") ||
    (request.method !== "GET" && request.method !== "HEAD")
  ) {
    return undefined;
  }

  const { supabase, response } = createMiddlewareClient(request);
  const { pathname } = request.nextUrl;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // No autenticado en ruta protegida → /login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Si está autenticado:
  if (user) {
    // 0) Auto-logout 8h
    const authAtRaw = request.cookies.get(AUTH_AT_COOKIE)?.value;
    const authAt = authAtRaw ? Number(authAtRaw) : null;
    const now = Date.now();

    if (authAt && Number.isFinite(authAt) && now - authAt > AUTH_TTL_MS) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("reason", "session_expired");
      if (!isPublic) url.searchParams.set("next", pathname);
      const expired = NextResponse.redirect(url);
      expired.cookies.delete(AUTH_AT_COOKIE);
      return expired;
    }

    if (!authAt || !Number.isFinite(authAt)) {
      response.cookies.set(AUTH_AT_COOKIE, String(now), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: AUTH_TTL_MS / 1000,
      });
    }

    // 1) Role-gating — tolerante a fallos de DB. Si el query a profiles
    // falla (RLS, network, race condition con el trigger handle_new_user),
    // dejamos pasar al usuario. Las páginas server-side validan de nuevo.
    let role: "student" | "teacher" | "admin" | undefined;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      role = (data as { role?: "student" | "teacher" | "admin" } | null)?.role;
    } catch {
      role = undefined;
    }
    // Si no pudimos resolver el rol, no aplicamos role-gating en este request.
    if (!role) return response;

    const needsTeacher = TEACHER_ADMIN_PATHS.some((p) => pathname.startsWith(p));
    const needsAdmin = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
    const needsStudent = STUDENT_ONLY_PATHS.some((p) => pathname.startsWith(p));

    if (needsAdmin && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    if (needsTeacher && role !== "teacher" && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/cierre";
      return NextResponse.redirect(url);
    }
    if (needsStudent && role !== "student") {
      // Teacher/admin no necesitan ver el flujo de estudiante. Redirige a dashboard.
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public files in app/
     * - api routes (manejan auth por sí mismos)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icon|apple-icon|api|pixart|candidates|parties|brand).*)",
  ],
};

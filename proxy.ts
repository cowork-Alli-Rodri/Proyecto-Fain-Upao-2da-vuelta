import { type NextRequest, NextResponse } from "next/server";

import { createMiddlewareClient } from "@/lib/supabase/middleware";

const STUDENT_ONLY_PATHS = ["/cuestionario", "/comparador", "/preferencia", "/cierre"];
const TEACHER_ADMIN_PATHS = ["/dashboard"];
const ADMIN_ONLY_PATHS = ["/admin"];
const PUBLIC_PATHS = [
  "/",
  "/como-funciona",
  "/login",
  "/auth/callback",
  "/consent",
  "/profile",
];

export async function proxy(request: NextRequest) {
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

  // Si está autenticado, leer el rol para gatekeeping
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = (data as { role?: "student" | "teacher" | "admin" } | null)?.role;

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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api).*)",
  ],
};

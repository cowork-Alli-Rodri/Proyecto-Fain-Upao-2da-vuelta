import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandBar, BrandMark } from "@/components/brand/BrandMark";
import { TeacherLoginCard } from "./_components/TeacherLoginCard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Acceso docente",
  description:
    "Acceso al panel del docente para revisar el análisis del curso. Solo correos habilitados por la administración.",
};

export default async function DocenteAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si ya hay sesión, decide a dónde mandarlo según el rol.
  let currentRole: "student" | "teacher" | "admin" | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    currentRole = (data as { role?: typeof currentRole } | null)?.role ?? null;

    if (currentRole === "teacher" || currentRole === "admin") {
      redirect("/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandBar />
            <BrandMark context="Voto Informado e Instruido" hideContextOnMobile />
          </Link>
          <Link
            href="/login"
            className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] transition hover:text-[var(--color-navy-upao)] sm:text-[0.7rem] sm:tracking-[0.2em]"
          >
            ¿Eres estudiante? →
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:gap-16 lg:py-20">
        {/* Columna izquierda: contexto */}
        <aside className="space-y-6 lg:col-span-5">
          <div className="space-y-3">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-orange-upao)] sm:text-[0.7rem] sm:tracking-[0.22em]">
              Acceso del docente
            </p>
            <div className="h-px w-12 bg-[var(--color-orange-upao)]" aria-hidden />
          </div>
          <h1 className="font-display text-[clamp(1.875rem,4.5vw,3rem)] font-medium leading-[1.05] text-balance text-[var(--color-navy-upao)]">
            Panel del curso.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-[var(--color-graphite)]">
            Acceso restringido a los correos habilitados por la administración
            del curso. Tras iniciar sesión verás el dashboard con el análisis
            agregado de tus estudiantes.
          </p>

          <div className="space-y-3 rounded-2xl border-l-2 border-[var(--color-orange-upao)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-orange-upao)]">
              Importante
            </p>
            <p className="text-sm leading-relaxed text-[var(--color-graphite)]">
              Si tu correo no ha sido habilitado, contacta a la administración.
              Crear una cuenta aquí no te dará acceso automático al panel — solo
              correos en la whitelist son elevados a rol docente.
            </p>
          </div>
        </aside>

        {/* Columna derecha: form */}
        <div className="lg:col-span-7">
          <TeacherLoginCard
            currentUserEmail={user?.email ?? null}
            currentRole={currentRole}
          />
        </div>
      </section>
    </main>
  );
}

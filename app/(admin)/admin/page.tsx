import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminShell } from "@/app/(admin)/_components/AdminShell";
import { CicloCierreForm } from "@/components/admin/CicloCierreForm";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/role";
import { getJneFreshness } from "@/lib/jne/cache";

export const metadata: Metadata = { title: "Admin · FAIN-UPAO Voto Informado" };

export default async function AdminHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isAdmin())) redirect("/");

  const [
    { count: totalQuestions },
    { count: activeQuestions },
    { count: teachersCount },
    { data: settings },
    freshness,
  ] = await Promise.all([
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("activo", true),
    supabase.from("allowed_teachers").select("email", { count: "exact", head: true }),
    supabase.from("app_settings").select("ciclo_cierre_at").eq("id", 1).maybeSingle(),
    getJneFreshness(),
  ]);

  const cierreAt = (settings as { ciclo_cierre_at: string | null } | null)?.ciclo_cierre_at ?? null;
  const jneStat = freshness.lastSuccessAt
    ? freshness.isStale
      ? "Atrasado · revisar"
      : "Sincronizado"
    : "Sin refresh aún";

  return (
    <AdminShell
      kicker="Panel administrativo"
      title="Operación del producto"
      description="Edita el banco de preguntas, gestiona los docentes con acceso al dashboard y supervisa el ciclo electoral en curso."
    >
      {/* Acceso directo al dashboard del curso — destacado */}
      <Link
        href="/dashboard"
        className="group mb-8 flex items-center justify-between gap-4 rounded-2xl border-2 border-[var(--color-orange-upao)] bg-gradient-to-br from-[color-mix(in_oklch,var(--color-orange-upao)_8%,white)] to-white p-6 transition hover:shadow-[var(--shadow-soft)]"
      >
        <div className="space-y-1">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-orange-upao)]">
            Dashboard del curso
          </p>
          <h2 className="font-display text-2xl text-[var(--color-navy-upao)]">
            Ver el análisis de los estudiantes
          </h2>
          <p className="text-sm text-[var(--color-graphite)]">
            KPIs, distribución de preferencias, cross-tab por carrera, evolución
            temporal. Y exportar en 4 formatos.
          </p>
        </div>
        <span
          aria-hidden
          className="hidden text-2xl text-[var(--color-orange-upao)] transition-transform group-hover:translate-x-1 sm:inline"
        >
          →
        </span>
      </Link>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <SectionCard
          href="/admin/preguntas"
          kicker="Banco de preguntas"
          title="Editar cuestionario"
          stat={`${activeQuestions ?? 0} activas · ${totalQuestions ?? 0} totales`}
          description="Crear, editar, reordenar y desactivar preguntas. Si editas una pregunta, las respuestas que ya enviaron los estudiantes conservan el texto original."
        />
        <SectionCard
          href="/admin/teachers"
          kicker="Docentes con acceso"
          title="Gestionar docentes"
          stat={`${teachersCount ?? 0} docentes habilitados`}
          description="Añadir o remover correos institucionales. Al iniciar sesión con ese correo, el sistema reconoce al usuario como docente automáticamente."
        />
        <SectionCard
          href="/admin/jne"
          kicker="JNE · Sincronización"
          title="Mantenimiento de datos"
          stat={jneStat}
          description="Actualizar manualmente los datos del JNE o revisar el historial. Si el JNE falla, los estudiantes siguen viendo la última versión válida."
        />
      </div>

      <section className="mt-12 space-y-5">
        <header className="flex items-baseline gap-3">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
            Ciclo electoral
          </span>
          <h2 className="font-display text-2xl font-medium text-[var(--color-navy-upao)]">
            Cierre del ciclo
          </h2>
        </header>
        <p className="max-w-2xl text-sm text-[var(--color-graphite)]">
          Una vez configurada esta fecha, 12 meses después el sistema borra
          automáticamente correos, nombres y apellidos de los estudiantes.
          Las cifras anónimas se mantienen para análisis pedagógico.
        </p>
        <CicloCierreForm initial={cierreAt} />
      </section>
    </AdminShell>
  );
}

function SectionCard({
  href,
  kicker,
  title,
  stat,
  description,
}: {
  href: string;
  kicker: string;
  title: string;
  stat: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-navy-upao)]"
    >
      <p className="editorial-kicker">{kicker}</p>
      <h2 className="font-display text-2xl text-[var(--color-navy-upao)]">{title}</h2>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-cyan-deep)]">
        {stat}
      </p>
      <p className="text-sm leading-relaxed text-[var(--color-graphite)]">{description}</p>
      <span className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-navy-upao)] group-hover:underline">
        Entrar →
      </span>
    </Link>
  );
}

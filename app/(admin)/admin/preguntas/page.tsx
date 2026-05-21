import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminShell } from "@/app/(admin)/_components/AdminShell";
import { Button } from "@/components/ui/button";
import { QuestionList, type QuestionRow } from "@/components/admin/QuestionList";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/role";
import {
  DIMENSION_LABEL,
  DIMENSION_VALUES,
  type DimensionTematica,
} from "@/lib/validation/question.schema";

export const metadata: Metadata = { title: "Banco de preguntas · Admin" };

type ActivoFilter = "todas" | "activas" | "inactivas";
type DimensionFilter = "todas" | DimensionTematica;

function isDimensionFilter(v: string | undefined): v is DimensionFilter {
  return v === "todas" || (DIMENSION_VALUES as readonly string[]).includes(v ?? "");
}

function isActivoFilter(v: string | undefined): v is ActivoFilter {
  return v === "todas" || v === "activas" || v === "inactivas";
}

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isAdmin())) redirect("/");

  const sp = await searchParams;
  const dimensionParam = sp.dimension;
  const activoParam = sp.activo;

  const dimension: DimensionFilter = isDimensionFilter(dimensionParam) ? dimensionParam : "todas";
  const activo: ActivoFilter = isActivoFilter(activoParam) ? activoParam : "todas";

  let query = supabase
    .from("questions")
    .select("id, orden, dimension_tematica, tipo, enunciado, activo")
    .order("orden", { ascending: true });

  if (dimension !== "todas") {
    query = query.eq("dimension_tematica", dimension);
  }
  if (activo === "activas") query = query.eq("activo", true);
  if (activo === "inactivas") query = query.eq("activo", false);

  const { data } = await query;
  const rows = (data ?? []) as QuestionRow[];

  const totalActive = rows.filter((r) => r.activo).length;
  const totalInactive = rows.length - totalActive;

  return (
    <AdminShell
      kicker="Banco de preguntas"
      title="Banco editable del cuestionario"
      description="Gestiona las preguntas que ven los estudiantes. El historial de respuestas anteriores se conserva intacto aunque edites el enunciado: cada respuesta guarda el texto que el estudiante leyó."
      actions={
        <Link href="/admin/preguntas/nueva">
          <Button>Crear pregunta</Button>
        </Link>
      }
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--color-graphite)]">
            <span>Filtros:</span>
            <FilterPill
              href={buildHref({ dimension: "todas", activo })}
              active={dimension === "todas"}
            >
              Todas las dimensiones
            </FilterPill>
            {DIMENSION_VALUES.map((d) => (
              <FilterPill
                key={d}
                href={buildHref({ dimension: d, activo })}
                active={dimension === d}
              >
                {DIMENSION_LABEL[d]}
              </FilterPill>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--color-graphite)]">
            <FilterPill
              href={buildHref({ dimension, activo: "todas" })}
              active={activo === "todas"}
            >
              Todas
            </FilterPill>
            <FilterPill
              href={buildHref({ dimension, activo: "activas" })}
              active={activo === "activas"}
            >
              Activas
            </FilterPill>
            <FilterPill
              href={buildHref({ dimension, activo: "inactivas" })}
              active={activo === "inactivas"}
            >
              Inactivas
            </FilterPill>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-[var(--color-muted-foreground)]">
          <span>
            <strong className="text-[var(--color-ink)]">{rows.length}</strong> preguntas
          </span>
          <span>
            <strong className="text-[var(--color-ink)]">{totalActive}</strong> activas
          </span>
          <span>
            <strong className="text-[var(--color-ink)]">{totalInactive}</strong> inactivas
          </span>
        </div>

        <QuestionList rows={rows} />
      </div>
    </AdminShell>
  );
}

function buildHref({
  dimension,
  activo,
}: {
  dimension: DimensionFilter;
  activo: ActivoFilter;
}): string {
  const params = new URLSearchParams();
  if (dimension !== "todas") params.set("dimension", dimension);
  if (activo !== "todas") params.set("activo", activo);
  const qs = params.toString();
  return qs ? `/admin/preguntas?${qs}` : "/admin/preguntas";
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 transition-colors ${
        active
          ? "border-[var(--color-navy-upao)] bg-[var(--color-navy-upao)] text-[var(--color-paper)]"
          : "border-[var(--color-border)] text-[var(--color-graphite)] hover:border-[var(--color-navy-upao)] hover:text-[var(--color-navy-upao)]"
      }`}
    >
      {children}
    </Link>
  );
}

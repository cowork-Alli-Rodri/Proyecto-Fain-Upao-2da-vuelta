import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminShell } from "@/app/(admin)/_components/AdminShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth/role";

export const metadata: Metadata = { title: "Fact checks" };

interface FactCheckRow {
  id: string;
  titular_falso: string;
  status: "draft" | "published" | "archived";
  fact_checker_name: string;
  candidato_relacionado: string | null;
  published_at: string | null;
  updated_at: string;
}

export default async function AdminFactChecksPage() {
  if (!(await isAdmin())) redirect("/login");

  const supabase = createAdminClient();
  const { data: fcRows } = await supabase
    .from("fact_checks" as never)
    .select(
      "id, titular_falso, status, fact_checker_name, candidato_relacionado, published_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  const factChecks = (fcRows ?? []) as FactCheckRow[];

  const counts = {
    draft: factChecks.filter((f) => f.status === "draft").length,
    published: factChecks.filter((f) => f.status === "published").length,
    archived: factChecks.filter((f) => f.status === "archived").length,
  };

  return (
    <AdminShell
      kicker="No te dejes sorprender"
      title="Fact checks"
      description="Curaduría humana de desinformación verificada por medios reconocidos. Los borradores no son visibles para los estudiantes."
      actions={
        <Link
          href="/admin/fact-checks/nueva"
          className="inline-flex items-center rounded-full bg-[var(--color-navy-upao)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)]"
        >
          + Nuevo fact-check
        </Link>
      }
    >
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Borradores" value={counts.draft} accent="var(--color-graphite)" />
        <Stat
          label="Publicados"
          value={counts.published}
          accent="var(--color-mint-success)"
        />
        <Stat
          label="Archivados"
          value={counts.archived}
          accent="var(--color-orange-upao)"
        />
      </div>

      {/* Aviso: sugerencias manuales descontinuadas */}
      <section className="mt-10 rounded-2xl border-l-2 border-[var(--color-cyan-deep)] bg-[var(--color-surface)] p-5">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-cyan-deep)]">
          Cambio de flujo
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-foreground)]">
          El formulario de sugerencias en{" "}
          <Link
            href="/no-te-dejes-sorprender"
            className="text-[var(--color-navy-upao)] underline-offset-4 hover:underline"
          >
            /no-te-dejes-sorprender
          </Link>{" "}
          fue reemplazado por un verificador automático conectado a Google Fact
          Check Tools. Los estudiantes ya no envían reportes manuales; consultan
          en vivo el índice global de fact-checkers. Esta sección sigue activa
          para que el equipo del curso publique fact-checks curados
          manualmente.
        </p>
      </section>

      {/* Listado fact-checks */}
      <section className="mt-10 space-y-4">
        <h2 className="font-display text-xl font-medium text-[var(--color-navy-upao)]">
          Todos los fact-checks
        </h2>

        {factChecks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-2)] p-6 text-sm text-[var(--color-graphite)]">
            Todavía no hay fact-checks creados. Comienza con un nuevo borrador.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            {factChecks.map((f) => (
              <li key={f.id} className="flex items-start gap-4 p-4 sm:p-5">
                <span
                  className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      f.status === "published"
                        ? "var(--color-mint-success)"
                        : f.status === "draft"
                          ? "var(--color-graphite)"
                          : "var(--color-orange-upao)",
                  }}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <Link
                    href={`/admin/fact-checks/${f.id}`}
                    className="block text-sm font-medium text-[var(--color-foreground)] hover:text-[var(--color-navy-upao)]"
                  >
                    {f.titular_falso}
                  </Link>
                  <p className="text-xs text-[var(--color-graphite)]">
                    {f.fact_checker_name}
                    {f.candidato_relacionado ? ` · ${f.candidato_relacionado}` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                  {f.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em]" style={{ color: accent }}>
        {label}
      </p>
      <p className="mt-2 font-display text-4xl font-medium" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

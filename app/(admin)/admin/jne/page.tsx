import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/app/(admin)/_components/AdminShell";
import { JneRefreshPanel } from "@/components/admin/JneRefreshPanel";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/role";
import { getJneFreshness, listJneRefreshLog } from "@/lib/jne/cache";

export const metadata: Metadata = { title: "JNE · Admin" };

const TRIGGER_LABEL: Record<string, string> = {
  cron: "Automático",
  admin: "Manual",
};

const STATUS_LABEL: Record<string, string> = {
  success: "Éxito",
  partial: "Parcial",
  failed: "Falló",
  running: "En curso",
};

const STATUS_COLOR: Record<string, string> = {
  success: "var(--color-mint-success)",
  partial: "var(--color-mango-sun)",
  failed: "var(--color-coral-pulse)",
  running: "var(--color-cyan-deep)",
};

export default async function AdminJnePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isAdmin())) redirect("/");

  const [freshness, logEntries] = await Promise.all([
    getJneFreshness(),
    listJneRefreshLog(20),
  ]);

  return (
    <AdminShell
      kicker="Mantenimiento JNE"
      title="Sincronización con el Jurado Nacional de Elecciones"
      description="Los planes de gobierno se actualizan automáticamente cada día. Si el JNE no responde, los estudiantes siguen viendo la última versión válida."
      actions={<JneRefreshPanel />}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard
          kicker="Último refresh exitoso"
          value={formatRelative(freshness.lastSuccessAt)}
          hint={formatAbsolute(freshness.lastSuccessAt)}
          warning={freshness.isStale}
        />
        <StatCard
          kicker="Último intento"
          value={
            freshness.lastAttemptStatus
              ? STATUS_LABEL[freshness.lastAttemptStatus] ?? freshness.lastAttemptStatus
              : "—"
          }
          hint={formatAbsolute(freshness.lastAttemptAt)}
        />
        <StatCard
          kicker="Candidatos sync"
          value={formatAbsolute(freshness.candidatesLastSynced)}
          hint="last_synced_at de la fila más reciente"
        />
      </div>

      <section className="mt-12 space-y-5">
        <header className="flex items-baseline gap-3">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
            Bitácora
          </span>
          <h2 className="font-display text-2xl font-medium text-[var(--color-navy-upao)]">
            Últimas {logEntries.length} ejecuciones
          </h2>
        </header>

        {logEntries.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-muted-foreground)]">
            Aún no hay registros. Usa el botón Refrescar ahora o espera la
            primera actualización automática.
          </p>
        ) : (
          <div
            data-lenis-prevent
            className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-paper)]/60">
                <tr className="text-left font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)]">
                  <th className="px-4 py-3">Inicio</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Candidatos</th>
                  <th className="px-4 py-3 text-right">Dimensiones</th>
                  <th className="px-4 py-3">Duración</th>
                  <th className="px-4 py-3">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {logEntries.map((row) => {
                  const finished = row.finished_at ? new Date(row.finished_at) : null;
                  const started = new Date(row.started_at);
                  // Math.abs porque el reloj de Postgres (started_at via NOW())
                  // y el reloj de Node (finished_at via Date.now().toISOString())
                  // tienen skew de hasta unos segundos.
                  const durationMs = finished
                    ? Math.abs(finished.getTime() - started.getTime())
                    : null;
                  return (
                    <tr key={row.id} className="text-[var(--color-ink)]">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--color-graphite)]">
                        {formatAbsolute(row.started_at)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {TRIGGER_LABEL[row.triggered_by] ?? row.triggered_by}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block rounded-full px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-paper)]"
                          style={{
                            backgroundColor:
                              STATUS_COLOR[row.status] ?? "var(--color-graphite)",
                          }}
                        >
                          {STATUS_LABEL[row.status] ?? row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {row.candidates_updated}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {row.dimensions_updated}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--color-graphite)]">
                        {durationMs !== null
                          ? `${Math.round(durationMs / 100) / 10}s`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-muted-foreground)]">
                        {row.error_message ? (
                          <span title={row.error_message}>
                            {row.error_message.length > 80
                              ? `${row.error_message.slice(0, 80)}…`
                              : row.error_message}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}

function StatCard({
  kicker,
  value,
  hint,
  warning,
}: {
  kicker: string;
  value: string;
  hint?: string | null;
  warning?: boolean;
}) {
  return (
    <div
      className={`rounded-md border bg-[var(--color-surface)] p-5 ${
        warning
          ? "border-[var(--color-mango-sun)]/60"
          : "border-[var(--color-border)]"
      }`}
    >
      <p className="editorial-kicker">{kicker}</p>
      <p className="mt-3 font-display text-2xl text-[var(--color-navy-upao)]">{value}</p>
      {hint ? (
        <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-graphite)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function formatAbsolute(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-PE", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Nunca";
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return "En el futuro";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Hace unos segundos";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} días`;
}

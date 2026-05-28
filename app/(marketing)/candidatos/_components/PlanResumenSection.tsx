import { JNE_FINALISTAS } from "@/lib/jne/types";
import { createAdminClient } from "@/lib/supabase/admin";

import { CANDIDATOS, type CandidatoSlug } from "./candidatos-data";

/**
 * Resumen oficial del plan de gobierno (colapsable, simétrico por candidato).
 *
 * Muestra el texto `candidates.plan_resumen` tal cual lo publica el JNE
 * (votoinformadoia) — sin parafraseo ni edición, respetando la regla de
 * neutralidad del proyecto. Para el detalle completo enlaza al PDF oficial.
 *
 * Usa `<details>`/`<summary>` nativos: colapsable accesible y sin JavaScript.
 */
export async function PlanResumenSection() {
  let keikoResumen: string | null = null;
  let robertoResumen: string | null = null;

  try {
    const sb = createAdminClient();
    const { data } = await sb
      .from("candidates")
      .select("id, plan_resumen")
      .in("id", [JNE_FINALISTAS.keiko.idHojaVida, JNE_FINALISTAS.roberto.idHojaVida]);
    const byId = new Map(
      ((data ?? []) as Array<{ id: number; plan_resumen: string | null }>).map((r) => [
        r.id,
        r.plan_resumen,
      ]),
    );
    keikoResumen = byId.get(JNE_FINALISTAS.keiko.idHojaVida) ?? null;
    robertoResumen = byId.get(JNE_FINALISTAS.roberto.idHojaVida) ?? null;
  } catch {
    return null;
  }

  // Si el JNE aún no devolvió resumen para ninguno, no renderizamos la sección.
  if (!keikoResumen && !robertoResumen) return null;

  const resumenes: Record<CandidatoSlug, string | null> = {
    keiko: keikoResumen,
    roberto: robertoResumen,
  };

  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] py-10 sm:py-14">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
        <div className="space-y-3">
          <p className="editorial-kicker">Plan de gobierno · resumen oficial</p>
          <h2 className="font-display text-2xl text-[var(--color-navy-upao)] sm:text-3xl">
            Qué propone cada candidatura, en resumen
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-graphite)]">
            Resumen oficial del Jurado Nacional de Elecciones (JNE), tal como fue
            publicado — sin recortes ni interpretación nuestra. Toca cada nombre
            para desplegarlo. Para leer el plan completo, abre el PDF oficial.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {(["keiko", "roberto"] as CandidatoSlug[]).map((slug) => {
            const c = CANDIDATOS[slug];
            const resumen = resumenes[slug];
            return (
              <details
                key={slug}
                className="group overflow-hidden rounded-2xl border-2 bg-white shadow-[var(--shadow-soft)] [&_summary]:list-none"
                style={{ borderColor: `color-mix(in oklch, var(${c.accentVar}) 35%, transparent)` }}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4">
                  <span className="flex flex-col">
                    <span className="font-display text-base font-medium text-[var(--color-navy-upao)] sm:text-lg">
                      {c.displayName}
                    </span>
                    <span
                      className="font-mono text-[0.65rem] uppercase tracking-[0.18em]"
                      style={{ color: `var(${c.accentVar})` }}
                    >
                      {c.partyName}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 text-xl text-[var(--color-graphite)] transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="space-y-4 border-t border-[var(--color-border)] px-5 py-4">
                  {resumen ? (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-foreground)]">
                      {resumen}
                    </p>
                  ) : (
                    <p className="text-sm italic text-[var(--color-muted-foreground)]">
                      El JNE aún no publicó el resumen de esta candidatura. Revisa el
                      plan completo en el PDF oficial.
                    </p>
                  )}
                  <a
                    href={c.planPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-cyan-deep)] hover:underline"
                  >
                    Plan de gobierno completo (PDF JNE)
                    <span aria-hidden>↗</span>
                  </a>
                </div>
              </details>
            );
          })}
        </div>

        <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
          Fuente: Jurado Nacional de Elecciones — plataforma oficial de Voto
          Informado. Esta plataforma no edita ni interpreta el contenido de los planes.
        </p>
      </div>
    </section>
  );
}

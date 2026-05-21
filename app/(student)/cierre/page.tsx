import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Gracias" };

const CANDIDATO_LABEL: Record<string, string> = {
  keiko: "Keiko Fujimori",
  roberto: "Roberto Sánchez",
  indeciso: "Indeciso/a",
};

const CANDIDATO_COLOR: Record<string, string> = {
  keiko: "var(--color-candidate-keiko)",
  roberto: "var(--color-candidate-roberto)",
  indeciso: "var(--color-graphite)",
};

export default async function CierrePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: preference }, { count: answerCount }] = await Promise.all([
    supabase
      .from("preferences")
      .select("candidato_preferido, confianza, submitted_at")
      .eq("student_id", user.id)
      .maybeSingle(),
    supabase
      .from("answers")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id),
  ]);

  const pref = preference as
    | { candidato_preferido: string; confianza: number; submitted_at: string }
    | null;

  if (!pref) redirect("/preferencia");

  const candColor = CANDIDATO_COLOR[pref.candidato_preferido] ?? "var(--color-graphite)";

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="block h-6 w-1 bg-[var(--color-navy-upao)]" aria-hidden />
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
              UPAO · Voto Informado
            </p>
          </Link>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-mint-success)]">
            Completado
          </p>
        </div>
      </header>

      <section className="border-b border-[var(--color-border)] py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="space-y-6">
            <p className="editorial-kicker text-[var(--color-mint-success)]">
              Tu participación está registrada
            </p>
            <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1] tracking-tight text-[var(--color-navy-upao)]">
              Gracias por tu tiempo.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-[var(--color-graphite)]">
              Has completado el flujo. El docente del curso analizará los resultados de forma
              agregada y anonimizada. Tu nombre no aparecerá en ningún reporte público.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-3">
            <Stat
              kicker="Respuestas"
              label="Preguntas enviadas"
              value={String(answerCount ?? 0).padStart(2, "0")}
              accent="var(--color-navy-upao)"
              mono
            />
            <Stat
              kicker="Preferencia"
              label="Tu candidato/a"
              value={CANDIDATO_LABEL[pref.candidato_preferido] ?? "—"}
              accent={candColor}
            />
            <Stat
              kicker="Confianza"
              label="Nivel declarado"
              value={`${pref.confianza}/10`}
              accent="var(--color-cyan-deep)"
              mono
            />
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="space-y-6 rounded-2xl border-l-2 border-[var(--color-cyan-deep)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-soft)]">
            <p className="editorial-kicker">Tus derechos</p>
            <p className="text-base leading-relaxed text-[var(--color-foreground)]">
              Puedes solicitar el borrado completo de tus datos personales en cualquier momento.
              Tus respuestas se conservarán de forma anónima para el análisis pedagógico.
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Si tienes dudas sobre el estudio o el manejo de tus datos, contacta al docente del
              curso.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({
  kicker,
  label,
  value,
  accent,
  mono,
}: {
  kicker: string;
  label: string;
  value: string;
  accent: string;
  mono?: boolean;
}) {
  return (
    <article className="space-y-4 bg-[var(--color-surface)] p-8">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: accent }}>
        {kicker}
      </p>
      <p
        className={
          mono
            ? "font-mono text-[clamp(2.5rem,5vw,4rem)] font-medium leading-none"
            : "font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-tight"
        }
        style={{ color: accent }}
      >
        {value}
      </p>
      <p className="text-sm text-[var(--color-muted-foreground)]">{label}</p>
    </article>
  );
}

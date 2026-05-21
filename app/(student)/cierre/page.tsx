import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Gracias" };

const CANDIDATO_LABEL: Record<string, string> = {
  keiko: "Keiko Fujimori",
  roberto: "Roberto Sánchez",
  indeciso: "Indeciso/a",
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

  return (
    <main className="min-h-screen bg-[var(--background)] py-16 px-4">
      <div className="mx-auto max-w-2xl space-y-10 text-center">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-[var(--color-mint-success)]">
            Listo
          </p>
          <h1 className="font-display text-4xl text-[var(--color-navy-upao)]">
            Gracias por participar
          </h1>
          <p className="text-base text-[var(--color-smoke)]">
            Tu participación queda registrada. El docente del curso analizará los resultados de
            forma agregada y anonimizada.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-[var(--radius-card)] border border-[color-mix(in_oklch,var(--color-navy-upao)_15%,transparent)] bg-white p-6 text-left shadow-sm sm:grid-cols-3">
          <Stat label="Respuestas enviadas" value={answerCount ?? 0} />
          <Stat label="Preferencia declarada" value={CANDIDATO_LABEL[pref.candidato_preferido] ?? "—"} />
          <Stat label="Confianza" value={`${pref.confianza} / 10`} mono />
        </div>

        <p className="text-xs text-[var(--color-smoke)]">
          Si deseas solicitar el borrado de tus datos personales, puedes hacerlo en cualquier
          momento conforme a la Ley N° 29733.
        </p>
      </div>
    </main>
  );
}

function Stat({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-widest text-[var(--color-smoke)]">{label}</p>
      <p
        className={
          mono
            ? "font-mono text-2xl text-[var(--color-navy-upao)]"
            : "font-display text-2xl text-[var(--color-navy-upao)]"
        }
      >
        {value}
      </p>
    </div>
  );
}

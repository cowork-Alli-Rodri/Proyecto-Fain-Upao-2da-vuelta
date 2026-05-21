import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConsentForm } from "./_components/ConsentForm";
import { AuthShell } from "../_components/AuthShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Consentimiento informado",
};

export default async function ConsentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("consent_events")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (existing) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("facultad")
      .eq("id", user.id)
      .single();
    redirect(
      (profile as { facultad?: string | null } | null)?.facultad
        ? "/cuestionario"
        : "/profile",
    );
  }

  const { data: settings } = await supabase
    .from("app_settings")
    .select("consent_version")
    .eq("id", 1)
    .single();
  const version = (settings as { consent_version?: string } | null)?.consent_version ?? "v1";

  return (
    <AuthShell
      step={1}
      total={2}
      kicker="Consentimiento informado · Ley 29733"
      title={"Antes de empezar, sepamos en qué estás de acuerdo."}
      description="Lee con calma. Solo necesitamos lo mínimo para que el docente analice tendencias por facultad y carrera. Sin DNI, sin teléfono, sin dirección."
      aside={
        <ConsentSummary />
      }
    >
      <ConsentForm consentVersion={version} />
    </AuthShell>
  );
}

function ConsentSummary() {
  return (
    <div className="space-y-4 rounded-2xl border-l-2 border-[var(--color-cyan-deep)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
      <p className="editorial-kicker">Resumen rápido</p>
      <dl className="space-y-4 text-sm">
        <Item k="Qué se guarda">
          Nombre, apellido, correo, facultad, carrera, ciclo, rango de edad, género opcional.
          Tus respuestas y tu preferencia final.
        </Item>
        <Item k="Por cuánto tiempo">
          PII se conserva máximo <strong className="font-mono">12 meses</strong> después del
          cierre del ciclo. Anonimización irreversible después.
        </Item>
        <Item k="Quién la lee">
          Solo el docente del curso, en forma agregada. Tú nunca ves los datos de otros.
        </Item>
        <Item k="Borrado a pedido">
          En cualquier momento desde tu perfil. Conforme a la Ley N° 29733.
        </Item>
      </dl>
    </div>
  );
}

function Item({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <dt className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--color-muted-foreground)]">
        {k}
      </dt>
      <dd className="leading-relaxed text-[var(--color-foreground)]">{children}</dd>
    </div>
  );
}

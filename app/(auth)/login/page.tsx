import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginCard } from "./_components/LoginCard";
import { AuthShell } from "../_components/AuthShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ingresar",
  description: "Inicia sesión para acceder a Voto Informado UPAO.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/cuestionario");
  }

  return (
    <AuthShell
      kicker="Acceso · Segunda Vuelta 2026"
      title={
        "Ingresa con tu cuenta institucional, personal o tu correo."
      }
      description="Tu participación es académica y privada. Tratamos tus datos personales con consentimiento explícito y los anonimizamos al cierre del ciclo."
      aside={
        <div className="space-y-4 rounded-2xl border-l-2 border-[var(--color-cyan-deep)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
          <p className="editorial-kicker">Cómo continúa</p>
          <ol className="space-y-3 text-sm text-[var(--color-graphite)]">
            <li className="flex gap-3">
              <span className="font-mono text-xs text-[var(--color-cyan-deep)]">01</span>
              <span>Aceptas el consentimiento informado.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-[var(--color-cyan-deep)]">02</span>
              <span>Completas tu perfil (facultad, carrera, ciclo).</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-[var(--color-cyan-deep)]">03</span>
              <span>Respondes 12 preguntas con auto-guardado.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-[var(--color-cyan-deep)]">04</span>
              <span>Exploras el comparador del JNE y declaras tu preferencia.</span>
            </li>
          </ol>
        </div>
      }
    >
      <LoginCard nextPath={params.next ?? "/"} initialError={params.error ?? null} />
    </AuthShell>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConsentForm } from "./_components/ConsentForm";
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

  // Si ya aceptó, sigue al perfil/cuestionario
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
    redirect((profile as { facultad?: string | null } | null)?.facultad ? "/cuestionario" : "/profile");
  }

  const { data: settings } = await supabase
    .from("app_settings")
    .select("consent_version")
    .eq("id", 1)
    .single();
  const version = (settings as { consent_version?: string } | null)?.consent_version ?? "v1";

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-[var(--color-smoke)]">
            Paso 1 de 2
          </p>
          <h1 className="font-display text-3xl text-[var(--color-navy-upao)]">
            Consentimiento informado
          </h1>
          <p className="text-sm text-[var(--color-smoke)]">
            Antes de continuar, lee y acepta los términos. Cumple la Ley N° 29733 — Protección
            de Datos Personales del Perú.
          </p>
        </header>

        <article className="prose prose-sm max-w-none rounded-[var(--radius-card)] border border-[color-mix(in_oklch,var(--color-navy-upao)_15%,transparent)] bg-white p-6 text-sm leading-relaxed text-[var(--color-ink)] shadow-sm">
          <h2 className="font-display text-xl text-[var(--color-navy-upao)]">Sobre el estudio</h2>
          <p>
            Voto Informado UPAO es una plataforma académica del docente del curso para
            estudiantes de pregrado de la Universidad Privada Antenor Orrego. Su objetivo es
            analizar las preferencias declaradas por los estudiantes tras explorar los planes
            oficiales del JNE de los candidatos de la Segunda Vuelta Electoral 2026.
          </p>

          <h2 className="font-display text-xl text-[var(--color-navy-upao)]">Qué se recoge</h2>
          <ul>
            <li>Nombres y apellidos, correo, facultad, carrera, ciclo, rango de edad y género (opcional).</li>
            <li>Tus respuestas al cuestionario.</li>
            <li>La preferencia final que declares (candidato, nivel de confianza, motivo).</li>
            <li>Eventos anónimos de uso (qué pantallas visitas, sin identificarte).</li>
          </ul>

          <h2 className="font-display text-xl text-[var(--color-navy-upao)]">Plazo de conservación</h2>
          <p>
            Tus datos personales se conservarán únicamente por un máximo de{" "}
            <strong>12 meses</strong> después del cierre del ciclo académico. Pasado ese plazo
            serán <strong>anonimizados de forma irreversible</strong>: tus respuestas se
            mantendrán solo en forma agregada y sin posibilidad de vincularse a tu identidad.
          </p>

          <h2 className="font-display text-xl text-[var(--color-navy-upao)]">Tus derechos</h2>
          <p>
            Puedes solicitar el borrado completo de tus datos en cualquier momento desde tu
            perfil. Tienes derecho a acceder, rectificar y oponerte al tratamiento conforme a la
            Ley N° 29733.
          </p>

          <h2 className="font-display text-xl text-[var(--color-navy-upao)]">Neutralidad</h2>
          <p>
            Esta plataforma <strong>no emite recomendaciones de voto</strong>. El comparador
            muestra los datos oficiales del JNE sin filtros editoriales.
          </p>
        </article>

        <ConsentForm consentVersion={version} />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileForm } from "./_components/ProfileForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tu perfil académico",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Si no aceptó consentimiento, mandarlo allá primero
  const { data: consent } = await supabase
    .from("consent_events")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!consent) redirect("/consent");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombres, apellidos, facultad, carrera, ciclo, rango_edad, genero")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-[var(--color-smoke)]">
            Paso 2 de 2
          </p>
          <h1 className="font-display text-3xl text-[var(--color-navy-upao)]">
            Tu perfil académico
          </h1>
          <p className="text-sm text-[var(--color-smoke)]">
            Estos datos nos permiten al docente analizar las respuestas agregadas por facultad
            y carrera. No solicitamos DNI, dirección ni teléfono.
          </p>
        </header>

        <ProfileForm
          defaults={(profile as Partial<{
            nombres: string;
            apellidos: string;
            facultad: string;
            carrera: string;
            ciclo: number;
            rango_edad: string;
            genero: string | null;
          }> | null) ?? {}}
        />
      </div>
    </main>
  );
}

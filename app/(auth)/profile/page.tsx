import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileForm } from "./_components/ProfileForm";
import { AuthShell } from "../_components/AuthShell";
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
    <AuthShell
      step={2}
      total={2}
      kicker="Perfil académico"
      title="Cuéntanos lo justo. Nada de DNI ni teléfono."
      description="Estos datos permiten al docente analizar las respuestas agregadas por facultad y carrera. Tu información personal queda protegida por RLS y se anonimiza después del ciclo."
    >
      <ProfileForm
        defaults={
          (profile as Partial<{
            nombres: string;
            apellidos: string;
            facultad: string;
            carrera: string;
            ciclo: number;
            rango_edad: string;
            genero: string | null;
          }> | null) ?? {}
        }
      />
    </AuthShell>
  );
}


import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginCard } from "./_components/LoginCard";
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
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--background)]">
      <div className="w-full max-w-md space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="font-display text-4xl text-[var(--color-navy-upao)]">
            Voto Informado UPAO
          </h1>
          <p className="text-sm text-[var(--color-smoke)]">
            Plataforma académica · Segunda Vuelta Electoral 2026
          </p>
        </header>
        <LoginCard nextPath={params.next ?? "/"} initialError={params.error ?? null} />
        <p className="text-center text-xs text-[var(--color-smoke)]">
          Al ingresar aceptas que tus datos serán tratados según la Ley N° 29733.
          <br />
          Esta plataforma no emite recomendaciones de voto.
        </p>
      </div>
    </main>
  );
}

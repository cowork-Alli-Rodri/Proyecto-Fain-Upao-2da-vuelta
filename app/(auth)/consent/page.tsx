import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsentForm } from "./_components/ConsentForm";
import { BrandBar, BrandMark } from "@/components/brand/BrandMark";
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
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <BrandBar />
            <BrandMark context="Segunda Vuelta 2026" hideContextOnMobile />
          </Link>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] sm:text-[0.7rem] sm:tracking-[0.2em]">
            Paso 1 de 2
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 space-y-2">
          <p className="editorial-kicker">Consentimiento informado</p>
          <h1 className="font-display text-[clamp(1.5rem,4vw,2.25rem)] font-medium leading-tight text-[var(--color-navy-upao)]">
            Antes de empezar, sepamos en qué estás de acuerdo.
          </h1>
        </div>

        <ConsentForm consentVersion={version} />
      </section>
    </main>
  );
}

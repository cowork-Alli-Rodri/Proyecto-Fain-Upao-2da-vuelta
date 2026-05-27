import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandBar, BrandMark } from "@/components/brand/BrandMark";
import { SignOutLink } from "@/components/brand/SignOutLink";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nombres, apellidos")
    .eq("id", user.id)
    .single();
  const p = profile as { role: string; nombres: string | null; apellidos: string | null } | null;

  if (!p || (p.role !== "teacher" && p.role !== "admin")) {
    redirect("/cierre");
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <BrandBar />
            <BrandMark
              prefix="Dashboard"
              context={p.role === "admin" ? "Admin" : "Docente"}
              hideContextOnMobile
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="hidden font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-graphite)] transition hover:text-[var(--color-navy-upao)] sm:inline-flex"
              title="Volver al sitio público"
            >
              ← Inicio
            </Link>
            <Link
              href="/dashboard/export"
              className="hidden min-h-[40px] items-center rounded-full border border-[var(--color-navy-upao)] px-4 py-1.5 text-xs font-medium text-[var(--color-navy-upao)] transition hover:bg-[var(--color-navy-upao)] hover:text-white sm:inline-flex sm:text-sm"
            >
              Exportar
            </Link>
            <p className="hidden text-sm text-[var(--color-graphite)] md:block">
              {p.nombres ?? ""} {p.apellidos ?? ""}
            </p>
            <SignOutLink />
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

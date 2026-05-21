import Link from "next/link";
import { redirect } from "next/navigation";

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
            <span className="block h-6 w-1 bg-[var(--color-navy-upao)]" aria-hidden />
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] sm:text-[0.7rem] sm:tracking-[0.2em]">
              Dashboard · {p.role === "admin" ? "Admin" : "Docente"}
            </p>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/dashboard/export"
              className="hidden min-h-[40px] items-center rounded-full border border-[var(--color-navy-upao)] px-4 py-1.5 text-xs font-medium text-[var(--color-navy-upao)] transition hover:bg-[var(--color-navy-upao)] hover:text-white sm:inline-flex sm:text-sm"
            >
              Exportar
            </Link>
            <p className="hidden text-sm text-[var(--color-graphite)] md:block">
              {p.nombres ?? ""} {p.apellidos ?? ""}
            </p>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

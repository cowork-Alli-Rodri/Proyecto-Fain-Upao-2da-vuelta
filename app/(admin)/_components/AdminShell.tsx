import Link from "next/link";
import type { ReactNode } from "react";

import { BrandBar, BrandMark } from "@/components/brand/BrandMark";
import { SignOutLink } from "@/components/brand/SignOutLink";

/**
 * Layout consistente para todas las páginas de admin. Mantiene el header
 * editorial UPAO + un kicker + título grande en serif Cormorant, igual que
 * el resto del producto.
 */
export function AdminShell({
  kicker,
  title,
  description,
  actions,
  children,
}: {
  kicker: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/admin" className="flex items-center gap-3">
            <BrandBar />
            <BrandMark context="Admin" hideContextOnMobile />
          </Link>
          <nav className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-graphite)]">
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:text-[var(--color-navy-upao)]"
              title="Volver al sitio público"
            >
              <span aria-hidden>←</span> Inicio
            </Link>
            <span className="text-[var(--color-mist)]" aria-hidden>
              ·
            </span>
            <Link
              href="/dashboard"
              className="font-semibold text-[var(--color-orange-upao)] hover:underline"
            >
              Dashboard
            </Link>
            <span className="text-[var(--color-mist)]" aria-hidden>
              ·
            </span>
            <Link href="/admin/preguntas" className="hover:text-[var(--color-navy-upao)]">
              Preguntas
            </Link>
            <Link href="/admin/fact-checks" className="hover:text-[var(--color-navy-upao)]">
              Fact checks
            </Link>
            <Link href="/admin/teachers" className="hover:text-[var(--color-navy-upao)]">
              Docentes
            </Link>
            <Link href="/admin/jne" className="hover:text-[var(--color-navy-upao)]">
              JNE
            </Link>
            <span className="text-[var(--color-mist)]" aria-hidden>
              ·
            </span>
            <SignOutLink />
          </nav>
        </div>
      </header>

      <section className="border-b border-[var(--color-border)] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="space-y-3">
              <p className="editorial-kicker">{kicker}</p>
              <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.05] tracking-tight text-[var(--color-navy-upao)]">
                {title}
              </h1>
              {description ? (
                <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-graphite)] sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">{children}</div>
    </main>
  );
}

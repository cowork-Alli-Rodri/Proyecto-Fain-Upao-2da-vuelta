import Link from "next/link";
import type { ReactNode } from "react";

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
            <span
              className="block h-6 w-1 bg-[var(--color-navy-upao)] sm:h-7"
              aria-hidden
            />
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] sm:text-[0.7rem] sm:tracking-[0.2em]">
              <span className="hidden sm:inline">UPAO · </span>Admin
            </p>
          </Link>
          <nav className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-graphite)]">
            <Link href="/admin/preguntas" className="hover:text-[var(--color-navy-upao)]">
              Preguntas
            </Link>
            <Link href="/admin/teachers" className="hover:text-[var(--color-navy-upao)]">
              Docentes
            </Link>
            <Link href="/admin/jne" className="hover:text-[var(--color-navy-upao)]">
              JNE
            </Link>
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

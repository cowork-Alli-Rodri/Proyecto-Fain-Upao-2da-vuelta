import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Layout dos columnas para flujos de auth (login, consent, profile).
 * Izquierda: contexto editorial + kicker + ilustración mínima.
 * Derecha: formulario.
 *
 * Inspiración: MIT Election Lab, Stripe checkout, Linear signup.
 */
export function AuthShell({
  step,
  total,
  kicker,
  title,
  description,
  aside,
  children,
}: {
  step?: number;
  total?: number;
  kicker: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="block h-8 w-1 bg-[var(--color-navy-upao)]" aria-hidden />
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
              UPAO · Voto Informado
            </p>
          </Link>
          {step && total ? (
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
              Paso {step} de {total}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
        {/* Columna izquierda: contexto editorial */}
        <aside className="space-y-8 lg:col-span-5">
          <div className="space-y-3">
            <p className="editorial-kicker">{kicker}</p>
            <div className="editorial-rule" />
          </div>
          <h1 className="font-display text-[clamp(2.25rem,4vw,3.5rem)] font-medium leading-[1.05] text-[var(--color-navy-upao)]">
            {title}
          </h1>
          {description ? (
            <p className="max-w-md text-base leading-relaxed text-[var(--color-graphite)]">
              {description}
            </p>
          ) : null}
          {aside}
        </aside>

        {/* Columna derecha: formulario */}
        <section className="lg:col-span-7">{children}</section>
      </div>
    </main>
  );
}

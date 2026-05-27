import Link from "next/link";
import type { ReactNode } from "react";

import { BrandBar, BrandMark } from "@/components/brand/BrandMark";
import { SignOutLink } from "@/components/brand/SignOutLink";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

/**
 * Layout dos columnas para flujos de auth (login, consent, profile).
 * Izquierda: contexto editorial + kicker. Derecha: formulario.
 * En mobile (sm-) stackea verticalmente; el form va primero el contexto.
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
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandBar />
            <BrandMark context="Voto Informado e Instruido" hideContextOnMobile />
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="hidden font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] transition hover:text-[var(--color-navy-upao)] sm:inline-flex sm:text-[0.7rem] sm:tracking-[0.2em]"
              title="Volver al sitio público"
            >
              ← Inicio
            </Link>
            {step && total ? (
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] sm:text-[0.7rem] sm:tracking-[0.2em]">
                Paso {step} de {total}
              </p>
            ) : null}
            <SignOutLink />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
        {/* Columna izquierda: contexto editorial */}
        <aside className="space-y-7 lg:col-span-5">
          <ScrollReveal direction="fade">
            <div className="space-y-3">
              <p className="editorial-kicker">{kicker}</p>
              <div className="editorial-rule" />
            </div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.05}>
            <h1 className="font-display text-[clamp(1.875rem,4.5vw,3rem)] font-medium leading-[1.05] text-balance text-[var(--color-navy-upao)]">
              {title}
            </h1>
          </ScrollReveal>
          {description ? (
            <ScrollReveal direction="up" delay={0.1}>
              <p className="max-w-md text-base leading-relaxed text-[var(--color-graphite)]">
                {description}
              </p>
            </ScrollReveal>
          ) : null}
          {aside ? (
            <ScrollReveal direction="up" delay={0.15}>
              {aside}
            </ScrollReveal>
          ) : null}
        </aside>

        {/* Columna derecha: formulario */}
        <ScrollReveal direction="up" delay={0.1} className="lg:col-span-7">
          {children}
        </ScrollReveal>
      </div>
    </main>
  );
}

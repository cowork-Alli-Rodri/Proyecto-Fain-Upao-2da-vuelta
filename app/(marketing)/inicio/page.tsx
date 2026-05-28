import type { Metadata } from "next";
import Link from "next/link";

import { BrandBar, BrandMark } from "@/components/brand/BrandMark";
import { MagneticButton } from "@/components/landing/MagneticButton";
import { GsapHeroReveal } from "@/components/motion/GsapHeroReveal";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

import { HeroVideo } from "./_components/HeroVideo";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: "Inicio · Analiza y decide bien",
  description:
    "Primero tu postura, después los planes oficiales del JNE de Fuerza Popular y Juntos por el Perú, al final tu decisión informada. Sin opiniones nuestras.",
};

export default function InicioPage() {
  return (
    <>
      <ScrollProgress />
      <main className="min-h-screen bg-[var(--color-background)]">
        {/* HEADER */}
        <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
            <Link href="/" className="flex items-center gap-3">
              <BrandBar className="h-7 sm:h-8" />
              <BrandMark context="Voto Informado e Instruido" hideContextOnMobile />
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] transition hover:text-[var(--color-navy-upao)] sm:inline sm:text-[0.7rem] sm:tracking-[0.2em]"
              >
                ← Volver
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--color-navy-upao)] px-4 py-2 text-sm font-medium text-[var(--color-navy-upao)] transition hover:bg-[var(--color-navy-upao)] hover:text-white sm:px-5"
              >
                Ingresar
              </Link>
            </div>
          </div>
        </header>

        {/* HERO — video pixart como protagonista; texto compacto al costado */}
        <section className="relative overflow-hidden border-b border-[var(--color-border)]">
          <div className="mx-auto grid max-w-[1500px] grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:gap-14 lg:py-20">
            {/* Video grande — ocupa la mayoría del hero */}
            <div className="order-1 lg:order-2 lg:col-span-8">
              <ScrollReveal direction="left" delay={0.1}>
                <HeroVideo />
              </ScrollReveal>
            </div>

            {/* Texto compacto al costado */}
            <div className="order-2 space-y-6 lg:order-1 lg:col-span-4">
              <ScrollReveal direction="fade">
                <div className="space-y-3">
                  <p className="editorial-kicker">Segunda Vuelta · Perú · 2026</p>
                  <div className="editorial-rule" />
                </div>
              </ScrollReveal>

              <GsapHeroReveal className="font-display text-[clamp(1.875rem,3.6vw,3.25rem)] font-medium leading-[1] tracking-tight text-[var(--color-navy-upao)]">
                <h1 className="m-0">
                  <span className="block">Primero tu postura.</span>
                  <span className="block">Después los planes.</span>
                  <span className="block italic text-[var(--color-orange-upao)]">
                    Al final, tu decisión.
                  </span>
                </h1>
              </GsapHeroReveal>

              <ScrollReveal direction="up" delay={0.2}>
                <p className="text-sm leading-relaxed text-[var(--color-graphite)] sm:text-base">
                  Respondes 12 preguntas con tu postura, revisas los planes
                  oficiales de <strong>Fuerza Popular</strong> y{" "}
                  <strong>Juntos por el Perú</strong>, y decides con información
                  — no con impulso.
                </p>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.3}>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <MagneticButton href="/login" variant="primary">
                    Comenzar →
                  </MagneticButton>
                  <Link
                    href="/como-funciona"
                    className="inline-flex min-h-[44px] items-center text-sm font-medium text-[var(--color-graphite)] underline-offset-4 hover:underline"
                  >
                    Cómo funciona
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] py-8 sm:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col items-start justify-between gap-6 text-sm text-[var(--color-graphite)] md:flex-row">
              <div className="space-y-1">
                <BrandMark prefix="Voto Informado e Instruido" context="Segunda Vuelta 2026" />
                <p>
                  Trabajo académico de la FAIN-UPAO. No es propaganda ni
                  comunicación oficial de la universidad.
                </p>
              </div>
              <div className="space-y-1 text-left md:text-right">
                <p>Datos del Jurado Nacional de Elecciones (JNE)</p>
                <p className="font-mono text-xs">votoinformado.jne.gob.pe</p>
                <Link
                  href="/docente"
                  className="mt-3 inline-flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-orange-upao)] hover:underline"
                >
                  Acceso docente
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

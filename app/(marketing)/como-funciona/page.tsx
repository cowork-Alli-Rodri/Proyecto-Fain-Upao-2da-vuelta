import type { Metadata } from "next";
import Link from "next/link";

import { MagneticButton } from "@/components/landing/MagneticButton";
import { ParallaxAngel } from "@/components/motion/ParallaxAngel";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { StickyStoryteller, type Step } from "@/components/landing/StickyStoryteller";

export const metadata: Metadata = {
  title: "Cómo funciona · Voto Informado UPAO",
  description:
    "Cuatro pasos para comparar planes de gobierno con datos oficiales del JNE: identifícate, responde el cuestionario, explora el comparador simétrico y declara tu preferencia.",
};

const STEPS: Step[] = [
  {
    n: "01",
    kicker: "Identidad académica",
    title: "Ingresas con tu cuenta UPAO o personal.",
    body: "OAuth con Google o Microsoft, o correo y contraseña como respaldo. Aceptas un consentimiento informado antes de cualquier captura de datos: tus respuestas pueden borrarse cuando lo pidas.",
  },
  {
    n: "02",
    kicker: "Cuestionario en 4 dimensiones",
    title: "Respondes 12 preguntas neutrales sobre temas de política nacional.",
    body: "Salud, Economía, Ambiente e Institucionalidad. Cada pregunta cita su fuente (INEI, BCRP, MINSA, JNE). El tiempo estimado es 5 a 7 minutos. Las respuestas se autoguardan paso a paso.",
  },
  {
    n: "03",
    kicker: "Comparador lado a lado",
    title: "Lees el plan oficial de cada candidata o candidato sin parafraseo.",
    body: "Texto literal del JNE, con tratamiento visual idéntico. El orden izquierda/derecha se asigna al azar la primera vez que entras y se mantiene para ti. Cuatro pestañas, cuatro dimensiones, sin ranking ni juicios.",
  },
  {
    n: "04",
    kicker: "Preferencia declarada",
    title: "Marcas tu preferencia con un nivel de confianza y un motivo opcional.",
    body: "Tu preferencia es final dentro del ejercicio. No verás la de tus compañeros: la plataforma evita inducir tu voto con presión de pares. El docente solo ve agregados anónimos por carrera y ciclo.",
  },
];

export default function ComoFuncionaPage() {
  return (
    <>
      <ScrollProgress />
      <main className="min-h-screen bg-[var(--color-background)]">
        <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
            <Link href="/" className="flex items-center gap-3">
              <span
                className="block h-7 w-1 bg-[var(--color-navy-upao)] sm:h-8"
                aria-hidden
              />
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] sm:text-[0.7rem] sm:tracking-[0.2em]">
                UPAO · Voto Informado
              </p>
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--color-navy-upao)] px-4 py-2 text-sm font-medium text-[var(--color-navy-upao)] transition hover:bg-[var(--color-navy-upao)] hover:text-white sm:px-5"
            >
              Ingresar
            </Link>
          </div>
        </header>

        {/* HERO de la página */}
        <section className="relative overflow-hidden border-b border-[var(--color-border)]">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-24">
            <div className="space-y-7 lg:col-span-7">
              <ScrollReveal direction="fade">
                <div className="space-y-3">
                  <p className="editorial-kicker">Cómo funciona</p>
                  <div className="editorial-rule" />
                </div>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.05}>
                <h1 className="font-display text-[clamp(2.25rem,6.5vw,5rem)] font-medium leading-[1.02] tracking-tight text-[var(--color-navy-upao)]">
                  Cuatro pasos.
                  <br />
                  <span className="italic text-[var(--color-cyan-deep)]">Sin retórica.</span>
                </h1>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.1}>
                <p className="max-w-xl text-base leading-relaxed text-[var(--color-graphite)] sm:text-lg">
                  Una secuencia diseñada para que tomes una decisión propia con
                  información oficial. Sin recomendaciones de voto. Sin métricas
                  de popularidad ajenas. Solo tú, los planes del JNE y tu
                  criterio.
                </p>
              </ScrollReveal>
            </div>
            <aside className="relative lg:col-span-5">
              <ParallaxAngel className="pointer-events-none absolute -right-12 -top-12 hidden h-[400px] w-[400px] opacity-90 lg:block" />
            </aside>
          </div>
        </section>

        {/* STICKY STORYTELLING */}
        <StickyStoryteller steps={STEPS} />

        {/* CTA final */}
        <section className="border-t border-[var(--color-border)] py-16 sm:py-24">
          <div className="mx-auto max-w-3xl space-y-6 px-4 text-center sm:px-6">
            <ScrollReveal direction="up">
              <p className="editorial-kicker">Empieza</p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.05}>
              <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.05] text-[var(--color-navy-upao)]">
                12 minutos. Una decisión propia.
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.1}>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <MagneticButton href="/login" variant="primary">
                  Comenzar ahora →
                </MagneticButton>
                <MagneticButton href="/" variant="outline">
                  Volver al inicio
                </MagneticButton>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </>
  );
}

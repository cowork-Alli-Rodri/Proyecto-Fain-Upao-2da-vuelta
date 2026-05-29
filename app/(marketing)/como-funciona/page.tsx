import type { Metadata } from "next";
import Link from "next/link";

import { BrandBar, BrandMark } from "@/components/brand/BrandMark";
import { MagneticButton } from "@/components/landing/MagneticButton";
import { ParallaxAngel } from "@/components/motion/ParallaxAngel";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { StickyStoryteller, type Step } from "@/components/landing/StickyStoryteller";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: "Cómo funciona",
  description:
    "Cuatro pasos para analizar los planes oficiales del JNE y aprender a detectar información falsa antes de decidir: identifícate, responde, analiza y decide bien.",
};

const STEPS: Step[] = [
  {
    n: "01",
    kicker: "Identidad académica",
    title: "Ingresas con tu cuenta institucional o personal.",
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
    kicker: "Analiza lado a lado",
    title: "Lees el plan oficial de cada candidatura sin parafraseo.",
    body: "Texto literal del JNE, con tratamiento visual idéntico. El orden izquierda/derecha se asigna al azar la primera vez que entras y se mantiene para ti. Cuatro pestañas, cuatro dimensiones, sin ranking ni juicios.",
  },
  {
    n: "04",
    kicker: "Decide bien",
    title: "Indicas tu decisión con un nivel de confianza y un motivo opcional.",
    body: "Tu decisión es final dentro del ejercicio. No verás la de tus compañeros: la plataforma evita inducir tu voto con presión de pares. El docente solo ve agregados anónimos por carrera y ciclo.",
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
              <BrandBar className="h-7 sm:h-8" />
              <BrandMark context="Segunda Vuelta 2026" hideContextOnMobile />
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

        {/* PRINCIPIOS éticos — qué no hacemos */}
        <section className="bg-[var(--color-navy-upao)] py-14 text-white sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
              <ScrollReveal direction="right" className="lg:col-span-4">
                <p className="editorial-kicker mb-2 text-[var(--color-cyan-electric)]">
                  Nuestros compromisos
                </p>
                <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-medium leading-tight text-white">
                  Qué{" "}
                  <span className="italic text-[var(--color-orange-upao-soft)]">no</span>{" "}
                  hacemos.
                </h2>
              </ScrollReveal>
              <div className="space-y-7 lg:col-span-8 lg:space-y-8">
                {[
                  {
                    kicker: "01",
                    title: "No te decimos por quién votar",
                    text: "Te mostramos las propuestas oficiales tal cual las presentaron al JNE. La conclusión es tuya, nunca nuestra.",
                  },
                  {
                    kicker: "02",
                    title: "No editamos el contenido",
                    text: "Si el JNE no publica algún dato, lo decimos: «No declarado por el JNE». No inventamos ni rellenamos información.",
                  },
                  {
                    kicker: "03",
                    title: "No vendemos tus datos",
                    text: "Tu nombre y correo se guardan hasta 12 meses después del cierre del curso. Pasado ese tiempo se borran sin posibilidad de recuperarlos.",
                  },
                  {
                    kicker: "04",
                    title: "No te mostramos lo que respondieron otros",
                    text: "Tu opinión no se ve influida por la mayoría. Tomas tu decisión sin presión de pares.",
                  },
                ].map((p, i) => (
                  <ScrollReveal key={p.kicker} direction="left" delay={i * 0.08}>
                    <Principle {...p} />
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

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

function Principle({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text: string;
}) {
  const isOdd = kicker === "01" || kicker === "03";
  const kickerColor = isOdd
    ? "text-[var(--color-cyan-electric)]"
    : "text-[var(--color-orange-upao-soft)]";

  return (
    <article className="grid grid-cols-12 gap-3 border-t border-white/15 pt-5 sm:gap-4 sm:pt-6">
      <p className={`col-span-2 font-mono text-xs tracking-widest ${kickerColor}`}>
        {kicker}
      </p>
      <div className="col-span-10 space-y-2">
        <h3 className="font-display text-xl leading-tight text-white sm:text-2xl">{title}</h3>
        <p className="text-sm leading-relaxed text-white/80">{text}</p>
      </div>
    </article>
  );
}

import Link from "next/link";

import { BrandBar, BrandMark } from "@/components/brand/BrandMark";
import { AnimatedLabel } from "@/components/landing/AnimatedLabel";
import { DiagonalSplit } from "@/components/landing/DiagonalSplit";
import { ElectionCountdown } from "@/components/landing/ElectionCountdown";
import { GeometricBackdrop } from "@/components/landing/GeometricBackdrop";
import { MagneticButton } from "@/components/landing/MagneticButton";
import { ParallaxAngel } from "@/components/motion/ParallaxAngel";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

export default function PortalPage() {
  return (
    <>
      <ScrollProgress />
      <main className="min-h-screen bg-[var(--color-background)]">
        {/* HEADER minimal */}
        <header className="absolute inset-x-0 top-0 z-40">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-6">
            <Link href="/" className="flex items-center gap-3">
              <BrandBar className="h-7 sm:h-8" tone="onDark" />
              <BrandMark
                context="Voto Informado e Instruido"
                hideContextOnMobile
                tone="onDark"
              />
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-[var(--color-navy-upao)] sm:px-5"
            >
              Ingresar
            </Link>
          </div>
        </header>

        {/* HERO con backdrop geométrico + split diagonal + label central */}
        <section className="relative isolate overflow-hidden bg-[var(--color-navy-upao)] pt-28 pb-24 text-white sm:pt-36 sm:pb-32 lg:pt-44 lg:pb-40">
          {/* Backdrop geométrico animado: patrón de líneas + triángulos + puntos */}
          <GeometricBackdrop />

          {/* Split diagonal: cuña graphite/deep que entra desde la derecha */}
          <DiagonalSplit tone="deep" className="hidden lg:block" />

          {/* Ángel de Trujillo muy sutil detrás de la diagonal */}
          <ParallaxAngel className="pointer-events-none absolute right-[3%] top-[12%] hidden h-[440px] w-[440px] opacity-[0.18] mix-blend-screen lg:block" />

          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14">
            {/* Izquierda: etiqueta enmarcada + CTA */}
            <div className="space-y-8 lg:col-span-7">
              <AnimatedLabel kicker="Voto Informado e Instruido · FAIN-UPAO">
                <h1 className="m-0 text-center font-display text-[clamp(1.75rem,5vw,3.25rem)] font-medium uppercase leading-[0.95] tracking-tight">
                  <span className="block">Segunda Vuelta</span>
                  <span className="block text-[var(--color-orange-upao)]">
                    Presidencial
                  </span>
                  <span className="mt-2 block font-mono text-[clamp(2.25rem,6vw,4rem)] tracking-[0.04em] text-white">
                    2026
                  </span>
                </h1>
              </AnimatedLabel>

              <ScrollReveal direction="up" delay={0.5}>
                <p className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                  Vas a votar por primera vez. Antes de ir a tu mesa, toma una
                  decisión basada en lo que cada candidatura prometió oficialmente
                  al JNE — no en lo que circula por redes.
                </p>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.6}>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <MagneticButton href="/inicio" variant="onDark">
                    Conoce más →
                  </MagneticButton>
                  <Link
                    href="/no-te-dejes-sorprender"
                    className="inline-flex min-h-[48px] items-center text-sm font-medium text-white/80 underline-offset-4 transition hover:text-white hover:underline"
                  >
                    No te dejes sorprender
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            {/* Derecha: contador con cuña diagonal de fondo */}
            <aside className="relative lg:col-span-5">
              <ScrollReveal direction="left" delay={0.55}>
                <div className="space-y-5 rounded-2xl border-l-2 border-[var(--color-orange-upao)] bg-white/[0.06] p-6 backdrop-blur-sm sm:p-7">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-[var(--color-cyan-electric)]">
                    Cuenta regresiva
                  </p>
                  <ElectionCountdown tone="onDark" />
                  <p className="text-sm leading-relaxed text-white/75">
                    Faltan estos días para la Segunda Vuelta del{" "}
                    <strong className="text-white">7 de junio de 2026</strong>.
                    Aprovecha el tiempo para informarte.
                  </p>
                </div>
              </ScrollReveal>
            </aside>
          </div>

          {/* Trazo coral fino debajo del hero como cierre */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-transparent via-[var(--color-orange-upao)] to-transparent opacity-70"
          />
        </section>

        {/* TRES HERRAMIENTAS */}
        <section className="border-b border-[var(--color-border)] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <ScrollReveal direction="up">
              <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                <div className="space-y-3">
                  <p className="editorial-kicker">Tres herramientas</p>
                  <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-medium leading-tight tracking-tight text-[var(--color-navy-upao)]">
                    Para decidir{" "}
                    <span className="italic text-[var(--color-orange-upao)]">
                      sin dejarte sorprender
                    </span>
                    .
                  </h2>
                </div>
                <p className="max-w-md text-sm text-[var(--color-graphite)]">
                  Tres caminos de entrada. Empieza por el que más te interese; el
                  resto también va a estar disponible cuando quieras volver.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <ToolCard
                kicker="01 · Análisis"
                title="Analiza los planes oficiales."
                description="Lee, lado a lado, las propuestas que Keiko Fujimori y Roberto Sánchez registraron ante el JNE. Texto literal, sin parafraseo."
                href="/inicio"
                cta="Empezar el análisis"
                accent="var(--color-cyan-deep)"
              />
              <ToolCard
                kicker="02 · Verificación"
                title="No te dejes sorprender."
                description="Identifica la información falsa o engañosa que circula en redes. Recopilamos verificaciones publicadas por medios de comprobación reconocidos."
                href="/no-te-dejes-sorprender"
                cta="Ver desinformación"
                accent="var(--color-coral-pulse)"
              />
              <ToolCard
                kicker="03 · Candidatos"
                title="Conoce a quienes lideran."
                description="Datos oficiales: hoja de vida pública en el JNE, partido, trayectoria. Sin opiniones, solo lo declarado."
                href="/candidatos"
                cta="Ver candidatos"
                accent="var(--color-orange-upao)"
              />
            </div>
          </div>
        </section>

        {/* BLOQUE OBJETIVO + COMPROMISO */}
        <section className="bg-[var(--color-surface-2)] py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16">
            <ScrollReveal direction="right" className="lg:col-span-5">
              <p className="editorial-kicker">Por qué existe esta plataforma</p>
              <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.25rem)] font-medium leading-tight text-[var(--color-navy-upao)]">
                Decisiones objetivas,{" "}
                <span className="italic text-[var(--color-cyan-deep)]">no impulsivas</span>.
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="left" className="lg:col-span-7" delay={0.1}>
              <div className="space-y-5 text-base leading-relaxed text-[var(--color-graphite)]">
                <p>
                  Esta plataforma busca <strong>promover la toma de decisiones
                  objetiva y crítica</strong> mediante la identificación de la
                  información falsa o engañosa que se divulga en otros canales.
                </p>
                <p>
                  Está pensada para que, si vas a votar por primera vez, no llegues a
                  tu mesa repitiendo titulares ni reenvíos de WhatsApp. Llegas con un
                  recorrido propio: revisaste qué prometió cada candidatura,
                  identificaste qué noticias falsas circulan y decidiste con tu
                  criterio.
                </p>
                <p className="border-l-2 border-[var(--color-orange-upao)] pl-4 text-sm text-[var(--color-graphite)]">
                  No te decimos por quién votar. No editamos lo que dicen los
                  candidatos. No mostramos lo que opinan otros estudiantes. La
                  conclusión es solo tuya.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col items-start justify-between gap-6 text-sm text-[var(--color-graphite)] md:flex-row">
              <div className="space-y-2">
                <BrandMark
                  prefix="Voto Informado e Instruido"
                  context="Segunda Vuelta 2026"
                />
                <p className="max-w-md">
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

function ToolCard({
  kicker,
  title,
  description,
  href,
  cta,
  accent,
}: {
  kicker: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition hover:-translate-y-1 hover:border-[var(--color-navy-upao)] hover:shadow-[var(--shadow-soft)] sm:p-8"
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-1 w-16 transition-all group-hover:w-32"
        style={{ backgroundColor: accent }}
      />
      <p
        className="pt-3 font-mono text-[0.65rem] uppercase tracking-[0.22em]"
        style={{ color: accent }}
      >
        {kicker}
      </p>
      <h3 className="font-display text-2xl font-medium leading-tight text-[var(--color-navy-upao)] sm:text-3xl">
        {title}
      </h3>
      <p className="flex-1 text-sm leading-relaxed text-[var(--color-graphite)]">
        {description}
      </p>
      <p
        className="mt-auto inline-flex items-center gap-2 text-sm font-medium transition group-hover:gap-3"
        style={{ color: accent }}
      >
        {cta}
        <span aria-hidden>→</span>
      </p>
    </Link>
  );
}

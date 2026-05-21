import Link from "next/link";

import { MagneticButton } from "@/components/landing/MagneticButton";
import { GsapHeroReveal } from "@/components/motion/GsapHeroReveal";
import { ParallaxAngel } from "@/components/motion/ParallaxAngel";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <main className="min-h-screen bg-[var(--color-background)]">
        {/* HEADER */}
        <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-3">
              <span
                className="block h-7 w-1 bg-[var(--color-navy-upao)] sm:h-8"
                aria-hidden
              />
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] sm:text-[0.7rem] sm:tracking-[0.2em]">
                UPAO · Trujillo
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--color-navy-upao)] px-4 py-2 text-sm font-medium text-[var(--color-navy-upao)] transition hover:bg-[var(--color-navy-upao)] hover:text-white sm:px-5"
            >
              Ingresar
            </Link>
          </div>
        </header>

        {/* HERO */}
        <section className="relative overflow-hidden border-b border-[var(--color-border)]">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-28">
            <div className="space-y-7 lg:col-span-7">
              <ScrollReveal direction="fade">
                <div className="space-y-3">
                  <p className="editorial-kicker">Segunda Vuelta · Perú · 2026</p>
                  <div className="editorial-rule" />
                </div>
              </ScrollReveal>

              <GsapHeroReveal className="font-display text-[clamp(2.25rem,7vw,5.5rem)] font-medium leading-[0.98] tracking-tight text-[var(--color-navy-upao)]">
                <h1 className="m-0">
                  <span className="block">Compara los planes</span>
                  <span className="block">de gobierno</span>
                  <span className="block italic text-[var(--color-cyan-deep)]">
                    sin intermediarios.
                  </span>
                </h1>
              </GsapHeroReveal>

              <ScrollReveal direction="up" delay={0.2}>
                <p className="max-w-xl text-base leading-relaxed text-[var(--color-graphite)] sm:text-lg">
                  Texto exacto del Jurado Nacional de Elecciones, lado a lado, en cuatro
                  dimensiones oficiales. <strong>Keiko Fujimori</strong> (Fuerza Popular)
                  frente a <strong>Roberto Sánchez</strong> (Juntos por el Perú). Cero filtros
                  editoriales. Cero recomendaciones.
                </p>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.3}>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <MagneticButton href="/login" variant="primary">
                    Comenzar →
                  </MagneticButton>
                  <Link
                    href="/como-funciona"
                    className="inline-flex min-h-[48px] items-center text-sm font-medium text-[var(--color-graphite)] underline-offset-4 hover:underline"
                  >
                    Cómo funciona
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            {/* Lado derecho: Ángel + dato editorial */}
            <aside className="relative lg:col-span-5">
              <ParallaxAngel className="pointer-events-none absolute -right-12 -top-12 hidden h-[420px] w-[420px] opacity-90 lg:block" />

              <ScrollReveal direction="left" delay={0.2}>
                <div className="relative space-y-6 lg:pt-16">
                  <article className="border-l-2 border-[var(--color-cyan-deep)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
                    <p className="editorial-kicker mb-2">Dato</p>
                    <p className="font-display text-2xl leading-tight text-[var(--color-navy-upao)] sm:text-3xl">
                      <span className="font-mono text-4xl text-[var(--color-cyan-deep)] sm:text-5xl">
                        12
                      </span>
                      <br />
                      preguntas en 4 dimensiones del JNE para situarte antes del comparador.
                    </p>
                  </article>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Fuentes: INEI, BCRP, MINSA, MINAM, Proética, JNE. Cada pregunta cita su
                    origen.
                  </p>
                </div>
              </ScrollReveal>
            </aside>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section
          id="como-funciona"
          className="border-b border-[var(--color-border)] py-14 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <ScrollReveal direction="up">
              <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:mb-12 md:flex-row md:items-end md:gap-8">
                <div className="space-y-3">
                  <p className="editorial-kicker">Flujo</p>
                  <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-medium tracking-tight text-[var(--color-navy-upao)]">
                    De curioso a decidido, en{" "}
                    <span className="italic text-[var(--color-cyan-deep)]">12 minutos</span>.
                  </h2>
                </div>
                <p className="max-w-md text-sm text-[var(--color-graphite)]">
                  Diseñado para móvil. Tus respuestas se guardan automáticamente. Puedes
                  retomar donde quedaste.
                </p>
              </div>
            </ScrollReveal>

            <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  n: "01",
                  title: "Identifícate",
                  text: "Ingresa con Google, Microsoft o correo. Aceptas el consentimiento informado.",
                },
                {
                  n: "02",
                  title: "Cuestionario",
                  text: "12 preguntas neutrales. Salud, Economía, Ambiente, Institucionalidad.",
                },
                {
                  n: "03",
                  title: "Compara",
                  text: "Planes del JNE lado a lado. Orden aleatorio para evitar sesgo de primacía.",
                },
                {
                  n: "04",
                  title: "Declara",
                  text: "Tu preferencia final + nivel de confianza + motivo opcional. Es final.",
                },
              ].map((step, i) => (
                <ScrollReveal key={step.n} direction="up" delay={i * 0.08}>
                  <Step {...step} />
                </ScrollReveal>
              ))}
            </ol>
          </div>
        </section>

        {/* PRINCIPIOS éticos */}
        <section className="bg-[var(--color-navy-upao)] py-14 text-white sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
              <ScrollReveal direction="right" className="lg:col-span-4">
                <p className="editorial-kicker mb-2 text-[var(--color-cyan-electric)]">
                  Constraints éticos
                </p>
                <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-medium leading-tight text-white">
                  Qué <span className="italic">no</span> hacemos.
                </h2>
              </ScrollReveal>
              <div className="space-y-7 lg:col-span-8 lg:space-y-8">
                {[
                  {
                    kicker: "01",
                    title: "No emitimos recomendaciones de voto",
                    text: "El comparador muestra el texto exacto del JNE, sin parafraseo ni etiquetas valorativas. Nuestra herramienta facilita la lectura, nunca la conclusión.",
                  },
                  {
                    kicker: "02",
                    title: "No filtramos editorialmente",
                    text: "Si el JNE no declara un campo, mostramos «No declarado por el JNE» explícitamente. No inventamos contenido.",
                  },
                  {
                    kicker: "03",
                    title: "No vendemos tus datos",
                    text: "Tu información personal se conserva solo 12 meses tras el cierre del ciclo. Después se anonimiza de forma irreversible.",
                  },
                  {
                    kicker: "04",
                    title: "No mostramos resultados agregados al estudiante",
                    text: "Tu participación no se ve influenciada por lo que respondieron otros. Tu opinión es tuya.",
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

        {/* FOOTER */}
        <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] py-8 sm:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col items-start justify-between gap-6 text-sm text-[var(--color-graphite)] md:flex-row">
              <div className="space-y-1">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] sm:text-[0.7rem]">
                  Voto Informado UPAO · Segunda Vuelta 2026
                </p>
                <p>
                  Herramienta académica del docente del curso. No es propaganda institucional.
                </p>
              </div>
              <div className="space-y-1 text-left md:text-right">
                <p>Datos del Jurado Nacional de Elecciones (JNE)</p>
                <p className="font-mono text-xs">votoinformado.jne.gob.pe</p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <article className="space-y-3 bg-[var(--color-surface)] p-5 transition hover:bg-[var(--color-surface-2)] sm:p-6">
      <p className="font-mono text-xs tracking-widest text-[var(--color-cyan-deep)]">{n}</p>
      <h3 className="font-display text-xl font-medium text-[var(--color-navy-upao)] sm:text-2xl">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-[var(--color-graphite)]">{text}</p>
    </article>
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
  return (
    <article className="grid grid-cols-12 gap-3 border-t border-white/15 pt-5 sm:gap-4 sm:pt-6">
      <p className="col-span-2 font-mono text-xs tracking-widest text-[var(--color-cyan-electric)]">
        {kicker}
      </p>
      <div className="col-span-10 space-y-2">
        <h3 className="font-display text-xl leading-tight text-white sm:text-2xl">{title}</h3>
        <p className="text-sm leading-relaxed text-white/80">{text}</p>
      </div>
    </article>
  );
}

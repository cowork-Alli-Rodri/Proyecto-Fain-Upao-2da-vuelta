import Link from "next/link";

import { AngelOrnament } from "@/components/landing/AngelOrnament";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      {/* HEADER FIJO con marca institucional */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="block h-8 w-1 bg-[var(--color-navy-upao)]" aria-hidden />
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
              UPAO · Trujillo
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-full border border-[var(--color-navy-upao)] px-5 py-2 text-sm font-medium text-[var(--color-navy-upao)] transition hover:bg-[var(--color-navy-upao)] hover:text-white"
          >
            Ingresar
          </Link>
        </div>
      </header>

      {/* HERO editorial asimétrico */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-12 lg:py-28">
          <div className="space-y-8 lg:col-span-7">
            <div className="space-y-3">
              <p className="editorial-kicker">Segunda Vuelta Electoral · Perú · 2026</p>
              <div className="editorial-rule" />
            </div>

            <h1 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[0.95] tracking-tight text-[var(--color-navy-upao)]">
              Compara los planes
              <br />
              de gobierno
              <br />
              <span className="italic text-[var(--color-cyan-deep)]">sin intermediarios</span>.
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-[var(--color-graphite)]">
              Texto exacto del Jurado Nacional de Elecciones, lado a lado, en cuatro dimensiones
              oficiales. <strong>Keiko Fujimori</strong> (Fuerza Popular) frente a{" "}
              <strong>Roberto Sánchez</strong> (Juntos por el Perú). Cero filtros editoriales.
              Cero recomendaciones.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-navy-upao)] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)]"
              >
                Comenzar
                <span
                  aria-hidden
                  className="inline-block transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
              <Link
                href="#como-funciona"
                className="text-sm font-medium text-[var(--color-graphite)] underline-offset-4 hover:underline"
              >
                Cómo funciona
              </Link>
            </div>
          </div>

          {/* Lado derecho: Ángel + dato editorial */}
          <aside className="relative lg:col-span-5">
            <div className="absolute -right-12 -top-12 hidden h-[420px] w-[420px] opacity-90 lg:block">
              <AngelOrnament />
            </div>
            <div className="relative space-y-6 lg:pt-16">
              <article className="border-l-2 border-[var(--color-cyan-deep)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
                <p className="editorial-kicker mb-2">Dato</p>
                <p className="font-display text-3xl leading-tight text-[var(--color-navy-upao)]">
                  <span className="font-mono text-5xl text-[var(--color-cyan-deep)]">12</span>
                  <br />
                  preguntas en 4 dimensiones del JNE para situarte antes del comparador.
                </p>
              </article>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Fuentes: INEI, BCRP, MINSA, MINAM, Proética, JNE. Cada pregunta cita su origen.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* CÓMO FUNCIONA - 4 pasos editoriales */}
      <section id="como-funciona" className="border-b border-[var(--color-border)] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex items-end justify-between gap-8 max-md:flex-col max-md:items-start">
            <div className="space-y-3">
              <p className="editorial-kicker">Flujo</p>
              <h2 className="font-display text-4xl font-medium tracking-tight text-[var(--color-navy-upao)] sm:text-5xl">
                De curioso a decidido, en{" "}
                <span className="italic text-[var(--color-cyan-deep)]">12 minutos</span>.
              </h2>
            </div>
            <p className="max-w-md text-sm text-[var(--color-graphite)]">
              Diseñado para móvil. Tus respuestas se guardan automáticamente. Puedes retomar
              donde quedaste.
            </p>
          </div>

          <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-2 lg:grid-cols-4">
            <Step
              n="01"
              title="Identifícate"
              text="Ingresa con Google, Microsoft o correo. Aceptas el consentimiento Ley 29733."
            />
            <Step
              n="02"
              title="Cuestionario"
              text="12 preguntas neutrales. Salud, Economía, Ambiente, Institucionalidad."
            />
            <Step
              n="03"
              title="Compara"
              text="Planes del JNE lado a lado. Orden aleatorio para evitar sesgo de primacía."
            />
            <Step
              n="04"
              title="Declara"
              text="Tu preferencia final + nivel de confianza + motivo opcional. Es final."
            />
          </ol>
        </div>
      </section>

      {/* PRINCIPIOS éticos - en formato editorial */}
      <section className="bg-[var(--color-navy-upao)] py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="editorial-kicker mb-2 text-[var(--color-cyan-electric)]">
                Constraints éticos
              </p>
              <h2 className="font-display text-4xl font-medium leading-tight text-white">
                Qué <span className="italic">no</span> hacemos.
              </h2>
            </div>
            <div className="space-y-8 lg:col-span-8">
              <Principle
                kicker="01"
                title="No emitimos recomendaciones de voto"
                text="El comparador muestra el texto exacto del JNE, sin parafraseo ni etiquetas valorativas. Nuestra herramienta facilita la lectura, nunca la conclusión."
              />
              <Principle
                kicker="02"
                title="No filtramos editorialmente"
                text="Si el JNE no declara un campo, mostramos &laquo;No declarado por el JNE&raquo; explícitamente. No inventamos contenido."
              />
              <Principle
                kicker="03"
                title="No vendemos tus datos"
                text="PII conservada solo 12 meses post-cierre del ciclo. Anonimización irreversible después. Cumplimiento Ley 29733 — Protección de Datos Personales del Perú."
              />
              <Principle
                kicker="04"
                title="No mostramos resultados agregados al estudiante"
                text="Tu participación no se ve influenciada por lo que respondieron otros. Tu opinión es tuya."
              />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-start justify-between gap-6 text-sm text-[var(--color-graphite)] md:flex-row">
            <div className="space-y-1">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
                Voto Informado UPAO · Segunda Vuelta 2026
              </p>
              <p>Herramienta académica del docente del curso. No es propaganda institucional.</p>
            </div>
            <div className="space-y-1 text-right max-md:text-left">
              <p>Datos del Jurado Nacional de Elecciones (JNE)</p>
              <p className="font-mono text-xs">votoinformado.jne.gob.pe</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <article className="space-y-3 bg-[var(--color-surface)] p-6 transition hover:bg-[var(--color-surface-2)]">
      <p className="font-mono text-xs tracking-widest text-[var(--color-cyan-deep)]">{n}</p>
      <h3 className="font-display text-2xl font-medium text-[var(--color-navy-upao)]">
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
    <article className="grid grid-cols-12 gap-4 border-t border-white/15 pt-6">
      <p className="col-span-2 font-mono text-xs tracking-widest text-[var(--color-cyan-electric)]">
        {kicker}
      </p>
      <div className="col-span-10 space-y-2">
        <h3 className="font-display text-2xl leading-tight text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-white/80">{text}</p>
      </div>
    </article>
  );
}

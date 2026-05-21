import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-16">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-12">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-[var(--color-smoke)]">
            Universidad Privada Antenor Orrego · Trujillo
          </p>
          <h1 className="font-display text-5xl leading-tight text-[var(--color-navy-upao)] sm:text-6xl">
            Voto Informado UPAO
            <br />
            <span className="text-[var(--color-cyan-electric)]">Segunda Vuelta 2026</span>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--color-smoke)]">
            Compara los planes de gobierno oficiales del JNE de los dos finalistas presidenciales.
            Sin sesgos, sin recomendaciones, con datos exactos.
          </p>
        </header>

        <section className="space-y-3">
          <Button
            asChild
            size="lg"
            className="bg-[var(--color-navy-upao)] text-white hover:bg-[var(--color-navy-deep)]"
          >
            <Link href="/login">Ingresar</Link>
          </Button>
          <p className="text-xs text-[var(--color-smoke)]">
            Necesitas una cuenta para participar. El acceso es por invitación del docente.
          </p>
        </section>

        <section className="grid w-full grid-cols-1 gap-4 pt-8 sm:grid-cols-3">
          <Feature
            kicker="01"
            title="Cuestionario"
            text="Responde 12 preguntas sobre política nacional en 4 dimensiones JNE."
          />
          <Feature
            kicker="02"
            title="Comparador"
            text="Explora los planes oficiales lado a lado, texto exacto del JNE."
          />
          <Feature
            kicker="03"
            title="Tu preferencia"
            text="Declara tu posición final con motivos. Análisis pedagógico del docente."
          />
        </section>

        <footer className="space-y-1 pt-12 text-xs text-[var(--color-smoke)]">
          <p>
            Esta plataforma <strong>no emite recomendaciones de voto</strong>. Cumple la Ley N° 29733.
          </p>
          <p>
            Datos del Jurado Nacional de Elecciones (JNE). Comparador con tratamiento simétrico.
          </p>
        </footer>
      </div>
    </main>
  );
}

function Feature({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <article className="space-y-2 rounded-[var(--radius-card)] border border-[color-mix(in_oklch,var(--color-navy-upao)_15%,transparent)] bg-white p-5 shadow-sm">
      <p className="font-mono text-xs text-[var(--color-cyan-electric)]">{kicker}</p>
      <h2 className="font-display text-xl text-[var(--color-navy-upao)]">{title}</h2>
      <p className="text-sm leading-relaxed text-[var(--color-smoke)]">{text}</p>
    </article>
  );
}

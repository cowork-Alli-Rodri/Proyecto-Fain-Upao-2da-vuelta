import type { Metadata } from "next";
import Link from "next/link";

import { BrandBar, BrandMark } from "@/components/brand/BrandMark";
import { VERIFIERS } from "@/lib/fact-checks/verifiers";
import { createAdminClient } from "@/lib/supabase/admin";

import { FactCheckGallery, type PublishedFactCheck } from "./_components/FactCheckGallery";
import { VerifierForm } from "./_components/VerifierForm";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: "No te dejes sorprender",
  description:
    "Verificador automático de noticias electorales. Pega un titular o frase y consultamos la red mundial de fact-checkers (Google Fact Check Tools) para mostrarte si la afirmación ya fue chequeada como verdadera, falsa o engañosa.",
};

// ISR — el listado de fact-checks se regenera cada 30 minutos.
// Una sola query a Supabase por ventana de cache; cero llamadas a Google API
// para mostrar el listado. La verificación on-demand del usuario sí va a
// Google en tiempo real, pero solo cuando hace click en "Verificar".
export const revalidate = 1800;

async function loadPublishedFactChecks(): Promise<PublishedFactCheck[]> {
  // Tolerante a entornos de build sin Supabase real (CI E2E job).
  // En prod (Vercel) las env vars existen y la query corre normal.
  try {
    const supabase = createAdminClient();
    // Ordenamos por fecha_origen (fecha real de la verificación) descendente,
    // con fallback a published_at. Así la galería refleja la actualidad de los
    // casos y queda naturalmente variada por candidato.
    const { data } = await supabase
      .from("fact_checks" as never)
      .select(
        "id, titular_falso, contexto, fact_checker_name, fact_checker_url, candidato_relacionado, fecha_origen, published_at",
      )
      .eq("status", "published")
      .order("fecha_origen", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false })
      .limit(12);
    return (data ?? []) as PublishedFactCheck[];
  } catch {
    return [];
  }
}

export default async function NoTeDejesSorprenderPage() {
  const factChecks = await loadPublishedFactChecks();

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandBar />
            <BrandMark context="No te dejes sorprender" hideContextOnMobile />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] transition hover:text-[var(--color-navy-upao)] sm:inline sm:text-[0.7rem] sm:tracking-[0.2em]"
            >
              ← Inicio
            </Link>
            <Link
              href="/candidatos"
              className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--color-navy-upao)] px-4 py-2 text-sm font-medium text-[var(--color-navy-upao)] transition hover:bg-[var(--color-navy-upao)] hover:text-white sm:px-5"
            >
              Ver candidatos →
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-[var(--color-border)] py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="space-y-3">
            <p className="editorial-kicker text-[var(--color-coral-pulse)]">
              Verificador · Segunda Vuelta 2026
            </p>
            <h1 className="font-display text-[clamp(2.25rem,5.5vw,4rem)] font-medium leading-[1.05] tracking-tight text-[var(--color-navy-upao)]">
              No te dejes{" "}
              <span className="italic text-[var(--color-coral-pulse)]">sorprender</span>.
            </h1>
            <p className="max-w-2xl pt-2 text-base leading-relaxed text-[var(--color-graphite)] sm:text-lg">
              Antes de compartir lo que viste en redes sociales en torno a las
              elecciones de segunda vuelta, verifícalo aquí. No adoptes una
              decisión por una noticia que circula sin antes comprobarla:
              consultamos la red mundial de verificadores (Google Fact Check
              Tools) y te decimos si esa afirmación ya fue revisada — y qué
              veredicto le dio cada medio.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:gap-16">
        {/* Verificador automático + cómo funciona debajo */}
        <section className="space-y-6 lg:col-span-7">
          <div className="space-y-3">
            <h2 className="font-display text-2xl font-medium text-[var(--color-navy-upao)]">
              Verifica una afirmación
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-graphite)]">
              Pega el titular, la cita o el screenshot transcrito. La búsqueda
              es automática contra el índice global de fact-checkers (en
              español), que incluye OjoPúblico, La República Verifica, EFE
              Verifica, AFP Factual, Maldita.es, entre otros.
            </p>
          </div>

          <VerifierForm />

          {/* Cómo funciona — debajo del form para llenar el espacio cuando
              aún no hay resultados. Cuando hay resultados, queda al final. */}
          <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-2)] p-6 text-sm leading-relaxed text-[var(--color-graphite)]">
            <p className="editorial-kicker mb-2">Cómo funciona el verificador</p>
            <ol className="mt-2 list-decimal space-y-2 pl-5">
              <li>
                Tomamos tu frase y la consultamos al índice global de
                fact-checks (IFCN).
              </li>
              <li>
                Si algún medio reconocido ya verificó esa afirmación, te
                mostramos su veredicto literal y el enlace al artículo
                original.
              </li>
              <li>
                Si no hay coincidencias, indicamos que <em>aún</em> no está
                catalogada — no que sea verdadera o falsa. Reformula con la
                frase original o consulta los medios del costado.
              </li>
            </ol>
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
              No publicamos opiniones propias ni inventamos veredictos. Toda
              decisión editorial es de cada medio fact-checker.
            </p>
          </div>
        </section>

        {/* Sidebar: solo verificadores externos */}
        <aside className="lg:col-span-5">
          <div className="rounded-2xl border-l-2 border-[var(--color-cyan-deep)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <p className="editorial-kicker mb-3">Verificadores reconocidos</p>
            <h3 className="font-display text-xl font-medium text-[var(--color-navy-upao)]">
              Ve a la fuente directa.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-graphite)]">
              Si quieres explorar verificaciones manualmente, estos son los
              medios que integramos vía Google Fact Check Tools.
            </p>
            <ul className="mt-5 space-y-3">
              {VERIFIERS.map((v) => (
                <li key={v.id}>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-white p-4 transition hover:border-[var(--color-cyan-deep)]"
                  >
                    <p className="text-sm font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-cyan-deep)]">
                      {v.name}{" "}
                      <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">
                        ↗
                      </span>
                    </p>
                    <p className="text-xs leading-relaxed text-[var(--color-graphite)]">
                      {v.description}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Casos destacados — server-rendered, ISR 30 min */}
      <FactCheckGallery items={factChecks} />
    </main>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandBar, BrandMark } from "@/components/brand/BrandMark";
import { SignOutLink } from "@/components/brand/SignOutLink";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Gracias" };

const CANDIDATO_LABEL: Record<string, string> = {
  keiko: "Keiko Fujimori",
  roberto: "Roberto Sánchez",
  indeciso: "Indeciso/a",
};

const CANDIDATO_COLOR: Record<string, string> = {
  keiko: "var(--color-candidate-keiko)",
  roberto: "var(--color-candidate-roberto)",
  indeciso: "var(--color-graphite)",
};

const CANDIDATO_PARTIDO: Record<string, string> = {
  keiko: "Fuerza Popular",
  roberto: "Juntos por el Perú",
  indeciso: "Sin decisión",
};

const CANDIDATO_PHOTO: Record<string, string | null> = {
  keiko: "/candidates/keiko-fujimori.webp",
  roberto: "/candidates/roberto-sanchez.webp",
  indeciso: null,
};

const CANDIDATO_LOGO: Record<string, { src: string; isSvg: boolean } | null> = {
  keiko: { src: "/parties/fuerza-popular.webp", isSvg: false },
  roberto: { src: "/parties/juntos-por-el-peru.svg", isSvg: true },
  indeciso: null,
};

export default async function CierrePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: preference }, { count: answerCount }] = await Promise.all([
    supabase
      .from("preferences")
      .select("candidato_preferido, confianza, submitted_at")
      .eq("student_id", user.id)
      .maybeSingle(),
    supabase
      .from("answers")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id),
  ]);

  const pref = preference as
    | { candidato_preferido: string; confianza: number; submitted_at: string }
    | null;

  if (!pref) redirect("/preferencia");

  const candColor = CANDIDATO_COLOR[pref.candidato_preferido] ?? "var(--color-graphite)";

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandBar />
            <BrandMark context="Voto Informado e Instruido" />
          </Link>
          <div className="flex items-center gap-5">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-mint-success)]">
              Completado
            </p>
            <SignOutLink />
          </div>
        </div>
      </header>

      <section className="border-b border-[var(--color-border)] py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="space-y-6">
            <p className="editorial-kicker text-[var(--color-mint-success)]">
              Tu participación está registrada
            </p>
            <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1] tracking-tight text-[var(--color-navy-upao)]">
              Gracias por tu tiempo.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-[var(--color-graphite)]">
              Has completado el flujo. El docente del curso analizará los resultados de forma
              agregada y anonimizada. Tu nombre no aparecerá en ningún reporte público.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-3">
            <Stat
              kicker="Respuestas"
              label="Preguntas enviadas"
              value={String(answerCount ?? 0).padStart(2, "0")}
              accent="var(--color-navy-upao)"
              mono
            />
            <PreferenceCard
              candidate={pref.candidato_preferido}
              label={CANDIDATO_LABEL[pref.candidato_preferido] ?? "—"}
              partido={CANDIDATO_PARTIDO[pref.candidato_preferido] ?? "Tu candidato/a"}
              photo={CANDIDATO_PHOTO[pref.candidato_preferido] ?? null}
              logo={CANDIDATO_LOGO[pref.candidato_preferido] ?? null}
              accent={candColor}
            />
            <Stat
              kicker="Confianza"
              label="Nivel declarado"
              value={`${pref.confianza}/10`}
              accent="var(--color-cyan-deep)"
              mono
            />
          </div>
        </div>
      </section>

    </main>
  );
}

function Stat({
  kicker,
  label,
  value,
  accent,
  mono,
}: {
  kicker: string;
  label: string;
  value: string;
  accent: string;
  mono?: boolean;
}) {
  return (
    <article className="space-y-4 bg-[var(--color-surface)] p-8">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: accent }}>
        {kicker}
      </p>
      <p
        className={
          mono
            ? "font-mono text-[clamp(2.5rem,5vw,4rem)] font-medium leading-none"
            : "font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-tight"
        }
        style={{ color: accent }}
      >
        {value}
      </p>
      <p className="text-sm text-[var(--color-muted-foreground)]">{label}</p>
    </article>
  );
}

function PreferenceCard({
  candidate,
  label,
  partido,
  photo,
  logo,
  accent,
}: {
  candidate: string;
  label: string;
  partido: string;
  photo: string | null;
  logo: { src: string; isSvg: boolean } | null;
  accent: string;
}) {
  return (
    <article className="space-y-4 bg-[var(--color-surface)] p-8">
      <p
        className="font-mono text-[0.65rem] uppercase tracking-[0.2em]"
        style={{ color: accent }}
      >
        Tu decisión
      </p>

      {photo ? (
        <div
          className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-white"
          style={{ backgroundColor: `color-mix(in oklch, ${accent} 18%, white)` }}
        >
          <Image
            src={photo}
            alt={`Foto oficial de ${label}`}
            fill
            sizes="64px"
            className="scale-[1.35] object-cover object-[50%_28%]"
            unoptimized
          />
        </div>
      ) : (
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full font-mono text-2xl font-bold text-white"
          style={{ backgroundColor: accent }}
          aria-hidden
        >
          ?
        </div>
      )}

      <p
        className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-medium leading-tight"
        style={{ color: accent }}
      >
        {label}
      </p>

      <div className="flex items-center gap-2">
        {logo ? (
          <span className="relative inline-block h-4 w-4 shrink-0">
            {logo.isSvg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo.src}
                alt=""
                aria-hidden
                className="h-full w-full object-contain"
              />
            ) : (
              <Image
                src={logo.src}
                alt=""
                aria-hidden
                fill
                sizes="16px"
                className="object-contain"
                unoptimized
              />
            )}
          </span>
        ) : null}
        <p
          className={`truncate ${candidate === "indeciso" ? "text-xs italic text-[var(--color-muted-foreground)]" : "text-xs uppercase tracking-widest text-[var(--color-muted-foreground)]"}`}
        >
          {partido}
        </p>
      </div>
    </article>
  );
}

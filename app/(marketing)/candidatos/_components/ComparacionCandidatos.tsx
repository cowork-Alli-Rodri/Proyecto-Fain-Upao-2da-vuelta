import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { CANDIDATOS, FUENTE_OFICIAL, type CandidatoData } from "./candidatos-data";

const keiko = CANDIDATOS.keiko;
const roberto = CANDIDATOS.roberto;

/**
 * Comparación lado a lado de ambos candidatos con datos verificables de su
 * hoja de vida oficial en el JNE. Cada campo se alinea por fila para que la
 * comparación sea directa. Los datos no se editan; si el JNE no los declara,
 * se muestra "No declarado por el JNE".
 */
export function ComparacionCandidatos() {
  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="space-y-3">
          <p className="editorial-kicker">Comparación</p>
          <h2 className="font-display text-2xl font-medium text-[var(--color-navy-upao)] sm:text-3xl">
            Compara a los candidatos presidenciales
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-graphite)]">
            Datos tomados de la hoja de vida oficial registrada por cada
            candidato ante el Jurado Nacional de Elecciones (JNE) y consultados
            desde fuente oficial. No editamos el contenido; si un dato no fue
            declarado, lo indicamos.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
          {/* Encabezado: foto + nombre + partido por candidato */}
          <div className="grid grid-cols-2">
            <CandidatoHeader candidato={keiko} />
            <CandidatoHeader candidato={roberto} borderLeft />
          </div>

          <Field label="Partido político">
            <PartidoValue candidato={keiko} />
            <PartidoValue candidato={roberto} />
          </Field>

          <Field label="Edad">
            <ValueText text={keiko.comparacion.edad} />
            <ValueText text={roberto.comparacion.edad} />
          </Field>

          <Field label="Estudios">
            <ListValue items={keiko.comparacion.estudios} />
            <ListValue items={roberto.comparacion.estudios} />
          </Field>

          <Field label="Experiencia laboral">
            <ExperienciaValue candidato={keiko} />
            <ExperienciaValue candidato={roberto} />
          </Field>

          <Field label="Cargo al que postula">
            <ValueText text={keiko.comparacion.cargoPostula} />
            <ValueText text={roberto.comparacion.cargoPostula} />
          </Field>

          <Field label="Fuente oficial" last>
            <FuenteValue candidato={keiko} />
            <FuenteValue candidato={roberto} />
          </Field>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
          Fuente: {FUENTE_OFICIAL.label}. La edad no figura porque el JNE no
          publica la fecha de nacimiento en la hoja de vida.
        </p>
      </div>
    </section>
  );
}

function CandidatoHeader({
  candidato,
  borderLeft = false,
}: {
  candidato: CandidatoData;
  borderLeft?: boolean;
}) {
  return (
    <div
      className={
        "flex flex-col items-center gap-3 px-4 py-6 text-center " +
        (borderLeft ? "border-l border-[var(--color-border)]" : "")
      }
      style={{
        background: `linear-gradient(180deg, color-mix(in oklch, ${candidato.partyAccentHex} 8%, white), white)`,
      }}
    >
      <div
        className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-white sm:h-28 sm:w-28"
        style={{
          backgroundColor: `color-mix(in oklch, ${candidato.partyAccentHex} 14%, white)`,
        }}
      >
        <Image
          src={candidato.photoUrl}
          alt={`Foto oficial de ${candidato.displayName}`}
          fill
          sizes="112px"
          className="object-cover object-top"
        />
      </div>
      <div>
        <p className="font-display text-sm font-semibold leading-tight text-[var(--color-navy-upao)] sm:text-base">
          {candidato.displayName}
        </p>
        <p
          className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-[0.16em]"
          style={{ color: `var(${candidato.accentVar})` }}
        >
          {candidato.partyName}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={last ? "" : "border-b border-[var(--color-border)]"}>
      <p className="border-y border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-1.5 text-center font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
        {label}
      </p>
      <div className="grid grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function ValueText({ text }: { text: string | null }) {
  return (
    <div className="px-4 py-3 text-center text-sm leading-snug text-[var(--color-foreground)] [&:first-child]:border-r [&:first-child]:border-[var(--color-border)]">
      {text ?? <span className="italic text-[var(--color-muted-foreground)]">No declarado por el JNE</span>}
    </div>
  );
}

function ListValue({ items }: { items: string[] }) {
  return (
    <div className="px-4 py-3 text-sm leading-snug text-[var(--color-foreground)] [&:first-child]:border-r [&:first-child]:border-[var(--color-border)]">
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      ) : (
        <span className="italic text-[var(--color-muted-foreground)]">
          No declarado por el JNE
        </span>
      )}
    </div>
  );
}

function ExperienciaValue({ candidato }: { candidato: CandidatoData }) {
  const exp = candidato.comparacion.experiencia;
  return (
    <div className="px-4 py-3 text-sm leading-snug text-[var(--color-foreground)] [&:first-child]:border-r [&:first-child]:border-[var(--color-border)]">
      {exp.length > 0 ? (
        <ul className="space-y-2">
          {exp.map((e) => (
            <li key={`${e.cargo}-${e.centro}`}>
              <span className="font-medium">{e.cargo}</span>
              <span className="block text-xs text-[var(--color-graphite)]">
                {e.centro} · {e.periodo}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <span className="italic text-[var(--color-muted-foreground)]">
          No declarado por el JNE
        </span>
      )}
    </div>
  );
}

function PartidoValue({ candidato }: { candidato: CandidatoData }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-3 text-center text-sm font-medium text-[var(--color-navy-upao)] [&:first-child]:border-r [&:first-child]:border-[var(--color-border)]">
      <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[var(--color-border)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={candidato.partyLogoUrl}
          alt=""
          aria-hidden
          className="h-4 w-4 object-contain"
        />
      </span>
      {candidato.partyName}
    </div>
  );
}

function FuenteValue({ candidato }: { candidato: CandidatoData }) {
  return (
    <div className="px-4 py-3 text-center text-sm [&:first-child]:border-r [&:first-child]:border-[var(--color-border)]">
      <a
        href={candidato.hojaVidaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-cyan-deep)] hover:underline"
      >
        Hoja de vida (JNE)
        <ArrowUpRight className="h-3 w-3" aria-hidden />
      </a>
    </div>
  );
}

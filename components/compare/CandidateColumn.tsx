"use client";

import { cn } from "@/lib/utils";

export interface CandidateDimensionData {
  problema: string | null;
  objetivo: string | null;
  indicador: string | null;
  meta: string | null;
}

export interface CandidateData {
  id: number;
  nombre_completo: string;
  partido: string;
  plan_pdf_url: string | null;
  candidate_key: "keiko" | "roberto";
}

const PARTIDO_COLOR: Record<"keiko" | "roberto", string> = {
  keiko: "var(--color-candidate-keiko)",
  roberto: "var(--color-candidate-roberto)",
};

export function CandidateHeader({ candidate }: { candidate: CandidateData }) {
  const color = PARTIDO_COLOR[candidate.candidate_key];
  return (
    <header className="space-y-3">
      <div
        className="flex items-center gap-4 rounded-[var(--radius-card)] border bg-white p-4"
        style={{ borderColor: `color-mix(in oklch, ${color} 30%, transparent)` }}
      >
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-mono text-2xl font-bold text-white"
          style={{ backgroundColor: color }}
          aria-hidden
        >
          {candidate.nombre_completo
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0])
            .join("")}
        </div>
        <div className="space-y-0.5">
          <p className="font-display text-lg leading-tight text-[var(--color-navy-upao)]">
            {candidate.nombre_completo}
          </p>
          <p className="text-xs uppercase tracking-widest text-[var(--color-smoke)]">
            {candidate.partido}
          </p>
        </div>
      </div>
      {candidate.plan_pdf_url ? (
        <a
          href={candidate.plan_pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[color-mix(in_oklch,var(--color-smoke)_25%,transparent)] px-4 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:border-[var(--color-cyan-electric)] hover:text-[var(--color-navy-upao)]"
        >
          Descargar plan oficial (PDF) ↗
        </a>
      ) : null}
    </header>
  );
}

function FallbackText() {
  return (
    <span className="text-[var(--color-smoke)] italic">No declarado por el JNE</span>
  );
}

export function CandidateColumn({
  candidate,
  dimension,
}: {
  candidate: CandidateData;
  dimension: CandidateDimensionData | null;
}) {
  const color = PARTIDO_COLOR[candidate.candidate_key];
  const bgTint = `color-mix(in oklch, ${color} 5%, white)`;

  return (
    <section
      className={cn(
        "space-y-4 rounded-[var(--radius-card)] p-5",
      )}
      style={{ backgroundColor: bgTint }}
      aria-label={`Plan de gobierno de ${candidate.nombre_completo}`}
    >
      <CandidateHeader candidate={candidate} />

      <Block label="Problema" value={dimension?.problema} variant="paper" />
      <Block label="Objetivo" value={dimension?.objetivo} variant="ring" />
      <Block label="Indicador" value={dimension?.indicador} variant="charcoal" />
      <Block
        label="Meta"
        value={dimension?.meta}
        variant="candidate"
        accentColor={color}
      />
    </section>
  );
}

function Block({
  label,
  value,
  variant,
  accentColor,
}: {
  label: string;
  value: string | null | undefined;
  variant: "paper" | "ring" | "charcoal" | "candidate";
  accentColor?: string;
}) {
  const baseClasses = "rounded-[var(--radius-card)] border p-4 space-y-2 transition";
  let stylesNode = "";
  let inlineStyle: React.CSSProperties = {};

  if (variant === "paper") {
    stylesNode =
      "bg-[var(--color-paper)] border-[color-mix(in_oklch,var(--color-smoke)_15%,transparent)] text-[var(--color-ink)]";
  } else if (variant === "ring") {
    stylesNode =
      "bg-white border-[color-mix(in_oklch,var(--color-navy-upao)_25%,transparent)] text-[var(--color-ink)]";
  } else if (variant === "charcoal") {
    stylesNode = "bg-[var(--color-charcoal)] border-transparent text-white";
  } else {
    stylesNode = "border-2";
    if (accentColor) {
      inlineStyle = {
        backgroundColor: `color-mix(in oklch, ${accentColor} 6%, white)`,
        borderColor: `color-mix(in oklch, ${accentColor} 35%, transparent)`,
      };
    }
  }

  return (
    <div className={cn(baseClasses, stylesNode)} style={inlineStyle}>
      <p
        className={cn(
          "text-xs uppercase tracking-widest",
          variant === "charcoal" ? "text-[var(--color-cyan-electric)]" : "text-[var(--color-smoke)]",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "whitespace-pre-line text-sm leading-relaxed",
          variant === "charcoal" && "font-mono",
          variant === "candidate" && "font-medium",
        )}
      >
        {value ? value : <FallbackText />}
      </p>
    </div>
  );
}

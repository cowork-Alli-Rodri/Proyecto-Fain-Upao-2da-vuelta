"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight, CheckCircle2, Loader2, ScanSearch, ShieldAlert, ShieldQuestion, Sparkles, X } from "lucide-react";

import { ERROR_MESSAGES } from "@/lib/errors";

import { verifyClaim, type VerifierClaim, type VerifierResult } from "../_actions";

type VerdictKind = "false" | "mostly_false" | "mixed" | "mostly_true" | "true" | "unrated";

const VERDICT_META: Record<
  VerdictKind,
  { label: string; tone: string; bg: string; icon: typeof X }
> = {
  false: {
    label: "Falso",
    tone: "var(--color-coral-pulse)",
    bg: "color-mix(in oklch, var(--color-coral-pulse) 12%, white)",
    icon: X,
  },
  mostly_false: {
    label: "Mayormente falso",
    tone: "var(--color-coral-pulse)",
    bg: "color-mix(in oklch, var(--color-coral-pulse) 8%, white)",
    icon: ShieldAlert,
  },
  mixed: {
    label: "Mezcla / contexto",
    tone: "var(--color-mango-sun)",
    bg: "color-mix(in oklch, var(--color-mango-sun) 14%, white)",
    icon: ShieldQuestion,
  },
  mostly_true: {
    label: "Mayormente verdadero",
    tone: "var(--color-mint-success)",
    bg: "color-mix(in oklch, var(--color-mint-success) 10%, white)",
    icon: CheckCircle2,
  },
  true: {
    label: "Verdadero",
    tone: "var(--color-mint-success)",
    bg: "color-mix(in oklch, var(--color-mint-success) 14%, white)",
    icon: CheckCircle2,
  },
  unrated: {
    label: "Sin clasificar",
    tone: "var(--color-graphite)",
    bg: "var(--color-surface-2)",
    icon: ShieldQuestion,
  },
};

export function VerifierForm() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifierResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await verifyClaim({ query });
      if (!res.ok) {
        const msg =
          res.error.code === "ValidationError"
            ? res.error.message
            : ERROR_MESSAGES[res.error.code] ??
              "No pudimos verificar. Inténtalo en un momento.";
        setError(msg);
        return;
      }
      setResult(res.value);
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label
          htmlFor="vfy-query"
          className="block font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]"
        >
          Pega o escribe el titular / frase
        </label>
        <div className="relative">
          <ScanSearch
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-graphite)]"
            aria-hidden
          />
          <textarea
            id="vfy-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Ej.: "Roberto Sánchez retira a Pedro Castillo del INPE"'
            rows={3}
            maxLength={500}
            disabled={pending}
            className="w-full resize-none rounded-2xl border border-[var(--color-border-strong)] bg-white px-12 py-3 text-sm leading-relaxed text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-cyan-deep)] focus:ring-2 focus:ring-[var(--color-cyan-electric)]/40"
          />
          <span className="absolute bottom-2 right-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
            {query.length}/500
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-graphite)]">
            Buscamos en Google Fact Check Tools · español
          </p>
          <button
            type="submit"
            disabled={pending || query.trim().length < 4}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--color-navy-upao)] px-5 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)] disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Buscando…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden />
                Verificar
              </>
            )}
          </button>
        </div>
      </form>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-[var(--color-coral-pulse)]/40 bg-[var(--color-coral-pulse)]/5 p-4 text-sm text-[var(--color-coral-pulse)]"
        >
          {error}
        </div>
      ) : null}

      {result ? <Results result={result} /> : null}
    </div>
  );
}

function Results({ result }: { result: VerifierResult }) {
  const { summary, claims, query } = result;

  if (claims.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-2)] p-6">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
          Sin coincidencias
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-foreground)]">
          Ningún medio verificador del índice de Google ha revisado{" "}
          <strong>{`"${query}"`}</strong> con esas palabras exactas. Eso{" "}
          <em>no</em> prueba que sea verdadero ni falso: significa que aún no
          está catalogado. Reformula la búsqueda con la frase original (sin
          emojis ni puntuación extra) o revisa los medios del costado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SummaryBar summary={summary} />
      <ul className="space-y-4">
        {claims.map((claim, idx) => (
          <ClaimCard key={`${claim.text}-${idx}`} claim={claim} />
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
        Resultados de Google Fact Check Tools — agrega verificaciones publicadas
        por medios reconocidos (IFCN: International Fact-Checking Network).
        Esta plataforma muestra el veredicto que cada medio publicó; no lo
        modifica.
      </p>
    </div>
  );
}

function SummaryBar({
  summary,
}: {
  summary: VerifierResult["summary"];
}) {
  const total = summary.total;
  if (total === 0) return null;
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;

  const dominant =
    summary.falseLeaning > summary.trueLeaning &&
    summary.falseLeaning > summary.mixed
      ? "false"
      : summary.trueLeaning > summary.falseLeaning &&
          summary.trueLeaning > summary.mixed
        ? "true"
        : summary.mixed > 0
          ? "mixed"
          : "unrated";

  const dominantMeta = VERDICT_META[dominant];
  const DominantIcon = dominantMeta.icon;

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border-l-2 p-5"
      style={{ borderLeftColor: dominantMeta.tone, backgroundColor: dominantMeta.bg }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: dominantMeta.tone }}
        >
          <DominantIcon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
            Veredicto agregado · {total} {total === 1 ? "verificación" : "verificaciones"}
          </p>
          <p
            className="font-display text-lg font-semibold leading-tight"
            style={{ color: dominantMeta.tone }}
          >
            {dominantMeta.label}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-[var(--color-graphite)]">
        {summary.falseLeaning > 0 ? (
          <SummaryChip
            verdict="false"
            n={summary.falseLeaning}
            pct={pct(summary.falseLeaning)}
          />
        ) : null}
        {summary.trueLeaning > 0 ? (
          <SummaryChip
            verdict="true"
            n={summary.trueLeaning}
            pct={pct(summary.trueLeaning)}
          />
        ) : null}
        {summary.mixed > 0 ? (
          <SummaryChip verdict="mixed" n={summary.mixed} pct={pct(summary.mixed)} />
        ) : null}
        {summary.unrated > 0 ? (
          <SummaryChip verdict="unrated" n={summary.unrated} pct={pct(summary.unrated)} />
        ) : null}
      </div>
    </div>
  );
}

function SummaryChip({
  verdict,
  n,
  pct,
}: {
  verdict: VerdictKind;
  n: number;
  pct: string;
}) {
  const meta = VERDICT_META[verdict];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.7rem] font-medium"
      style={{ color: meta.tone, border: `1px solid ${meta.tone}` }}
    >
      {meta.label}: {n} ({pct})
    </span>
  );
}

function ClaimCard({ claim }: { claim: VerifierClaim }) {
  return (
    <li className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
        Afirmación
      </p>
      <p className="mt-1 font-display text-base font-medium leading-snug text-[var(--color-navy-upao)] sm:text-lg">
        {claim.text}
      </p>
      {claim.claimant || claim.claimDate ? (
        <p className="mt-1 text-xs text-[var(--color-graphite)]">
          {claim.claimant ? <>Atribuida a <strong>{claim.claimant}</strong></> : null}
          {claim.claimant && claim.claimDate ? " · " : null}
          {claim.claimDate ? claim.claimDate.slice(0, 10) : null}
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {claim.reviews.map((r, i) => {
          const meta = VERDICT_META[r.verdict];
          const Icon = meta.icon;
          return (
            <li
              key={`${r.url ?? r.publisherName ?? "review"}-${i}`}
              className="rounded-xl border border-[var(--color-border)] p-3"
              style={{ backgroundColor: meta.bg }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold text-white"
                  style={{ backgroundColor: meta.tone }}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {r.textualRating || meta.label}
                </span>
                {r.publisherName ? (
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)]">
                    {r.publisherName}
                  </span>
                ) : null}
              </div>
              {r.title ? (
                <p className="mt-2 text-sm leading-snug text-[var(--color-foreground)]">
                  {r.title}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.7rem] text-[var(--color-graphite)]">
                {r.reviewDate ? <span>Publicado: {r.reviewDate.slice(0, 10)}</span> : null}
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono uppercase tracking-[0.18em] text-[var(--color-cyan-deep)] hover:underline"
                  >
                    Leer verificación
                    <ArrowUpRight className="h-3 w-3" aria-hidden />
                  </a>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createFactCheck, updateFactCheck } from "@/app/(admin)/admin/fact-checks/_actions";
import type { FactCheckInput } from "@/lib/validation/fact-check.schema";

type Mode = "create" | "edit";

export function FactCheckEditor({
  mode,
  initial,
  factCheckId,
}: {
  mode: Mode;
  initial?: Partial<FactCheckInput>;
  factCheckId?: string;
}) {
  const router = useRouter();
  const [titular, setTitular] = useState(initial?.titularFalso ?? "");
  const [contexto, setContexto] = useState(initial?.contexto ?? "");
  const [factChecker, setFactChecker] = useState(initial?.factCheckerName ?? "");
  const [factCheckerUrl, setFactCheckerUrl] = useState(initial?.factCheckerUrl ?? "");
  const [candidato, setCandidato] = useState<FactCheckInput["candidatoRelacionado"] | "">(
    initial?.candidatoRelacionado ?? "",
  );
  const [fechaOrigen, setFechaOrigen] = useState(initial?.fechaOrigen ?? "");
  const [status, setStatus] = useState<FactCheckInput["status"]>(initial?.status ?? "draft");

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      titularFalso: titular,
      contexto,
      factCheckerName: factChecker,
      factCheckerUrl,
      candidatoRelacionado: candidato || undefined,
      fechaOrigen: fechaOrigen || undefined,
      status,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createFactCheck(payload)
          : await updateFactCheck(factCheckId!, payload);

      if (!result.ok) {
        setError(
          result.error.code === "ValidationError"
            ? result.error.message
            : ERROR_MESSAGES[result.error.code],
        );
        return;
      }
      router.push("/admin/fact-checks");
      router.refresh();
    });
  }

  const inputCls =
    "w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm text-[var(--color-foreground)] focus-visible:border-[var(--color-cyan-deep)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--color-cyan-electric)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Titular o afirmación falsa" htmlFor="titular">
        <input
          id="titular"
          type="text"
          required
          minLength={5}
          maxLength={220}
          value={titular}
          onChange={(e) => setTitular(e.target.value)}
          disabled={pending}
          className={inputCls}
        />
      </Field>

      <Field label="Contexto y resumen del fact-check" htmlFor="contexto">
        <textarea
          id="contexto"
          rows={5}
          required
          minLength={20}
          maxLength={1000}
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          disabled={pending}
          className={`${inputCls} resize-y`}
        />
        <p className="text-right text-xs text-[var(--color-muted-foreground)]">
          {contexto.length} / 1000
        </p>
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Medio verificador" htmlFor="factChecker">
          <input
            id="factChecker"
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={factChecker}
            onChange={(e) => setFactChecker(e.target.value)}
            disabled={pending}
            className={inputCls}
            placeholder="Ej. Ojo Público · OjoBiónico"
          />
        </Field>

        <Field label="URL del fact-check" htmlFor="factCheckerUrl">
          <input
            id="factCheckerUrl"
            type="url"
            required
            value={factCheckerUrl}
            onChange={(e) => setFactCheckerUrl(e.target.value)}
            disabled={pending}
            className={inputCls}
            placeholder="https://..."
          />
        </Field>

        <Field label="Candidatura relacionada" htmlFor="candidato">
          <select
            id="candidato"
            value={candidato ?? ""}
            onChange={(e) =>
              setCandidato(e.target.value as FactCheckInput["candidatoRelacionado"])
            }
            disabled={pending}
            className={inputCls}
          >
            <option value="">— (sin asignar)</option>
            <option value="keiko">Keiko Fujimori</option>
            <option value="roberto">Roberto Sánchez</option>
            <option value="ambos">Ambas</option>
            <option value="ninguno">Contexto general</option>
          </select>
        </Field>

        <Field label="Fecha de origen (opcional)" htmlFor="fechaOrigen">
          <input
            id="fechaOrigen"
            type="date"
            value={fechaOrigen}
            onChange={(e) => setFechaOrigen(e.target.value)}
            disabled={pending}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Estado" htmlFor="status">
        <div className="flex gap-2">
          {(["draft", "published", "archived"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              disabled={pending}
              className={cn(
                "rounded-full border-2 px-4 py-1.5 text-sm font-medium transition",
                status === s
                  ? "border-[var(--color-navy-upao)] bg-[var(--color-navy-upao)] text-white"
                  : "border-[var(--color-border)] bg-white text-[var(--color-graphite)] hover:border-[var(--color-border-strong)]",
              )}
            >
              {s === "draft" ? "Borrador" : s === "published" ? "Publicado" : "Archivado"}
            </button>
          ))}
        </div>
      </Field>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-[var(--color-coral-pulse)]/40 bg-[var(--color-coral-pulse)]/5 px-4 py-3 text-sm text-[var(--color-coral-pulse)]"
        >
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-xl bg-[var(--color-navy-upao)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? "Guardando..."
            : mode === "create"
              ? "Crear fact-check"
              : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/fact-checks")}
          disabled={pending}
          className="inline-flex items-center rounded-xl border border-[var(--color-border-strong)] bg-white px-5 py-3 text-sm font-medium text-[var(--color-graphite)] transition hover:border-[var(--color-navy-upao)]"
        >
          Cancelar
        </button>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.75rem 0.875rem;
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          background: white;
          font-size: 0.875rem;
          color: var(--color-foreground);
        }
        :global(.input:focus-visible) {
          outline: none;
          border-color: var(--color-cyan-deep);
          box-shadow: 0 0 0 3px var(--color-cyan-electric);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--color-ink)]">
        {label}
      </label>
      {children}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserMinus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addAllowedTeacherAction,
  demoteTeacherAction,
  removeAllowedTeacherAction,
} from "@/app/(admin)/admin/teachers/_actions";
import { ERROR_MESSAGES } from "@/lib/errors";

export interface AllowedTeacherRow {
  email: string;
  note: string | null;
  added_at: string;
}

export interface ActiveTeacherProfile {
  id: string;
  email: string | null;
  nombres: string | null;
  apellidos: string | null;
}

export function TeachersManager({
  allowed,
  active,
}: {
  allowed: AllowedTeacherRow[];
  active: ActiveTeacherProfile[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await addAllowedTeacherAction({ email, note });
      if (!result.ok) {
        setError(
          result.error.code === "ValidationError"
            ? result.error.message
            : ERROR_MESSAGES[result.error.code],
        );
        return;
      }
      setSuccess(`Habilitado ${result.value.email} como docente.`);
      setEmail("");
      setNote("");
      router.refresh();
    });
  }

  function handleRemove(targetEmail: string) {
    if (!confirm(`Remover ${targetEmail} de la whitelist?`)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await removeAllowedTeacherAction({ email: targetEmail });
      if (!result.ok) {
        setError(
          result.error.code === "ValidationError"
            ? result.error.message
            : ERROR_MESSAGES[result.error.code],
        );
        return;
      }
      router.refresh();
    });
  }

  function handleDemote(userId: string, displayLabel: string) {
    if (
      !confirm(
        `Bajar a estudiante a ${displayLabel}? Si su correo sigue habilitado, el trigger lo volverá a elevar al próximo login.`,
      )
    )
      return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await demoteTeacherAction({ userId });
      if (!result.ok) {
        setError(
          result.error.code === "ValidationError"
            ? result.error.message
            : ERROR_MESSAGES[result.error.code],
        );
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <header className="flex items-baseline gap-3">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
            01
          </span>
          <h2 className="font-display text-2xl font-medium text-[var(--color-navy-upao)]">
            Habilitar nuevo docente
          </h2>
        </header>

        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:grid-cols-[2fr_3fr_auto] md:items-end"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo institucional</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="docente@upao.edu.pe"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Nota (opcional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={1}
              placeholder="Ejemplo: Curso Política Comparada · Ciclo 2026-I."
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Habilitar"}
          </Button>
        </form>

        {error ? (
          <p className="rounded-md border border-[var(--color-coral-pulse)]/40 bg-[var(--color-coral-pulse)]/10 px-3 py-2 text-sm text-[var(--color-coral-pulse)]">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-md border border-[var(--color-mint-success)]/40 bg-[var(--color-mint-success)]/10 px-3 py-2 text-sm text-[var(--color-mint-success)]">
            {success}
          </p>
        ) : null}
      </section>

      <section className="space-y-6">
        <header className="flex items-baseline gap-3">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
            02
          </span>
          <h2 className="font-display text-2xl font-medium text-[var(--color-navy-upao)]">
            Whitelist de docentes habilitados ({allowed.length})
          </h2>
        </header>

        {allowed.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-muted-foreground)]">
            Sin docentes habilitados todavía. Al añadir un correo, cuando el
            docente inicie sesión su rol se elevará automáticamente.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
            {allowed.map((row) => (
              <li
                key={row.email}
                className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="font-mono text-sm text-[var(--color-ink)]">{row.email}</p>
                  {row.note ? (
                    <p className="text-xs text-[var(--color-muted-foreground)]">{row.note}</p>
                  ) : null}
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-graphite)]">
                    Añadido {formatDate(row.added_at)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemove(row.email)}
                  disabled={pending}
                  aria-label={`Remover ${row.email}`}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-6">
        <header className="flex items-baseline gap-3">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
            03
          </span>
          <h2 className="font-display text-2xl font-medium text-[var(--color-navy-upao)]">
            Docentes activos ahora ({active.length})
          </h2>
        </header>

        {active.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-muted-foreground)]">
            Ningún usuario tiene actualmente rol docente.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
            {active.map((p) => {
              const display =
                [p.nombres, p.apellidos].filter(Boolean).join(" ") || p.email || p.id;
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--color-ink)]">{display}</p>
                    {p.email ? (
                      <p className="font-mono text-xs text-[var(--color-muted-foreground)]">
                        {p.email}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemote(p.id, display)}
                    disabled={pending}
                  >
                    <UserMinus className="size-3.5" /> Bajar a estudiante
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

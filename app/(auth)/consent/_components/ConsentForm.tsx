"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { acceptConsent } from "../_actions";
import { ERROR_MESSAGES } from "@/lib/errors";

export function ConsentForm({ consentVersion }: { consentVersion: string }) {
  const [terms, setTerms] = useState(false);
  const [dataUse, setDataUse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!terms || !dataUse) {
      setError(ERROR_MESSAGES.ConsentMissing);
      return;
    }
    startTransition(async () => {
      const result = await acceptConsent({
        termsAccepted: terms,
        dataUseAccepted: dataUse,
        consentVersion,
      });
      if (!result.ok) {
        const msg =
          result.error.code === "ValidationError"
            ? result.error.message
            : ERROR_MESSAGES[result.error.code];
        setError(msg);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[var(--radius-card)] border border-[color-mix(in_oklch,var(--color-navy-upao)_15%,transparent)] bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms"
          checked={terms}
          onCheckedChange={(v) => setTerms(v === true)}
          disabled={pending}
          className="mt-0.5"
        />
        <Label htmlFor="terms" className="text-sm leading-relaxed text-[var(--color-ink)]">
          He leído y acepto los términos del estudio, incluyendo el plazo de conservación de
          12 meses y la anonimización posterior.
        </Label>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="dataUse"
          checked={dataUse}
          onCheckedChange={(v) => setDataUse(v === true)}
          disabled={pending}
          className="mt-0.5"
        />
        <Label htmlFor="dataUse" className="text-sm leading-relaxed text-[var(--color-ink)]">
          <strong>Autorizo el uso de mis datos personales</strong> para la investigación
          académica del docente. Sé que puedo revocar esta autorización en cualquier momento
          desde mi perfil.
        </Label>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-coral-pulse)]">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || !terms || !dataUse}
        className="w-full bg-[var(--color-navy-upao)] text-white hover:bg-[var(--color-navy-deep)]"
      >
        {pending ? "Guardando..." : "Acepto y continuar"}
      </Button>

      <p className="text-xs text-[var(--color-smoke)]">
        Versión del consentimiento: <span className="font-mono">{consentVersion}</span>
      </p>
    </form>
  );
}

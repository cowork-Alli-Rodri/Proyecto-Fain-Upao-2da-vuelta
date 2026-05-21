"use client";

import { useState, useTransition } from "react";

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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Texto legal scrollable */}
      <article className="max-h-[420px] overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm leading-relaxed text-[var(--color-foreground)] shadow-[var(--shadow-soft)]">
        <h2 className="font-display text-xl text-[var(--color-navy-upao)]">
          Texto legal del consentimiento
        </h2>
        <div className="mt-4 space-y-4">
          <p>
            <strong>Voto Informado UPAO</strong> es una plataforma académica del docente del
            curso para estudiantes de pregrado de la Universidad Privada Antenor Orrego (Trujillo,
            Perú). Su objetivo es analizar las preferencias declaradas por los estudiantes tras
            explorar los planes oficiales del JNE de los candidatos de la Segunda Vuelta
            Electoral 2026.
          </p>

          <div className="space-y-1">
            <p className="font-medium text-[var(--color-navy-upao)]">Qué se recoge</p>
            <ul className="list-disc space-y-1 pl-5 text-[var(--color-graphite)]">
              <li>Nombres y apellidos, correo, facultad, carrera, ciclo, rango de edad y género (opcional).</li>
              <li>Tus respuestas al cuestionario.</li>
              <li>La preferencia final que declares (candidato, nivel de confianza, motivo).</li>
              <li>Eventos anónimos de uso (sin identificarte).</li>
            </ul>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-[var(--color-navy-upao)]">Plazo de conservación</p>
            <p>
              Tus datos personales se conservarán únicamente por un máximo de{" "}
              <strong className="font-mono">12 meses</strong> después del cierre del ciclo
              académico. Pasado ese plazo serán <strong>anonimizados de forma irreversible</strong>:
              tus respuestas se mantendrán solo en forma agregada y sin posibilidad de vincularse
              a tu identidad.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-[var(--color-navy-upao)]">Tus derechos</p>
            <p>
              Puedes solicitar el borrado completo de tus datos en cualquier
              momento desde tu perfil. Tienes derecho a acceder, rectificar y
              oponerte al tratamiento de tus datos personales.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-[var(--color-navy-upao)]">Neutralidad</p>
            <p>
              Esta plataforma <strong>no emite recomendaciones de voto</strong>. El comparador
              muestra los datos oficiales del JNE sin filtros editoriales.
            </p>
          </div>
        </div>
      </article>

      {/* Dos checkboxes obligatorios */}
      <div className="space-y-4">
        <CheckBlock
          checked={terms}
          onCheckedChange={setTerms}
          disabled={pending}
          id="terms"
        >
          He leído y acepto los términos del estudio, incluyendo el plazo de conservación de
          12 meses y la anonimización posterior.
        </CheckBlock>

        <CheckBlock
          checked={dataUse}
          onCheckedChange={setDataUse}
          disabled={pending}
          id="dataUse"
        >
          <strong>Autorizo el uso de mis datos personales</strong> para la investigación
          académica del docente. Sé que puedo revocar esta autorización en cualquier momento
          desde mi perfil.
        </CheckBlock>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-[var(--color-coral-pulse)]/40 bg-[var(--color-coral-pulse)]/5 px-4 py-3 text-sm text-[var(--color-coral-pulse)]"
        >
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={pending || !terms || !dataUse}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-navy-upao)] px-5 py-4 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Guardando..." : "Acepto y continuar"}
          <span
            aria-hidden
            className="inline-block transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </button>
        <p className="text-center text-xs text-[var(--color-muted-foreground)]">
          Versión del consentimiento: <span className="font-mono">{consentVersion}</span>
        </p>
      </div>
    </form>
  );
}

function CheckBlock({
  id,
  checked,
  onCheckedChange,
  disabled,
  children,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-4 rounded-2xl border bg-[var(--color-surface)] p-5 transition ${
        checked
          ? "border-[var(--color-navy-upao)] shadow-[var(--shadow-soft)]"
          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
      }`}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        disabled={disabled}
        className="mt-0.5 size-5"
      />
      <Label
        htmlFor={id}
        className="cursor-pointer text-sm leading-relaxed text-[var(--color-foreground)]"
      >
        {children}
      </Label>
    </label>
  );
}

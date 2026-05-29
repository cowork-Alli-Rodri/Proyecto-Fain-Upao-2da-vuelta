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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Texto legal scrollable.
          `data-lenis-prevent` evita que el smooth scroll de Lenis intercepte
          la rueda del mouse y el touch dentro de este contenedor — así el
          scroll local funciona en desktop y mobile. */}
      <article
        data-lenis-prevent
        className="max-h-[44vh] min-h-[260px] overflow-y-auto overscroll-contain rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm leading-relaxed text-[var(--color-foreground)] shadow-[var(--shadow-soft)] sm:p-6"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <h2 className="font-display text-xl text-[var(--color-navy-upao)]">
          Texto legal del consentimiento
        </h2>
        <div className="mt-4 space-y-4">
          <p>
            La plataforma de la <strong>FAIN-UPAO</strong> es una herramienta
            académica del curso para estudiantes de pregrado de la Universidad Privada Antenor
            Orrego (Trujillo, Perú). Se basa en las ofertas electorales oficiales de los
            candidatos presidenciales de la Segunda Vuelta 2026 y busca promover la toma de
            decisiones objetiva y crítica mediante la identificación de la información falsa o
            engañosa que circula en redes, a partir de las propuestas oficiales registradas
            ante el JNE.
          </p>

          <div className="space-y-1">
            <p className="font-medium text-[var(--color-navy-upao)]">Qué se recoge</p>
            <ul className="list-disc space-y-1 pl-5 text-[var(--color-graphite)]">
              <li>Nombres y apellidos, correo, facultad, carrera, ciclo, rango de edad y género (opcional).</li>
              <li>Tus respuestas al cuestionario.</li>
              <li>La decisión final que declares (candidato, nivel de confianza, motivo).</li>
              <li>Eventos anónimos de uso (sin identificarte).</li>
            </ul>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-[var(--color-navy-upao)]">Cuánto tiempo guardamos tus datos</p>
            <p>
              Tu nombre, correo y demás datos personales se guardan hasta{" "}
              <strong className="font-mono">12 meses</strong> después de que termine el
              ciclo del curso. Pasado ese tiempo, <strong>se borran y no se pueden
              recuperar</strong>: tus respuestas quedan solo como cifras agrupadas, sin forma
              de saber que eran tuyas.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-[var(--color-navy-upao)]">Tus derechos</p>
            <p>
              Puedes pedir que borremos por completo tus datos en cualquier
              momento desde tu perfil. También puedes verlos, corregirlos o
              pedirnos que dejemos de usarlos.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-[var(--color-navy-upao)]">No te decimos por quién votar</p>
            <p>
              Esta plataforma <strong>no recomienda candidatos</strong>. Te mostramos lo
              que cada uno publicó oficialmente en el JNE, sin editarlo.
            </p>
          </div>
        </div>
      </article>

      {/* Dos checkboxes obligatorios */}
      <div className="space-y-2.5">
        <CheckBlock
          checked={terms}
          onCheckedChange={setTerms}
          disabled={pending}
          id="terms"
        >
          Entiendo cómo se usan mis datos: se guardan hasta 12 meses después
          del cierre del curso y luego se borran, dejando solo cifras agrupadas
          sin que se sepa que eran mías.
        </CheckBlock>

        <CheckBlock
          checked={dataUse}
          onCheckedChange={setDataUse}
          disabled={pending}
          id="dataUse"
        >
          <strong>Doy permiso para que mis datos personales se usen</strong> en el
          trabajo académico del docente. Sé que puedo retirar este permiso en cualquier
          momento desde mi perfil.
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

      <div className="space-y-2">
        <button
          type="submit"
          disabled={pending || !terms || !dataUse}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-navy-upao)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)] disabled:cursor-not-allowed disabled:opacity-40"
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
      className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-[var(--color-surface)] px-4 py-3 transition ${
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

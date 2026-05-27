"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Error boundary global (constitución VI: mensaje contextual, nunca "Error 500").
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es-PE">
      <body>
        <main className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-2xl space-y-4 text-left">
            <h1 className="font-display text-4xl text-[var(--color-navy-upao)]">
              Algo salió mal
            </h1>
            <p className="text-base text-[var(--color-smoke)]">
              No pudimos cargar esta página. Intenta de nuevo. Si el problema persiste,
              contacta al docente del curso.
            </p>
            <pre className="whitespace-pre-wrap rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-xs leading-relaxed text-[var(--color-foreground)]">
              {error.name}: {error.message}
              {error.digest ? `\n\nref: ${error.digest}` : ""}
              {error.stack ? `\n\n${error.stack}` : ""}
            </pre>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-navy-upao)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)] focus-visible:ring-2 focus-visible:ring-[var(--color-cyan-electric)]"
            >
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

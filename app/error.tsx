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
          <div className="max-w-lg space-y-4 text-center">
            <h1 className="font-display text-4xl text-[var(--color-navy-upao)]">
              Algo salió mal
            </h1>
            <p className="text-base text-[var(--color-smoke)]">
              No pudimos cargar esta página. Intenta de nuevo. Si el problema persiste,
              contacta al docente del curso.
            </p>
            {error.digest ? (
              <p className="font-mono text-xs text-[var(--color-smoke)]">
                ref: {error.digest}
              </p>
            ) : null}
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

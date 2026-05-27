"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    if (typeof window !== "undefined") {
      console.error("[student route error]", error.message, error.digest, error.stack);
    }
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-lg space-y-4 text-center">
        <h1 className="font-display text-4xl text-[var(--color-navy-upao)]">Algo salió mal</h1>
        <p className="text-base text-[var(--color-smoke)]">{error.message || "No pudimos cargar esta página."}</p>
        {error.digest ? (
          <p className="font-mono text-xs text-[var(--color-smoke)]">ref: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-navy-upao)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)]"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-lg space-y-4 text-center">
        <h1 className="font-display text-5xl text-[var(--color-navy-upao)]">404</h1>
        <p className="text-base text-[var(--color-smoke)]">
          No encontramos la página que buscas.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-navy-upao)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)]"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

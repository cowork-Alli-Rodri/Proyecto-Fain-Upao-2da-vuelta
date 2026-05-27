import Link from "next/link";

/**
 * Link de cierre de sesión consistente para usar en los headers de las
 * páginas autenticadas. Apunta a `/auth/signout` que cierra sesión
 * server-side y redirige a `/`.
 */
export function SignOutLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/auth/signout"
      prefetch={false}
      className={`font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] transition hover:text-[var(--color-orange-upao)] sm:text-[0.7rem] sm:tracking-[0.2em] ${className}`}
    >
      Salir
    </Link>
  );
}

/**
 * Link de cierre de sesión consistente para usar en los headers de las
 * páginas autenticadas. Apunta a `/auth/signout` que cierra sesión
 * server-side y redirige a `/`.
 *
 * Usa `<a>` nativo (no `<Link>`) a propósito: el signout necesita una
 * navegación completa para que el server limpie cookies y la página destino se
 * re-renderice sin sesión. Con `<Link>`, el router client-side reusa el RSC
 * cacheado y la UI sigue mostrando al usuario como logueado.
 */
export function SignOutLink({ className = "" }: { className?: string }) {
  return (
    <a
      href="/auth/signout"
      className={`font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] transition hover:text-[var(--color-orange-upao)] sm:text-[0.7rem] sm:tracking-[0.2em] ${className}`}
    >
      Salir
    </a>
  );
}

import { Loader2 } from "lucide-react";

/**
 * Estado de carga consistente para usar en `loading.tsx` (fallback de Suspense
 * durante la navegación a rutas server-side con queries).
 */
export function PageLoader({ label = "Cargando…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-[var(--color-graphite)]"
    >
      <Loader2 className="h-7 w-7 animate-spin text-[var(--color-navy-upao)]" aria-hidden />
      <p className="font-mono text-xs uppercase tracking-[0.2em]">{label}</p>
    </div>
  );
}

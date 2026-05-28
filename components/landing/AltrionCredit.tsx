import Image from "next/image";
import Link from "next/link";

/**
 * Crédito "Desarrollado por Altrion Partners".
 *
 * Usa el logo oficial a color (lockup horizontal: isotipo + wordmark
 * "ALTRION PARTNERS") provisto en RECURSOS, copiado a `public/brand/`. Es PNG
 * con fondo transparente, apto para el hero navy. Enlaza al sitio de Altrion.
 */
export function AltrionCredit({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Link
        href="https://altrionpartners.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Desarrollado por Altrion Partners"
        className="group inline-flex flex-col items-end gap-2"
      >
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-white/45 transition-colors group-hover:text-white/70">
          Desarrollado por
        </span>
        <Image
          src="/brand/altrion-partners-white.png"
          alt="Altrion Partners"
          width={1219}
          height={356}
          priority={false}
          className="h-9 w-auto opacity-90 transition-opacity group-hover:opacity-100 sm:h-10"
        />
      </Link>
    </div>
  );
}

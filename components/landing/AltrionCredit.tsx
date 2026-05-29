import Image from "next/image";
import Link from "next/link";

/**
 * Crédito "Desarrollado por Altrion Partners".
 *
 * Usa el logo oficial (lockup horizontal: isotipo + wordmark
 * "ALTRION PARTNERS") provisto en RECURSOS, copiado a `public/brand/`. Hay dos
 * variantes PNG con fondo transparente:
 *  - `onDark`  → logo blanco, para el hero navy.
 *  - `onLight` → logo a color, para superficies claras (footer).
 */
type AltrionTone = "onDark" | "onLight";
type AltrionAlign = "start" | "center" | "end";

export function AltrionCredit({
  className = "",
  tone = "onDark",
  align = "end",
}: {
  className?: string;
  tone?: AltrionTone;
  align?: AltrionAlign;
}) {
  const onDark = tone === "onDark";
  const alignItems =
    align === "center"
      ? "items-center"
      : align === "start"
        ? "items-start"
        : "items-end";

  return (
    <div className={className}>
      <Link
        href="https://altrionpartners.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Desarrollado por Altrion Partners"
        className={`group inline-flex flex-col gap-2 ${alignItems}`}
      >
        <span
          className={`font-mono text-[0.6rem] uppercase tracking-[0.28em] transition-colors ${
            onDark
              ? "text-white/45 group-hover:text-white/70"
              : "text-[var(--color-graphite)]/55 group-hover:text-[var(--color-graphite)]/85"
          }`}
        >
          Desarrollado por
        </span>
        <Image
          src={
            onDark
              ? "/brand/altrion-partners-white.png"
              : "/brand/altrion-partners.png"
          }
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

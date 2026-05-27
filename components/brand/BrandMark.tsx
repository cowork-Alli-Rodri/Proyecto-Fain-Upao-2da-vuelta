/**
 * Marca institucional reutilizable: "FAIN-UPAO" con FAIN destacado en
 * naranja institucional. El orden FAIN primero refleja que el proyecto es
 * de la Facultad de Administración, Ingeniería y Negocios — la unidad
 * organizativa concreta — y la institución es la Universidad Privada
 * Antenor Orrego. El guion es decisión del owner; debe respetarse en todo
 * el sitio cualquier mención a la universidad.
 *
 * Exporta también `BrandBar` — la barrita vertical (h-6 w-1) que va
 * pegada al texto y unifica el lockup en todos los headers.
 *
 * Acepta un `context` opcional (sufijo) y un `prefix` opcional:
 *
 *   <BrandMark context="Voto Informado e Instruido" />
 *     → "FAIN-UPAO · Voto Informado e Instruido"
 *
 *   <BrandMark prefix="Cuestionario" />
 *     → "Cuestionario · FAIN-UPAO"
 *
 * `tone="onDark"` invierte la paleta para fondos oscuros (hero navy).
 */
export function BrandMark({
  prefix,
  context,
  hideContextOnMobile = false,
  tone = "default",
  className = "",
}: {
  prefix?: string;
  context?: string;
  hideContextOnMobile?: boolean;
  tone?: "default" | "onDark";
  className?: string;
}) {
  const isDark = tone === "onDark";
  const textColor = isDark ? "text-white/85" : "text-[var(--color-graphite)]";
  const dotColor = isDark ? "text-white/35" : "text-[var(--color-mist)]";

  return (
    <p
      className={`font-mono text-[0.65rem] uppercase tracking-[0.18em] sm:text-[0.7rem] sm:tracking-[0.2em] ${textColor} ${className}`}
    >
      {prefix ? (
        <>
          <span className={hideContextOnMobile ? "hidden sm:inline" : ""}>
            {prefix}
            <Dot color={dotColor} />
          </span>
        </>
      ) : null}
      <span
        className="font-semibold text-[var(--color-orange-upao)]"
        title="FAIN — Facultad de Administración, Ingeniería y Negocios"
      >
        FAIN
      </span>
      <span aria-hidden>-</span>
      UPAO
      {context ? (
        <>
          <span className={hideContextOnMobile ? "hidden sm:inline" : ""}>
            <Dot color={dotColor} />
            {context}
          </span>
        </>
      ) : null}
    </p>
  );
}

function Dot({ color }: { color: string }) {
  return <span className={`mx-1.5 ${color}`}>·</span>;
}

/**
 * Barra vertical institucional con degradé navy → naranja UPAO.
 * Se coloca pegada a la izquierda de `BrandMark` para unificar el lockup
 * en todos los headers del producto.
 *
 * `tone="onDark"` reemplaza el navy por blanco para que la barra siga siendo
 * visible en headers oscuros (la mitad inferior queda en naranja UPAO).
 */
export function BrandBar({
  className = "h-6 sm:h-7",
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "onDark";
}) {
  const topColor = tone === "onDark" ? "rgba(255,255,255,0.9)" : "var(--color-navy-upao)";
  return (
    <span
      className={`block w-1 ${className}`}
      style={{
        background: `linear-gradient(to bottom, ${topColor} 0%, ${topColor} 55%, var(--color-orange-upao) 55%, var(--color-orange-upao) 100%)`,
      }}
      aria-hidden
    />
  );
}

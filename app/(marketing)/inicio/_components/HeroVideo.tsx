/**
 * Video hero del /inicio: el en vivo de Facebook de la Dra. Tula sobre la
 * Segunda Vuelta 2026. Reemplaza la animación pixart anterior por material
 * real y verificable. El embed usa el plugin oficial de video de Facebook.
 */

const FB_VIDEO_URL =
  "https://www.facebook.com/JNE.Peru/videos/1299888265636776/";
const FB_EMBED_SRC = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
  FB_VIDEO_URL,
)}&show_text=false&autoplay=false&width=560`;

export function HeroVideo() {
  return (
    <figure className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-navy-upao)] shadow-[var(--shadow-fluffy)]">
      <div className="relative aspect-video w-full">
        <iframe
          src={FB_EMBED_SRC}
          title="En vivo en Facebook sobre la Segunda Vuelta Presidencial 2026"
          className="absolute inset-0 h-full w-full"
          style={{ border: "none", overflow: "hidden" }}
          scrolling="no"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        />
      </div>

      <figcaption className="border-t border-white/10 bg-[var(--color-navy-upao)] p-5 sm:p-6">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--color-orange-upao-soft)]">
          En vivo · Segunda Vuelta 2026
        </p>
        <p className="mt-1.5 font-display text-lg font-medium leading-snug text-white sm:text-xl">
          Primero tu punto de vista. Después los planes.{" "}
          <span className="italic text-[var(--color-orange-upao-soft)]">
            Al final, tu decisión.
          </span>
        </p>
        <a
          href={FB_VIDEO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-white/80 underline-offset-4 transition hover:text-white hover:underline"
        >
          Ver en Facebook
          <span aria-hidden>↗</span>
        </a>
      </figcaption>
    </figure>
  );
}

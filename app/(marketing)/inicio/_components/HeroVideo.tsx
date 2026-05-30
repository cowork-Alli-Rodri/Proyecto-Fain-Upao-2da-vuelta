/**
 * Video hero del /inicio: el en vivo de Facebook de la Dra. Tula sobre la
 * Segunda Vuelta 2026.
 *
 * No se embebe con iframe: Facebook niega ese video al reproductor anónimo
 * (sin sesión del usuario) y devuelve "Video no disponible". En vez de un
 * recuadro vacío, mostramos un póster de marca con botón de reproducción que
 * abre el video en Facebook, donde sí se reproduce.
 */

import { Play } from "lucide-react";

import { AngelOrnament } from "@/components/landing/AngelOrnament";

const FB_VIDEO_URL =
  "https://www.facebook.com/JNE.Peru/videos/1299888265636776/";

export function HeroVideo() {
  return (
    <figure className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] shadow-[var(--shadow-fluffy)]">
      <a
        href={FB_VIDEO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ver en Facebook el video del JNE sobre la Segunda Vuelta Presidencial 2026"
        className="group relative block aspect-video w-full overflow-hidden bg-[var(--color-navy-upao)]"
      >
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[var(--color-navy-upao)] via-[var(--color-navy-deep)] to-[var(--color-navy-upao)]"
        />
        <AngelOrnament className="pointer-events-none absolute -right-8 top-1/2 h-[150%] w-auto -translate-y-1/2 opacity-[0.12] mix-blend-screen" />
        <span
          aria-hidden
          className="absolute left-0 top-0 h-1 w-24 bg-[var(--color-orange-upao)] transition-all duration-500 group-hover:w-40"
        />

        {/* Botón de reproducción */}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/40 backdrop-blur-sm transition duration-300 group-hover:scale-105 group-hover:bg-white/20 sm:h-20 sm:w-20">
            <Play
              className="h-6 w-6 translate-x-0.5 fill-white text-white sm:h-8 sm:w-8"
              aria-hidden
            />
          </span>
        </span>

        {/* Pista de que abre en Facebook */}
        <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/80 transition-colors group-hover:text-white">
          Ver en Facebook
          <span aria-hidden>↗</span>
        </span>
      </a>

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
      </figcaption>
    </figure>
  );
}

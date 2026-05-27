"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

/**
 * Video hero del /inicio. Autoplay muted loop por defecto. Controles mínimos
 * superpuestos: play/pause + sonido. Pensado para reproducirse sin sonido
 * mientras el usuario lee, y que active audio si lo desea.
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);

  // Marca como "playing" según el estado real del elemento.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => undefined);
    else v.pause();
  }

  function toggleMuted() {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
    if (!next && v.paused) v.play().catch(() => undefined);
  }

  return (
    <figure className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-navy-upao)] shadow-[var(--shadow-fluffy)]">
      <video
        ref={videoRef}
        src="/pixart/electoral.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label="Animación pixart del proyecto Voto Informado e Instruido — Segunda Vuelta 2026"
        className="block aspect-video w-full object-cover"
      />

      {/* Gradiente inferior para legibilidad del caption */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
      />

      {/* Caption: tagline editorial */}
      <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--color-orange-upao-soft)]">
          Voto Informado e Instruido · 2026
        </p>
        <p className="mt-1.5 font-display text-lg font-medium leading-snug text-white sm:text-xl">
          Primero tu postura. Después los planes.{" "}
          <span className="italic text-[var(--color-orange-upao-soft)]">
            Al final, tu decisión.
          </span>
        </p>
      </figcaption>

      {/* Controles flotantes */}
      <div className="absolute right-3 top-3 flex gap-2">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pausar video" : "Reanudar video"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[var(--color-navy-upao)] backdrop-blur transition hover:bg-white"
        >
          {playing ? (
            <Pause className="h-4 w-4" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={toggleMuted}
          aria-label={muted ? "Activar sonido" : "Silenciar"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[var(--color-navy-upao)] backdrop-blur transition hover:bg-white"
        >
          {muted ? (
            <VolumeX className="h-4 w-4" aria-hidden />
          ) : (
            <Volume2 className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </figure>
  );
}

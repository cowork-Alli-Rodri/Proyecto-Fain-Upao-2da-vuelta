"use client";

import { useEffect, useRef } from "react";

/**
 * Ornamento decorativo del Ángel de Trujillo — silueta estilizada en single-line SVG.
 *
 * Animación: cada trazo se dibuja con `stroke-dasharray` (efecto "single line
 * drawing"). Respeta `prefers-reduced-motion` y solo dispara cuando entra al
 * viewport (IntersectionObserver — sin GSAP para mantener el SVG ligero).
 */
export function AngelOrnament({ className }: { className?: string }) {
  const rootRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const paths = Array.from(node.querySelectorAll<SVGGeometryElement>("[data-animate]"));
    if (paths.length === 0) return;

    for (const p of paths) {
      try {
        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
        p.style.transition = "stroke-dashoffset 1.6s cubic-bezier(0.22, 1, 0.36, 1)";
      } catch {
        // getTotalLength puede fallar en algunos elementos en SSR rehydrate.
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            for (const p of paths) {
              p.style.strokeDashoffset = "0";
            }
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 400 400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      style={{
        color: "var(--color-navy-upao)",
        opacity: 0.35,
      }}
    >
      <defs>
        <linearGradient id="angel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-navy-upao)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--color-cyan-deep)" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Halo */}
      <circle data-animate cx="200" cy="120" r="50" stroke="url(#angel-grad)" strokeWidth="1" />
      <circle data-animate cx="200" cy="120" r="38" stroke="url(#angel-grad)" strokeWidth="0.8" opacity="0.6" />

      {/* Cabeza */}
      <circle data-animate cx="200" cy="130" r="22" stroke="url(#angel-grad)" />

      {/* Cuello + torso */}
      <path
        data-animate
        d="M 200 152 L 200 180 M 180 180 L 220 180 L 230 280 L 170 280 Z"
        stroke="url(#angel-grad)"
      />

      {/* Alas */}
      <path
        data-animate
        d="M 180 180 C 120 180, 80 220, 70 280 C 75 250, 110 230, 175 220 Z
           M 220 180 C 280 180, 320 220, 330 280 C 325 250, 290 230, 225 220 Z"
        stroke="url(#angel-grad)"
        fill="none"
      />

      {/* Túnica que cae */}
      <path
        data-animate
        d="M 170 280 L 150 380 L 250 380 L 230 280
           M 185 290 L 175 380
           M 200 290 L 200 380
           M 215 290 L 225 380"
        stroke="url(#angel-grad)"
      />

      {/* Trompeta */}
      <path
        data-animate
        d="M 230 200 L 290 175 L 305 165 L 310 175 L 295 185 L 235 210 Z"
        stroke="url(#angel-grad)"
      />
      <line data-animate x1="295" y1="170" x2="310" y2="155" stroke="url(#angel-grad)" strokeWidth="2" />

      {/* Líneas de movimiento alrededor */}
      <line data-animate x1="80" y1="100" x2="120" y2="130" stroke="url(#angel-grad)" strokeWidth="0.5" opacity="0.5" />
      <line data-animate x1="320" y1="100" x2="280" y2="130" stroke="url(#angel-grad)" strokeWidth="0.5" opacity="0.5" />
      <line data-animate x1="60" y1="200" x2="100" y2="200" stroke="url(#angel-grad)" strokeWidth="0.5" opacity="0.5" />
      <line data-animate x1="340" y1="200" x2="300" y2="200" stroke="url(#angel-grad)" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Patrón geométrico animado para el hero.
 *
 * Composición:
 *  - Líneas diagonales finas que cruzan en sentidos opuestos (parallax sutil)
 *  - Tres formas triangulares grandes traslúcidas con drift muy lento
 *  - Grid de puntos suave en el fondo para textura sin saturar
 *
 * Honra `prefers-reduced-motion`: si está activo, todo queda estático.
 * Pensado para componer encima de un fondo plano (ej. navy-upao) — no
 * inyecta su propio color de fondo.
 */
export function GeometricBackdrop({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Grid de puntos muy sutil para textura */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="dot-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>

      {/* Líneas diagonales finas — sweep horizontal lento */}
      <motion.svg
        className="absolute inset-0 h-full w-[110%] opacity-[0.09]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        animate={reduce ? undefined : { x: ["-5%", "5%", "-5%"] }}
        transition={
          reduce
            ? undefined
            : { duration: 22, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {Array.from({ length: 14 }).map((_, i) => {
          const offset = i * 140;
          return (
            <line
              key={i}
              x1={offset - 200}
              y1={0}
              x2={offset + 400}
              y2={900}
              stroke="white"
              strokeWidth="1"
            />
          );
        })}
      </motion.svg>

      {/* Líneas en sentido opuesto, más espaciadas */}
      <motion.svg
        className="absolute inset-0 h-full w-[110%] opacity-[0.05]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        animate={reduce ? undefined : { y: ["-3%", "3%", "-3%"] }}
        transition={
          reduce
            ? undefined
            : { duration: 18, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {Array.from({ length: 8 }).map((_, i) => {
          const offset = i * 230;
          return (
            <line
              key={i}
              x1={offset + 1300}
              y1={0}
              x2={offset + 600}
              y2={900}
              stroke="white"
              strokeWidth="1"
            />
          );
        })}
      </motion.svg>

      {/* Triángulos grandes traslúcidos como masas geométricas */}
      <motion.svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        initial={reduce ? false : { opacity: 0 }}
        animate={reduce ? undefined : { opacity: 1 }}
        transition={{ duration: 1.6, ease: EASE }}
      >
        {/* Triángulo coral grande arriba a la derecha */}
        <polygon
          points="1200,0 1200,420 720,0"
          fill="var(--color-orange-upao)"
          opacity="0.08"
        />
        {/* Cuña cyan electric en la mitad derecha */}
        <polygon
          points="1200,250 1200,800 600,800"
          fill="var(--color-cyan-electric)"
          opacity="0.06"
        />
        {/* Acento coral abajo a la izquierda */}
        <polygon
          points="0,800 360,800 0,560"
          fill="var(--color-coral-pulse)"
          opacity="0.07"
        />
      </motion.svg>

      {/* Viñeta radial para dar profundidad sin tapar el contenido */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 40%, transparent 0%, rgba(0,0,0,0.18) 80%)",
        }}
      />
    </div>
  );
}

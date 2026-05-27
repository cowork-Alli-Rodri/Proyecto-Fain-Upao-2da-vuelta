"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Wedge diagonal animado para partir el hero en dos zonas cromáticas.
 *
 * Se compone encima de un fondo plano (ej. navy-upao) y dibuja un polígono
 * que entra desde la derecha en un ángulo asimétrico. Al cargar la página,
 * el polígono se desliza desde fuera del viewport (sweep-in) y deja la
 * composición final dividida.
 *
 * Acepta `tone` para elegir el color de la cuña ("graphite" por defecto;
 * "deep" usa el navy-deep para un contraste más sutil).
 */
export function DiagonalSplit({
  tone = "graphite",
  className = "",
}: {
  tone?: "graphite" | "deep" | "cyan";
  className?: string;
}) {
  const reduce = useReducedMotion();

  const fill =
    tone === "deep"
      ? "var(--color-navy-deep)"
      : tone === "cyan"
        ? "color-mix(in oklch, var(--color-cyan-electric) 18%, var(--color-navy-deep))"
        : "color-mix(in oklch, var(--color-graphite) 50%, var(--color-navy-deep))";

  return (
    <motion.svg
      aria-hidden
      className={`pointer-events-none absolute inset-y-0 right-0 h-full w-[60%] md:w-[48%] lg:w-[42%] ${className}`}
      viewBox="0 0 600 800"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={reduce ? false : { x: "20%", opacity: 0 }}
      animate={reduce ? undefined : { x: 0, opacity: 1 }}
      transition={{ duration: 1.1, ease: EASE, delay: 0.1 }}
    >
      {/* Cuña principal */}
      <polygon points="600,0 600,800 60,800 360,0" fill={fill} opacity="0.92" />
      {/* Borde fino coral en la diagonal */}
      <line
        x1="360"
        y1="0"
        x2="60"
        y2="800"
        stroke="var(--color-orange-upao)"
        strokeWidth="1.6"
        opacity="0.6"
      />
      {/* Acento sutil en la diagonal interna */}
      <line
        x1="395"
        y1="0"
        x2="100"
        y2="800"
        stroke="var(--color-cyan-electric)"
        strokeWidth="0.8"
        opacity="0.35"
      />
    </motion.svg>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Tarjeta-etiqueta con marco editorial. Aparece con un reveal stagger:
 *  1. Línea superior tracksa de izquierda a derecha
 *  2. Texto principal hace fade-up
 *  3. Línea inferior se dibuja al final
 *
 * Pensada para usarse como pieza focal de un hero (composición tipo
 * "card framing" — marco que enmarca el título del proceso electoral).
 */
const EASE = [0.22, 1, 0.36, 1] as const;

export function AnimatedLabel({
  kicker,
  children,
  className = "",
}: {
  kicker?: string;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
      className={`relative inline-flex flex-col items-stretch ${className}`}
    >
      {/* Marco editorial */}
      <div className="relative border-2 border-white/30 px-7 py-6 sm:px-9 sm:py-8">
        {/* Esquinas cromadas */}
        <Corner position="tl" />
        <Corner position="tr" />
        <Corner position="bl" />
        <Corner position="br" />

        {kicker ? (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
            className="mb-3 text-center font-mono text-[0.65rem] uppercase tracking-[0.3em] text-[var(--color-cyan-electric)] sm:text-[0.7rem]"
          >
            {kicker}
          </motion.p>
        ) : null}

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
        >
          {children}
        </motion.div>
      </div>

      {/* Sweep tracksa superior */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -top-px left-0 h-[3px] bg-[var(--color-orange-upao)]"
        initial={reduce ? { width: "30%" } : { width: 0 }}
        animate={reduce ? undefined : { width: "30%" }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
      />
      {/* Sweep tracksa inferior */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -bottom-px right-0 h-[3px] bg-[var(--color-cyan-electric)]"
        initial={reduce ? { width: "20%" } : { width: 0 }}
        animate={reduce ? undefined : { width: "20%" }}
        transition={{ duration: 0.7, delay: 0.9, ease: "easeOut" }}
      />
    </motion.div>
  );
}

function Corner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const base =
    "pointer-events-none absolute h-2.5 w-2.5 border-white/80 sm:h-3 sm:w-3";
  const map: Record<typeof position, string> = {
    tl: "left-[-2px] top-[-2px] border-l-2 border-t-2",
    tr: "right-[-2px] top-[-2px] border-r-2 border-t-2",
    bl: "left-[-2px] bottom-[-2px] border-b-2 border-l-2",
    br: "right-[-2px] bottom-[-2px] border-b-2 border-r-2",
  };
  return <span aria-hidden className={`${base} ${map[position]}`} />;
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Tarjeta-etiqueta del hero. Reusa exactamente el mismo tratamiento visual que
 * el cuadro "Cuenta regresiva" del costado: vidrio frosted (bg-white translúcido
 * + backdrop-blur), bordes redondeados y acento naranja en el borde izquierdo.
 * El contenido aparece con un reveal stagger (fade-up del kicker y del título).
 *
 * El resplandor que la hace leer como vidrio sobre el navy vive en el contenedor
 * padre (page.tsx), igual que la cuña diagonal vive detrás del contador.
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
      className={`relative inline-flex flex-col items-stretch rounded-2xl border-l-2 border-[var(--color-orange-upao)] bg-white/[0.06] backdrop-blur-sm ${className}`}
    >
      <div className="relative p-6 sm:p-7">
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
    </motion.div>
  );
}

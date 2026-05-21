"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Barra de progreso de scroll en el top de la página.
 * Sticky bajo el header. Usa el progress global del documento.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-[var(--color-cyan-deep)] via-[var(--color-cyan-electric)] to-[var(--color-navy-upao)]"
      aria-hidden
    />
  );
}

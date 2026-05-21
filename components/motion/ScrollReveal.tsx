"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade";
  className?: string;
  amount?: number;
  once?: boolean;
}

const OFFSETS: Record<NonNullable<Props["direction"]>, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  fade: { x: 0, y: 0 },
};

/**
 * Revela el contenido cuando entra al viewport. Combina con Lenis para un scroll
 * coherente. Honra prefers-reduced-motion automáticamente (Framer Motion lo hace).
 */
export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className,
  amount = 0.2,
  once = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount, once });
  const offset = OFFSETS[direction];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: offset.x, y: offset.y }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

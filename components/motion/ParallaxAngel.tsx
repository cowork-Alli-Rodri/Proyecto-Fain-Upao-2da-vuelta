"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { AngelOrnament } from "@/components/landing/AngelOrnament";

/**
 * Ángel de Trujillo con parallax sutil (movimiento vertical inverso al scroll).
 * El offset es leve para no marear; respeta prefers-reduced-motion.
 */
export function ParallaxAngel({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-40, 60]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-3, 3]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1.02, 1]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y, rotate, scale }}>
        <AngelOrnament />
      </motion.div>
    </div>
  );
}

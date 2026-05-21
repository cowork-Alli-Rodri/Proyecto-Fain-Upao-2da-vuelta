"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Provider de smooth scroll global (docs/design.md).
 * Respeta `prefers-reduced-motion`: cuando está activo, no inicializa Lenis.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const handle = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(handle);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}

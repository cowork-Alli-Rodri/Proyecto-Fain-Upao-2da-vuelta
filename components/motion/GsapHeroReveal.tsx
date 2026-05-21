"use client";

import { useEffect, useRef } from "react";

/**
 * Reveal animado del hero con GSAP + ScrollTrigger.
 *
 * Aplica un text-mask sobre los hijos directos:
 *   - clip-path: inset(0 100% 0 0) → inset(0 0 0 0)
 *   - traslación leve sincronizada
 *
 * Carga GSAP con `next/dynamic` style (importación dinámica dentro de useEffect)
 * para evitar añadir el bundle al SSR. Respeta `prefers-reduced-motion`.
 *
 * Uso:
 *   <GsapHeroReveal>
 *     <p>línea 1</p>
 *     <p>línea 2</p>
 *   </GsapHeroReveal>
 */
export function GsapHeroReveal({
  children,
  className,
  stagger = 0.12,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !ref.current) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !ref.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const targets = ref.current.children;
      gsap.set(targets, {
        clipPath: "inset(0 100% 0 0)",
        y: 18,
        opacity: 0.0001,
      });

      const tween = gsap.to(targets, {
        clipPath: "inset(0 0% 0 0)",
        y: 0,
        opacity: 1,
        duration: 0.95,
        ease: "power3.out",
        stagger,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 80%",
          once: true,
        },
      });

      cleanup = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

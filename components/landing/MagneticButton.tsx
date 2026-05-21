"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { usePointerFineNoMotion } from "@/lib/hooks/usePointerFineNoMotion";

/**
 * Botón "magnético": el centro del botón se desplaza ~6px hacia el cursor
 * cuando éste se acerca. Honra `prefers-reduced-motion` y se desactiva en
 * pointers gruesos (touch).
 */
interface MagneticButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  className?: string;
}

const ATTRACTION_RADIUS = 90;
const MAX_OFFSET = 6;

export function MagneticButton({
  href,
  children,
  variant = "primary",
  className = "",
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const enabled = usePointerFineNoMotion();

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;

    function onMove(e: MouseEvent) {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const distance = Math.hypot(dx, dy);
      if (distance > ATTRACTION_RADIUS) {
        setOffset({ x: 0, y: 0 });
        return;
      }
      const factor = (1 - distance / ATTRACTION_RADIUS) * MAX_OFFSET;
      const angle = Math.atan2(dy, dx);
      setOffset({ x: Math.cos(angle) * factor, y: Math.sin(angle) * factor });
    }

    function onLeave() {
      setOffset({ x: 0, y: 0 });
    }

    window.addEventListener("mousemove", onMove);
    node.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      node.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled]);

  const baseClass =
    variant === "primary"
      ? "inline-flex min-h-[48px] items-center justify-center rounded-full bg-[var(--color-navy-upao)] px-7 py-3 text-sm font-medium text-white shadow-[0_8px_24px_-12px_var(--color-navy-deep)] transition-colors hover:bg-[var(--color-navy-deep)] sm:text-base"
      : "inline-flex min-h-[48px] items-center justify-center rounded-full border border-[var(--color-navy-upao)] px-6 py-3 text-sm font-medium text-[var(--color-navy-upao)] transition-colors hover:bg-[var(--color-navy-upao)] hover:text-white sm:text-base";

  return (
    <Link
      ref={ref}
      href={href}
      className={`${baseClass} ${className}`}
      style={{
        // `translate(0,0)` es estable entre server y cliente — evitamos
        // `undefined` que se serializa diferente y dispara hydration mismatch.
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition:
          "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), background-color 200ms, color 200ms",
      }}
    >
      {children}
    </Link>
  );
}

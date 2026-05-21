"use client";

import { useSyncExternalStore } from "react";

/**
 * Detecta de forma SSR-segura si el dispositivo es un pointer "fine"
 * (mouse / trackpad) y NO tiene `prefers-reduced-motion: reduce`.
 *
 * Usa `useSyncExternalStore` para evitar hydration mismatch: el snapshot
 * del servidor siempre devuelve `false`, y el del cliente lee las media
 * queries reales. Si las preferencias del usuario cambian (por ejemplo
 * conecta/desconecta un mouse), el componente se re-renderiza
 * automáticamente.
 */

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const fine = window.matchMedia("(pointer: fine)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  fine.addEventListener("change", callback);
  reduce.addEventListener("change", callback);
  return () => {
    fine.removeEventListener("change", callback);
    reduce.removeEventListener("change", callback);
  };
}

function getClientSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return fine && !reduce;
}

function getServerSnapshot(): boolean {
  // El server siempre asume "no enabled" para que la primera pasada de
  // hidratación coincida con lo que renderizó el server.
  return false;
}

export function usePointerFineNoMotion(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

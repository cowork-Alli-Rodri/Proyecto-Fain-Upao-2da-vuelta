"use client";

import { useEffect, useRef } from "react";

import { captureEvent } from "./posthog";
import type { AnalyticsEvent } from "./events";

/**
 * Hook ligero que dispara `captureEvent(event, payload)` UNA sola vez al
 * montar el componente. Útil para `*_viewed`, `*_started`.
 *
 * `payload` se serializa con `JSON.stringify` en la dependencia para detectar
 * cambios reales sin re-disparar por referencia nueva.
 */
export function useTrackOnce(
  event: AnalyticsEvent,
  payload?: Record<string, unknown>,
): void {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    captureEvent(event, payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, JSON.stringify(payload ?? {})]);
}

/**
 * Trackea el tiempo que el usuario pasa en un componente. Al desmontar
 * (o al `submit`), llama a `captureEvent(event, { ...payload, duration_ms })`.
 *
 * Devuelve una función `flush()` para emitir el evento manualmente antes
 * del unmount (ej. al hacer click en "Continuar").
 */
export function useTimeSpent(
  event: AnalyticsEvent,
  payload?: Record<string, unknown>,
): () => void {
  // useRef sin inicializador-llamada (Date.now es impuro; lo seteamos en effect).
  const startedAt = useRef<number>(0);
  const fired = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now();
    return () => {
      if (fired.current) return;
      fired.current = true;
      captureEvent(event, {
        ...(payload ?? {}),
        duration_ms: Date.now() - startedAt.current,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return () => {
    if (fired.current) return;
    fired.current = true;
    captureEvent(event, {
      ...(payload ?? {}),
      duration_ms: Date.now() - startedAt.current,
    });
  };
}

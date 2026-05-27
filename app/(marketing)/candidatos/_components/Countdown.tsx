"use client";

import { useSyncExternalStore } from "react";

import { ELECTION_DATE_ISO } from "./candidatos-data";

function getDaysRemaining(targetIso: string, nowMs: number): number {
  const target = new Date(targetIso).getTime();
  const diff = target - nowMs;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function subscribe(callback: () => void): () => void {
  const id = setInterval(callback, 60 * 60 * 1000);
  return () => clearInterval(id);
}

function getSnapshot(): number {
  return getDaysRemaining(ELECTION_DATE_ISO, Date.now());
}

function getServerSnapshot(): null {
  return null;
}

export function Countdown() {
  const days = useSyncExternalStore<number | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <div className="flex items-stretch gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur sm:px-5 sm:py-3.5">
      <div className="flex flex-col items-start justify-center pr-3 sm:pr-4">
        <span className="font-display text-base font-semibold leading-tight text-[var(--color-navy-upao)] sm:text-lg">
          7 de junio
        </span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-graphite)]">
          2.ª vuelta · 2026
        </span>
      </div>
      <div
        className="w-px shrink-0 self-stretch"
        style={{ backgroundColor: "var(--color-border-strong)" }}
        aria-hidden
      />
      <div className="flex flex-col items-center justify-center pl-1 sm:pl-2">
        <span
          className="font-display text-3xl font-semibold leading-none text-[var(--color-orange-upao)] tabular-nums sm:text-4xl"
          aria-live="polite"
        >
          {days === null ? "—" : days}
        </span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-graphite)]">
          Días
        </span>
      </div>
    </div>
  );
}

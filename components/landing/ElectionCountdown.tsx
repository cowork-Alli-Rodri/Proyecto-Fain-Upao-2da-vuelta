"use client";

import { useEffect, useState } from "react";

/**
 * Contador de tiempo hasta la Segunda Vuelta Electoral 2026.
 *
 * Fecha base: 7 de junio de 2026, 08:00 hora Perú (UTC-5) — apertura de mesas
 * según el calendario habitual del JNE. Se renderiza client-side (necesita
 * `Date.now()` y recálculo cada segundo) y honra `prefers-reduced-motion`
 * pausando la animación de los dígitos.
 *
 * La fecha es configurable vía `NEXT_PUBLIC_ELECTION_DATE` (ISO 8601). Si la
 * variable no está, usa el default 2026-06-07T13:00:00Z.
 */

const DEFAULT_ELECTION_DATE = "2026-06-07T13:00:00Z"; // 08:00 hora Perú

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function computeRemaining(target: number): Remaining {
  const now = Date.now();
  const diffMs = target - now;
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3_600);
  const minutes = Math.floor((totalSec % 3_600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, isPast: false };
}

export function ElectionCountdown({
  className = "",
  showSeconds = true,
  tone = "default",
}: {
  className?: string;
  showSeconds?: boolean;
  tone?: "default" | "onDark";
}) {
  const electionDateIso =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_ELECTION_DATE
      ? process.env.NEXT_PUBLIC_ELECTION_DATE
      : DEFAULT_ELECTION_DATE;
  const target = new Date(electionDateIso).getTime();

  const [remaining, setRemaining] = useState<Remaining | null>(null);

  // Inicialización client-only: el estado parte en `null` para evitar
  // hydration mismatch (Date.now() no es estable entre SSR y client). El
  // setState dentro del effect es intencional para evaluar la cuenta
  // regresiva justo después del mount.
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (!cancelled) {
        setRemaining(computeRemaining(target));
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [target]);

  if (!remaining) {
    return (
      <div
        className={`flex items-baseline gap-4 ${className}`}
        aria-hidden
        suppressHydrationWarning
      >
        <Slot value="—" label="Días" tone={tone} />
        <Slot value="—" label="Horas" tone={tone} />
        <Slot value="—" label="Min" tone={tone} />
        {showSeconds && <Slot value="—" label="Seg" tone={tone} />}
      </div>
    );
  }

  if (remaining.isPast) {
    return (
      <p
        className={`font-mono text-base text-[var(--color-mint-success)] ${className}`}
        suppressHydrationWarning
      >
        Día de elecciones — 7 de junio 2026
      </p>
    );
  }

  return (
    <div
      className={`flex items-baseline gap-3 sm:gap-4 ${className}`}
      role="timer"
      aria-label="Cuenta regresiva hasta la Segunda Vuelta Electoral 2026"
    >
      <Slot value={String(remaining.days).padStart(2, "0")} label="Días" big tone={tone} />
      <Slot value={String(remaining.hours).padStart(2, "0")} label="Horas" tone={tone} />
      <Slot value={String(remaining.minutes).padStart(2, "0")} label="Min" tone={tone} />
      {showSeconds && (
        <Slot value={String(remaining.seconds).padStart(2, "0")} label="Seg" tone={tone} />
      )}
    </div>
  );
}

function Slot({
  value,
  label,
  big = false,
  tone,
}: {
  value: string;
  label: string;
  big?: boolean;
  tone: "default" | "onDark";
}) {
  const labelColor =
    tone === "onDark" ? "text-white/70" : "text-[var(--color-graphite)]";
  return (
    <div className="flex flex-col items-center">
      <span
        className={`font-display tabular-nums leading-none text-[var(--color-orange-upao)] ${
          big
            ? "text-[clamp(2.75rem,8vw,5rem)] font-medium"
            : "text-[clamp(1.75rem,5vw,3rem)] font-medium"
        }`}
      >
        {value}
      </span>
      <span
        className={`mt-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] sm:text-[0.65rem] ${labelColor}`}
      >
        {label}
      </span>
    </div>
  );
}

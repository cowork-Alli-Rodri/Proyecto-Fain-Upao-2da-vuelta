import Image from "next/image";
import { ArrowUpRight, ImageOff } from "lucide-react";

import type { VicePresidentSlot } from "./candidatos-data";

export function VicePresidentCard({
  vp,
  align = "left",
}: {
  vp: VicePresidentSlot;
  align?: "left" | "right";
}) {
  return (
    <a
      href={vp.hojaVidaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "group flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition hover:border-[var(--color-orange-upao)]/50 hover:shadow-[var(--shadow-soft)] " +
        (align === "right" ? "text-right" : "text-left")
      }
    >
      <div
        className="relative w-full shrink-0 overflow-hidden bg-gradient-to-b from-[var(--color-bone)] to-[var(--color-surface-3)]"
        style={{ aspectRatio: "2 / 3" }}
      >
        {vp.photoUrl ? (
          <Image
            src={vp.photoUrl}
            alt={`Foto oficial de ${vp.fullName}`}
            fill
            sizes="(min-width: 1280px) 200px, (min-width: 768px) 180px, 45vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
            <ImageOff
              className="h-5 w-5 text-[var(--color-mist)]"
              aria-hidden
            />
            <span className="font-mono text-[0.55rem] uppercase leading-tight tracking-[0.1em] text-[var(--color-graphite)]">
              Foto no disponible
            </span>
          </div>
        )}
      </div>
      <div className="space-y-2 px-3 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-5">
        <p className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] sm:text-[0.6rem]">
          {vp.title}
        </p>
        <p className="line-clamp-2 text-[0.8rem] font-medium leading-snug text-[var(--color-navy-upao)] sm:text-[0.85rem]">
          {vp.fullName}
        </p>
        <p
          className={
            "mt-2 flex items-center gap-1 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-graphite)] transition group-hover:text-[var(--color-orange-upao)] sm:text-[0.6rem] " +
            (align === "right" ? "justify-end" : "")
          }
        >
          Ver hoja de vida{" "}
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </p>
      </div>
    </a>
  );
}

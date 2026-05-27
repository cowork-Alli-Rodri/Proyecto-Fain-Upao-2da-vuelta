"use client";

import { useState } from "react";
import { ExternalLink, FileText, PlaySquare, Tv, UserRoundSearch } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { CandidatoData } from "./candidatos-data";
import { DEBATES } from "./candidatos-data";

type ModalKind = "plan" | "video" | "debates" | null;

export function CandidatoActions({
  candidato,
  align = "left",
}: {
  candidato: CandidatoData;
  align?: "left" | "right";
}) {
  const [modal, setModal] = useState<ModalKind>(null);

  const buttonBase =
    "group inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-[0.78rem] font-medium text-[var(--color-navy-upao)] transition hover:border-[var(--color-orange-upao)] hover:text-[var(--color-orange-upao)] sm:text-[0.82rem]";

  return (
    <>
      <div
        className={
          "flex flex-wrap gap-2 " + (align === "right" ? "justify-end" : "")
        }
      >
        <a
          href={candidato.hojaVidaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonBase}
        >
          <UserRoundSearch className="h-4 w-4" aria-hidden />
          Hoja de Vida
        </a>
        <button
          type="button"
          onClick={() => setModal("plan")}
          className={buttonBase}
        >
          <FileText className="h-4 w-4" aria-hidden />
          Plan de Gobierno
        </button>
        <button
          type="button"
          onClick={() => setModal("video")}
          className={buttonBase}
        >
          <PlaySquare className="h-4 w-4" aria-hidden />
          Presentación
        </button>
        <button
          type="button"
          onClick={() => setModal("debates")}
          className={buttonBase}
        >
          <Tv className="h-4 w-4" aria-hidden />
          Debates JNE
        </button>
      </div>

      {/* Modal: Plan de Gobierno (CTA a PDF oficial — el JNE bloquea iframes) */}
      <Dialog open={modal === "plan"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-h-[92vh] w-full max-w-[min(92vw,42rem)] overflow-hidden p-0">
          <DialogHeader className="flex flex-row items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-3">
            <div className="flex items-center gap-3">
              <PartyLogoPill candidato={candidato} />
              <div className="text-left">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
                  Plan de Gobierno · JNE
                </p>
                <DialogTitle className="font-display text-base text-[var(--color-navy-upao)]">
                  {candidato.displayName}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Plan de Gobierno oficial de {candidato.partyName} registrado en el Jurado Nacional de Elecciones.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex flex-col items-center gap-5 px-5 py-8 sm:px-8 sm:py-10">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `color-mix(in oklch, ${candidato.partyAccentHex} 12%, white)`,
              }}
              aria-hidden
            >
              <FileText
                className="h-8 w-8"
                style={{ color: candidato.partyAccentHex }}
              />
            </div>
            <div className="text-center">
              <h3 className="font-display text-lg font-medium text-[var(--color-navy-upao)] sm:text-xl">
                Plan de Gobierno oficial · {candidato.partyName}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-graphite)]">
                El JNE no permite incrustar su PDF en otros sitios por política
                de seguridad. Ábrelo en pestaña nueva — el plan completo siempre
                llega desde el servidor oficial.
              </p>
            </div>
            <a
              href={candidato.planPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--color-navy-upao)] px-5 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)]"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Abrir PDF oficial del JNE
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Video de Presentación */}
      <Dialog open={modal === "video"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="w-full max-w-[min(92vw,52rem)] overflow-hidden p-0 sm:max-w-[min(92vw,52rem)]">
          <DialogHeader className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-3">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
              Video de presentación · JNE
            </p>
            <DialogTitle className="font-display text-base text-[var(--color-navy-upao)]">
              {candidato.displayName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Video de presentación oficial registrado por {candidato.partyName} ante el JNE.
            </DialogDescription>
          </DialogHeader>
          <video
            controls
            preload="metadata"
            className="aspect-video w-full bg-black"
            src={candidato.presentationVideoUrl}
          >
            Tu navegador no soporta la reproducción de video.
          </video>
        </DialogContent>
      </Dialog>

      {/* Modal: Debates JNE */}
      <Dialog open={modal === "debates"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-h-[88vh] w-full max-w-[min(92vw,42rem)] overflow-y-auto p-0">
          <DialogHeader className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-3">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
              Debates JNE · 2.ª vuelta 2026
            </p>
            <DialogTitle className="font-display text-base text-[var(--color-navy-upao)]">
              {candidato.displayName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Cronograma de debates del JNE para la segunda vuelta presidencial 2026.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 px-5 py-5 sm:px-6">
            {DEBATES.map((group) => (
              <section key={group.group} className="space-y-3">
                <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-orange-upao-deep)]">
                  {group.groupLabel}
                </h3>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <article
                      key={item.name}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className="font-display text-base font-medium text-[var(--color-navy-upao)]">
                          {item.name}
                        </h4>
                        <span className="rounded-full bg-[var(--color-orange-upao)]/12 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-orange-upao-deep)]">
                          {item.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-graphite)]">
                        {item.dateLabel}
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {item.topics.map((t) => (
                          <li
                            key={t}
                            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[0.7rem] text-[var(--color-graphite)]"
                          >
                            {t}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PartyLogoPill({ candidato }: { candidato: CandidatoData }) {
  return (
    <span
      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[var(--color-border)]"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={candidato.partyLogoUrl}
        alt={candidato.partyName}
        className="h-7 w-7 object-contain"
      />
    </span>
  );
}

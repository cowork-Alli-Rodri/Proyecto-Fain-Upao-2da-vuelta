import Image from "next/image";

import { CandidatoActions } from "./CandidatoActions";
import { CANDIDATOS, type CandidatoData } from "./candidatos-data";
import { Countdown } from "./Countdown";
import { VicePresidentCard } from "./VicePresidentCard";

const keiko = CANDIDATOS.keiko;
const roberto = CANDIDATOS.roberto;

export function CandidatosSplitView() {
  return (
    <>
      {/* ============================================================
       * DESKTOP / TABLET (md+): split-screen JNE-style
       * ============================================================ */}
      <section
        aria-label="Comparador segunda vuelta 2026"
        className="relative hidden min-h-[calc(100vh-72px)] overflow-hidden bg-gradient-to-b from-[var(--color-surface)] via-[var(--color-surface-2)] to-[var(--color-bone)] md:block"
      >
        {/* Tinte sutil por candidato como fondo de cada mitad */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 right-1/2"
          style={{
            background: `linear-gradient(180deg, color-mix(in oklch, ${keiko.partyAccentHex} 5%, transparent), transparent 60%)`,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 left-1/2"
          style={{
            background: `linear-gradient(180deg, color-mix(in oklch, ${roberto.partyAccentHex} 5%, transparent), transparent 60%)`,
          }}
        />

        {/* Línea diagonal central — naranja UPAO institucional */}
        <DiagonalDivider />

        {/* Fotos oficiales (centro de cada hemisferio, prominentes) */}
        <CandidatoPhoto candidato={keiko} side="left" />
        <CandidatoPhoto candidato={roberto} side="right" />

        {/* Capas de contenido — bordes y centro */}
        <div className="relative z-20 mx-auto grid h-full min-h-[calc(100vh-72px)] max-w-[1700px] grid-cols-[minmax(320px,400px)_1fr_minmax(280px,360px)_1fr_minmax(320px,400px)] gap-4 px-4 py-6 lg:gap-6 lg:px-8 lg:py-8">
          {/* LEFT EDGE — Keiko card */}
          <CandidatoCard candidato={keiko} side="left" />

          {/* spacer column (photo flows behind) */}
          <div aria-hidden />

          {/* CENTER — countdown + badge + visits */}
          <CentralBanner />

          {/* spacer column (photo flows behind) */}
          <div aria-hidden />

          {/* RIGHT EDGE — Roberto card */}
          <CandidatoCard candidato={roberto} side="right" />
        </div>
      </section>

      {/* ============================================================
       * MOBILE (<md): stacked cards
       * ============================================================ */}
      <section
        aria-label="Comparador segunda vuelta 2026 — móvil"
        className="block bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface-2)] md:hidden"
      >
        <div className="mx-auto max-w-md px-4 py-8 sm:max-w-lg">
          <CentralBannerMobile />
          <div className="mt-8 space-y-8">
            <MobileCandidatoCard candidato={keiko} />
            <MobileCandidatoCard candidato={roberto} />
          </div>
        </div>
      </section>
    </>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

function DiagonalDivider() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 z-10 -translate-x-1/2"
    >
      <div
        className="h-full w-[3px]"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, var(--color-orange-upao) 8%, var(--color-orange-upao) 92%, transparent 100%)",
          transform: "skewX(-7deg)",
          filter: "drop-shadow(0 0 18px color-mix(in oklch, var(--color-orange-upao) 35%, transparent))",
        }}
      />
    </div>
  );
}

function CandidatoPhoto({
  candidato,
  side,
}: {
  candidato: CandidatoData;
  side: "left" | "right";
}) {
  return (
    <div
      aria-hidden
      className={
        // Containers exactamente espejados respecto al 50% (eje del DiagonalDivider):
        // izq de 18% a 50%, der de 50% a 82%. Esto garantiza que el ancho disponible
        // a cada lado sea idéntico y que ninguna foto invada el lado del otro.
        "pointer-events-none absolute bottom-0 top-[40px] z-10 hidden md:block " +
        (side === "left" ? "left-[18%] right-1/2" : "right-[18%] left-1/2")
      }
    >
      <Image
        src={candidato.photoUrl}
        alt={`Foto oficial de ${candidato.displayName}`}
        fill
        priority
        sizes="(min-width: 1280px) 44vw, 50vw"
        className="object-contain object-bottom drop-shadow-[0_28px_30px_rgba(15,18,35,0.18)]"
      />
    </div>
  );
}

function CandidatoCard({
  candidato,
  side,
}: {
  candidato: CandidatoData;
  side: "left" | "right";
}) {
  const align = side;
  return (
    <article
      className={
        "flex flex-col gap-4 self-start rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-5 shadow-[var(--shadow-soft)] backdrop-blur lg:p-6 " +
        (align === "right" ? "items-end text-right" : "items-start text-left")
      }
    >
      <PartyBadge candidato={candidato} align={align} />
      <h2
        className={
          "font-display text-[clamp(1.4rem,2.4vw,2.1rem)] font-semibold leading-[1.05] tracking-tight text-[var(--color-navy-upao)] " +
          (align === "right" ? "text-right" : "")
        }
      >
        {candidato.displayName.toUpperCase()}
      </h2>
      <CandidatoActions candidato={candidato} align={align} />

      <div
        className={
          "mt-3 w-full space-y-2 border-t border-dashed border-[var(--color-border)] pt-3 " +
          (align === "right" ? "text-right" : "")
        }
      >
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
          — Vicepresidentes
        </p>
        <div className="grid grid-cols-1 items-start gap-2 lg:grid-cols-2">
          {candidato.vicePresidents.map((vp) => (
            <VicePresidentCard
              key={vp.fullName}
              vp={vp}
              align={align}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

function PartyBadge({
  candidato,
  align,
}: {
  candidato: CandidatoData;
  align: "left" | "right";
}) {
  return (
    <div
      className={
        "flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/90 px-2.5 py-1.5 shadow-[var(--shadow-soft)] " +
        (align === "right" ? "flex-row-reverse" : "")
      }
    >
      <span
        className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full"
        style={{
          backgroundColor: `color-mix(in oklch, ${candidato.partyAccentHex} 15%, white)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={candidato.partyLogoUrl}
          alt={candidato.partyName}
          className="h-5 w-5 object-contain"
        />
      </span>
      <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-navy-upao)] sm:text-[0.7rem]">
        {candidato.partyName}
      </span>
    </div>
  );
}

function CentralBanner() {
  return (
    <div className="relative z-20 flex flex-col items-center justify-between gap-4 py-2">
      <Countdown />
      <SegundaEleccionBadge />
      <VisitsCounter />
    </div>
  );
}

function CentralBannerMobile() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Countdown />
      <SegundaEleccionBadge />
      <VisitsCounter />
    </div>
  );
}

function SegundaEleccionBadge() {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-5 py-3 text-center shadow-[var(--shadow-soft)] backdrop-blur">
      <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-orange-upao-deep)]">
        Segunda elección
      </p>
      <p className="font-display text-xl font-semibold uppercase leading-none text-[var(--color-navy-upao)] sm:text-2xl">
        Presidencial
      </p>
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-graphite)]">
        Elecciones generales{" "}
        <span className="font-semibold text-[var(--color-navy-upao)]">2026</span>
      </p>
    </div>
  );
}

function VisitsCounter() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3.5 py-1.5 shadow-[var(--shadow-soft)] backdrop-blur">
      <span
        className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-coral-pulse)]"
        aria-hidden
      />
      <span className="font-mono text-[0.7rem] font-semibold tabular-nums text-[var(--color-navy-upao)]">
        FAIN-UPAO
      </span>
    </div>
  );
}

function MobileCandidatoCard({ candidato }: { candidato: CandidatoData }) {
  return (
    <article
      className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]"
      style={{
        borderTop: `4px solid color-mix(in oklch, ${candidato.partyAccentHex} 70%, transparent)`,
      }}
    >
      {/* Aspect 3:4 vertical (matchea el video vertical) — el personaje se ve grande y proporcional */}
      <div
        className="relative aspect-[3/4] w-full overflow-hidden"
        style={{
          background: `linear-gradient(180deg, color-mix(in oklch, ${candidato.partyAccentHex} 8%, white), white)`,
        }}
      >
        <Image
          src={candidato.photoUrl}
          alt={`Foto oficial de ${candidato.displayName}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain object-bottom"
        />
      </div>
      <div className="space-y-4 p-5">
        <PartyBadge candidato={candidato} align="left" />
        <h2 className="font-display text-xl font-semibold leading-tight text-[var(--color-navy-upao)] sm:text-2xl">
          {candidato.displayName.toUpperCase()}
        </h2>
        <CandidatoActions candidato={candidato} align="left" />
        <div className="space-y-2 border-t border-dashed border-[var(--color-border)] pt-4">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--color-graphite)]">
            — Vicepresidentes
          </p>
          {/* 2 columnas en mobile — VPs más compactas, no full-width gigantes */}
          <div className="grid grid-cols-2 items-start gap-2">
            {candidato.vicePresidents.map((vp) => (
              <VicePresidentCard key={vp.fullName} vp={vp} align="left" />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

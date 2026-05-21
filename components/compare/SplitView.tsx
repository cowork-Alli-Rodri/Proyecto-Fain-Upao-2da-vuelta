"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import {
  CandidateColumn,
  type CandidateData,
  type CandidateDimensionData,
} from "./CandidateColumn";
import { captureEvent } from "@/lib/analytics/posthog";
import { useTrackOnce } from "@/lib/analytics/useTrack";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

type DimensionKey = "social" | "economica" | "ambiental" | "institucional";

const DIMENSIONS: { key: DimensionKey; label: string; color: string }[] = [
  { key: "social", label: "Social", color: "var(--color-cyan-deep)" },
  { key: "economica", label: "Económica", color: "var(--color-mango-sun)" },
  { key: "ambiental", label: "Ambiental", color: "var(--color-mint-success)" },
  { key: "institucional", label: "Institucional", color: "var(--color-coral-pulse)" },
];

export interface SplitViewData {
  candidateLeft: CandidateData;
  candidateRight: CandidateData;
  dimensionsLeft: Record<DimensionKey, CandidateDimensionData | null>;
  dimensionsRight: Record<DimensionKey, CandidateDimensionData | null>;
}

export function SplitView({ data }: { data: SplitViewData }) {
  const [tab, setTab] = useState<DimensionKey>("social");
  const active = DIMENSIONS.find((d) => d.key === tab)!;
  const viewedDimensions = useRef<Set<DimensionKey>>(new Set(["social"]));
  const enteredAt = useRef<number>(0);

  // Comparador visualizado (una vez por sesión del componente).
  useTrackOnce(ANALYTICS_EVENTS.COMPARATOR_VIEWED);

  // Tiempo total en el comparador — útil para SC-004 (mediana ≥ 4 min).
  useEffect(() => {
    enteredAt.current = Date.now();
    const start = enteredAt.current;
    function emit() {
      captureEvent(ANALYTICS_EVENTS.COMPARATOR_TIME_SPENT, {
        duration_ms: Date.now() - start,
        dimensions_viewed: viewedDimensions.current.size,
      });
    }
    window.addEventListener("beforeunload", emit);
    return () => {
      emit();
      window.removeEventListener("beforeunload", emit);
    };
  }, []);

  function handleTabChange(next: DimensionKey) {
    if (next !== tab) {
      viewedDimensions.current.add(next);
      captureEvent(ANALYTICS_EVENTS.COMPARATOR_DIMENSION_VIEWED, { dimension: next });
    }
    setTab(next);
  }

  return (
    <div className="space-y-8">
      {/* Tab bar editorial */}
      <div className="-mx-6 overflow-x-auto px-6">
        <div className="inline-flex min-w-full gap-2 border-b border-[var(--color-border)] pb-px md:min-w-0">
          {DIMENSIONS.map((d) => {
            const isActive = d.key === tab;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => handleTabChange(d.key)}
                className={`relative shrink-0 px-5 py-3 text-sm font-medium transition ${
                  isActive
                    ? "text-[var(--color-navy-upao)]"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-navy-upao)]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: d.color }}
                    aria-hidden
                  />
                  {d.label}
                </span>
                {isActive ? (
                  <motion.span
                    layoutId="active-tab-underline"
                    className="absolute inset-x-0 -bottom-px h-0.5"
                    style={{ backgroundColor: active.color }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido split */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          <CandidateColumn
            candidate={data.candidateLeft}
            dimension={data.dimensionsLeft[tab]}
          />
          <CandidateColumn
            candidate={data.candidateRight}
            dimension={data.dimensionsRight[tab]}
          />
        </motion.div>
      </AnimatePresence>

      {/* CTA final */}
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <p className="editorial-kicker">Última etapa</p>
            <h2 className="font-display text-2xl text-[var(--color-navy-upao)] sm:text-3xl">
              Cuando termines de explorar,{" "}
              <span className="italic text-[var(--color-cyan-deep)]">declara tu preferencia</span>
              .
            </h2>
            <p className="text-sm text-[var(--color-graphite)]">
              Esta plataforma no emite recomendaciones. Tu respuesta es para el análisis del docente.
            </p>
          </div>
          <Link
            href="/preferencia"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--color-navy-upao)] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[var(--color-navy-deep)]"
          >
            Marcar mi preferencia
            <span
              aria-hidden
              className="inline-block transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

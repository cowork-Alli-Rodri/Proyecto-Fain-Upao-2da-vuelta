"use client";

import { useState } from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import {
  CandidateColumn,
  type CandidateData,
  type CandidateDimensionData,
} from "./CandidateColumn";

type DimensionKey = "social" | "economica" | "ambiental" | "institucional";

const DIMENSION_LABEL: Record<DimensionKey, string> = {
  social: "Social",
  economica: "Económica",
  ambiental: "Ambiental",
  institucional: "Institucional",
};

export interface SplitViewData {
  candidateLeft: CandidateData;
  candidateRight: CandidateData;
  dimensionsLeft: Record<DimensionKey, CandidateDimensionData | null>;
  dimensionsRight: Record<DimensionKey, CandidateDimensionData | null>;
}

export function SplitView({ data }: { data: SplitViewData }) {
  const [tab, setTab] = useState<DimensionKey>("social");

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(v) => setTab(v as DimensionKey)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          {(Object.keys(DIMENSION_LABEL) as DimensionKey[]).map((k) => (
            <TabsTrigger key={k} value={k} className="text-xs sm:text-sm">
              {DIMENSION_LABEL[k]}
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(DIMENSION_LABEL) as DimensionKey[]).map((k) => (
          <TabsContent key={k} value={k} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <CandidateColumn candidate={data.candidateLeft} dimension={data.dimensionsLeft[k]} />
              <CandidateColumn
                candidate={data.candidateRight}
                dimension={data.dimensionsRight[k]}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_oklch,var(--color-navy-upao)_15%,transparent)] bg-white p-6 text-center shadow-sm">
        <p className="font-display text-xl text-[var(--color-navy-upao)]">
          Cuando termines de explorar, declara tu preferencia
        </p>
        <p className="text-xs text-[var(--color-smoke)]">
          Recuerda: esta plataforma no emite recomendaciones de voto. Tu respuesta es para
          el análisis del docente.
        </p>
        <Button
          asChild
          className="bg-[var(--color-navy-upao)] text-white hover:bg-[var(--color-navy-deep)]"
        >
          <Link href="/preferencia">Marcar mi preferencia</Link>
        </Button>
      </div>
    </div>
  );
}

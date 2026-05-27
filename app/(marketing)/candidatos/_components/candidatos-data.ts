import { JNE_FINALISTAS } from "@/lib/jne/types";

export type CandidatoSlug = "keiko" | "roberto";

export interface VicePresidentSlot {
  order: 1 | 2;
  title: string;
  fullName: string;
  pixartUrl: string | null;
  hojaVidaUrl: string;
}

export interface CandidatoData {
  slug: CandidatoSlug;
  fullName: string;
  displayName: string;
  partyName: string;
  partyLogoUrl: string;
  /** Imagen estática pixart (fallback / poster del video). */
  pixartUrl: string;
  /** Video pixart animado (opcional). Si está presente, se renderiza en lugar de pixartUrl. */
  pixartVideoUrl: string | null;
  jnePhotoUrl: string;
  accentVar: string;
  partyAccentHex: string;
  hojaVidaUrl: string;
  planPdfUrl: string;
  presentationVideoUrl: string;
  idOrganizacionPolitica: number;
  idPlanGobierno: number;
  vicePresidents: [VicePresidentSlot, VicePresidentSlot];
}

export const ELECTION_DATE_ISO = "2026-06-07T08:00:00-05:00";

export const CANDIDATOS: Record<CandidatoSlug, CandidatoData> = {
  keiko: {
    slug: "keiko",
    fullName: JNE_FINALISTAS.keiko.nombreCompleto,
    displayName: "Keiko Sofía Fujimori Higuchi",
    partyName: "Fuerza Popular",
    partyLogoUrl: "/pixart/logo-fuerza-popular.png",
    pixartUrl: "/pixart/keiko.png",
    pixartVideoUrl: "/pixart/keiko-animada.mp4",
    jnePhotoUrl: "/candidates/keiko-fujimori.webp",
    accentVar: "--color-candidate-keiko",
    partyAccentHex: "#F37021",
    hojaVidaUrl: "https://votoinformadoia.jne.gob.pe/hoja-vida/fujimori",
    planPdfUrl: "https://votoinformadoia.jne.gob.pe/plan-gobierno-keiko.pdf",
    presentationVideoUrl:
      "https://jne-videos-publicos.s3.us-east-2.amazonaws.com/portal_documentos/files/videos_candidatos/FUERZA_POPULAR_720_VFSI.mp4",
    idOrganizacionPolitica: JNE_FINALISTAS.keiko.idOrganizacionPolitica,
    idPlanGobierno: JNE_FINALISTAS.keiko.idPlanGobierno,
    vicePresidents: [
      {
        order: 1,
        title: "1.er Vicepresidente",
        fullName: "Luis Fernando Galarreta Velarde",
        pixartUrl: "/pixart/vp/galarreta.webp",
        hojaVidaUrl: "https://votoinformadoia.jne.gob.pe/hoja-vida/galarreta",
      },
      {
        order: 2,
        title: "2.do Vicepresidente",
        fullName: "Miguel Ángel Torres Morales",
        pixartUrl: "/pixart/vp/torres.webp",
        hojaVidaUrl: "https://votoinformadoia.jne.gob.pe/hoja-vida/torres",
      },
    ],
  },
  roberto: {
    slug: "roberto",
    fullName: JNE_FINALISTAS.roberto.nombreCompleto,
    displayName: "Roberto Helbert Sánchez Palomino",
    partyName: "Juntos por el Perú",
    partyLogoUrl: "/pixart/logo-juntos-por-el-peru.svg",
    pixartUrl: "/pixart/roberto.png",
    pixartVideoUrl: "/pixart/roberto-animado.mp4",
    jnePhotoUrl: "/candidates/roberto-sanchez.webp",
    accentVar: "--color-candidate-roberto",
    partyAccentHex: "#1B7A3E",
    hojaVidaUrl: "https://votoinformadoia.jne.gob.pe/hoja-vida/sanchez",
    planPdfUrl: "https://votoinformadoia.jne.gob.pe/plan-gobierno-sanchez.pdf",
    presentationVideoUrl:
      "https://jne-videos-publicos.s3.us-east-2.amazonaws.com/portal_documentos/files/videos_candidatos/JUNTOS_POR_EL_PERU_720_VFSI.mp4",
    idOrganizacionPolitica: JNE_FINALISTAS.roberto.idOrganizacionPolitica,
    idPlanGobierno: JNE_FINALISTAS.roberto.idPlanGobierno,
    vicePresidents: [
      {
        order: 1,
        title: "1.er Vicepresidente",
        fullName: "Anali Marquez Huanca",
        pixartUrl: "/pixart/vp/marquez.webp",
        hojaVidaUrl: "https://votoinformadoia.jne.gob.pe/hoja-vida/marquez",
      },
      {
        order: 2,
        title: "2.do Vicepresidente",
        fullName: "Brigida Curo Bustincio",
        pixartUrl: "/pixart/vp/curo.webp",
        hojaVidaUrl: "https://votoinformadoia.jne.gob.pe/hoja-vida/curo",
      },
    ],
  },
};

export interface DebateSchedule {
  group: "upcoming" | "previous";
  groupLabel: string;
  items: Array<{
    name: string;
    dateLabel: string;
    badge: string;
    topics: string[];
  }>;
}

export const DEBATES: DebateSchedule[] = [
  {
    group: "upcoming",
    groupLabel: "Próximos debates",
    items: [
      {
        name: "Debate Técnico",
        dateLabel: "Domingo 24 de mayo · 8:00 p.m.",
        badge: "Próximo",
        topics: [
          "Infraestructura",
          "Reforma del Estado",
          "Agricultura y medio ambiente",
          "Economía y generación del empleo",
          "Salud",
          "Juventud y deporte",
        ],
      },
      {
        name: "Debate Presidencial",
        dateLabel: "Domingo 31 de mayo · 8:00 p.m.",
        badge: "Próximo",
        topics: [
          "Seguridad ciudadana",
          "Fortalecimiento del Estado democrático y derechos humanos",
          "Educación y salud",
          "Economía, empleo y reducción de la pobreza",
        ],
      },
    ],
  },
  {
    group: "previous",
    groupLabel: "Debates primera vuelta",
    items: [
      {
        name: "Debate N.° 3",
        dateLabel: "Miércoles 25 de marzo de 2026",
        badge: "Primera fase",
        topics: [
          "Seguridad ciudadana y lucha contra la criminalidad",
          "Integridad pública y lucha contra la corrupción",
        ],
      },
      {
        name: "Debate N.° 5",
        dateLabel: "Martes 31 de marzo de 2026",
        badge: "Segunda fase",
        topics: [
          "Educación, innovación y tecnología",
          "Empleo, desarrollo y emprendimiento",
        ],
      },
    ],
  },
];

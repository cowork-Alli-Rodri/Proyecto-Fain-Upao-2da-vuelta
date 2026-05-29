import { JNE_FINALISTAS } from "@/lib/jne/types";

export type CandidatoSlug = "keiko" | "roberto";

export interface VicePresidentSlot {
  order: 1 | 2;
  title: string;
  fullName: string;
  /** Foto oficial real (JNE). */
  photoUrl: string | null;
  hojaVidaUrl: string;
}

/**
 * Datos comparables tomados de la hoja de vida oficial del candidato en el
 * servicio Voto Informado del JNE (web.jne.gob.pe/serviciovotoinformado,
 * endpoint `/api/votoinf/hojavida?idHojaVida=...`, consultado 2026-05-29).
 * Solo se normaliza formato (mayúsculas/acentos); no se reescribe contenido.
 * Si un dato no está declarado en el JNE, se marca `null` y la UI muestra
 * "No declarado por el JNE".
 */
export interface CandidatoComparacion {
  /** Edad: el JNE no publica fecha de nacimiento en la hoja de vida pública. */
  edad: string | null;
  estudios: string[];
  experiencia: Array<{ cargo: string; centro: string; periodo: string }>;
  cargoPostula: string;
}

export interface CandidatoData {
  slug: CandidatoSlug;
  fullName: string;
  displayName: string;
  partyName: string;
  partyLogoUrl: string;
  /** Foto oficial real (JNE), fondo transparente. */
  photoUrl: string;
  jnePhotoUrl: string;
  accentVar: string;
  partyAccentHex: string;
  idHojaVida: number;
  hojaVidaUrl: string;
  planPdfUrl: string;
  presentationVideoUrl: string;
  idOrganizacionPolitica: number;
  idPlanGobierno: number;
  comparacion: CandidatoComparacion;
  vicePresidents: [VicePresidentSlot, VicePresidentSlot];
}

export const ELECTION_DATE_ISO = "2026-06-07T08:00:00-05:00";

/** Fuente oficial común para la comparación de candidatos. */
export const FUENTE_OFICIAL = {
  label: "Jurado Nacional de Elecciones (JNE)",
  url: "https://votoinformado.jne.gob.pe/presidente-vicepresidentes",
} as const;

/**
 * URL a la hoja de vida individual en el portal oficial Voto Informado del JNE.
 * Formato confirmado: `votoinformadoia.jne.gob.pe/hoja-vida/{slug}`, donde el
 * slug es el apellido del candidato/vicepresidente.
 */
function hojaVida(slug: string): string {
  return `https://votoinformadoia.jne.gob.pe/hoja-vida/${slug}`;
}

export const CANDIDATOS: Record<CandidatoSlug, CandidatoData> = {
  keiko: {
    slug: "keiko",
    fullName: JNE_FINALISTAS.keiko.nombreCompleto,
    displayName: "Keiko Sofía Fujimori Higuchi",
    partyName: "Fuerza Popular",
    partyLogoUrl: "/parties/fuerza-popular.webp",
    photoUrl: "/candidates/keiko-fujimori.webp",
    jnePhotoUrl: "/candidates/keiko-fujimori.webp",
    accentVar: "--color-candidate-keiko",
    partyAccentHex: "#F37021",
    idHojaVida: JNE_FINALISTAS.keiko.idHojaVida,
    hojaVidaUrl: hojaVida("fujimori"),
    planPdfUrl:
      "https://mpesije.jne.gob.pe/docs/da4b943d-4344-4743-9362-a11ccf3054cb.pdf",
    presentationVideoUrl:
      "https://jne-videos-publicos.s3.us-east-2.amazonaws.com/portal_documentos/files/videos_candidatos/FUERZA_POPULAR_720_VFSI.mp4",
    idOrganizacionPolitica: JNE_FINALISTAS.keiko.idOrganizacionPolitica,
    idPlanGobierno: JNE_FINALISTAS.keiko.idPlanGobierno,
    comparacion: {
      edad: null,
      estudios: [
        "Licenciatura en Administración de Empresas — Boston University",
        "Maestría en Administración de Empresas — Columbia University",
      ],
      experiencia: [
        {
          cargo: "Presidenta",
          centro: "Partido Político Fuerza Popular",
          periodo: "2013–2025",
        },
      ],
      cargoPostula: "Presidenta de la República",
    },
    vicePresidents: [
      {
        order: 1,
        title: "1.er Vicepresidente",
        fullName: "Luis Fernando Galarreta Velarde",
        photoUrl: "/candidates/vp/galarreta.jpg",
        hojaVidaUrl: hojaVida("galarreta"),
      },
      {
        order: 2,
        title: "2.do Vicepresidente",
        fullName: "Miguel Ángel Torres Morales",
        photoUrl: "/candidates/vp/torres.jpg",
        hojaVidaUrl: hojaVida("torres"),
      },
    ],
  },
  roberto: {
    slug: "roberto",
    fullName: JNE_FINALISTAS.roberto.nombreCompleto,
    displayName: "Roberto Helbert Sánchez Palomino",
    partyName: "Juntos por el Perú",
    partyLogoUrl: "/parties/juntos-por-el-peru.svg",
    photoUrl: "/candidates/roberto-sanchez.webp",
    jnePhotoUrl: "/candidates/roberto-sanchez.webp",
    accentVar: "--color-candidate-roberto",
    partyAccentHex: "#1B7A3E",
    idHojaVida: JNE_FINALISTAS.roberto.idHojaVida,
    hojaVidaUrl: hojaVida("sanchez"),
    planPdfUrl:
      "https://mpesije.jne.gob.pe/docs/3dd0e649-061c-4f31-8c3f-7a0836b58bde.pdf",
    presentationVideoUrl:
      "https://jne-videos-publicos.s3.us-east-2.amazonaws.com/portal_documentos/files/videos_candidatos/JUNTOS_POR_EL_PERU_720_VFSI.mp4",
    idOrganizacionPolitica: JNE_FINALISTAS.roberto.idOrganizacionPolitica,
    idPlanGobierno: JNE_FINALISTAS.roberto.idPlanGobierno,
    comparacion: {
      edad: null,
      estudios: [
        "Bachiller en Psicología — Universidad Nacional Mayor de San Marcos",
        "Maestría en Políticas Sociales — Pontificia Universidad Católica del Perú (PUCP)",
      ],
      experiencia: [
        {
          cargo: "Congresista",
          centro: "Congreso de la República",
          periodo: "2021–2025",
        },
        {
          cargo: "Ministro de Comercio Exterior y Turismo",
          centro: "MINCETUR",
          periodo: "2021–2022",
        },
        {
          cargo: "Gerente de Desarrollo Social",
          centro: "Municipalidad Provincial de Huaral",
          periodo: "2020",
        },
      ],
      cargoPostula: "Presidente de la República",
    },
    vicePresidents: [
      {
        order: 1,
        title: "1.er Vicepresidente",
        fullName: "Anali Marquez Huanca",
        photoUrl: "/candidates/vp/marquez.jpg",
        hojaVidaUrl: hojaVida("marquez"),
      },
      {
        order: 2,
        title: "2.do Vicepresidente",
        fullName: "Brigida Curo Bustincio",
        photoUrl: "/candidates/vp/curo.jpg",
        hojaVidaUrl: hojaVida("curo"),
      },
    ],
  },
};

export interface DebateSchedule {
  group: "upcoming";
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
];

/**
 * Constantes oficiales UPAO (Universidad Privada Antenor Orrego, Trujillo).
 *
 * Las facultades y carreras se mantienen actualizadas con la oferta vigente
 * en https://www.upao.edu.pe/. Si UPAO incorpora nuevas carreras, agregar acá
 * y bumpear `CATALOG_VERSION` para invalidar cachés de filtros del dashboard.
 */

export const CATALOG_VERSION = "2026.1";

export const FACULTADES = [
  "Ciencias Económicas",
  "Ciencias de la Comunicación",
  "Ciencias de la Salud",
  "Derecho y Ciencias Políticas",
  "Educación y Humanidades",
  "Ingeniería",
  "Medicina Humana",
  "Arquitectura, Urbanismo y Artes",
  "Ciencias Agrarias",
] as const;

export type Facultad = (typeof FACULTADES)[number];

export const CARRERAS_POR_FACULTAD: Record<Facultad, readonly string[]> = {
  "Ciencias Económicas": [
    "Administración",
    "Contabilidad",
    "Economía",
    "Marketing y Negocios Internacionales",
    "Gastronomía y Gestión de Restaurantes",
    "Turismo y Hotelería",
  ],
  "Ciencias de la Comunicación": [
    "Ciencias de la Comunicación",
  ],
  "Ciencias de la Salud": [
    "Enfermería",
    "Estomatología",
    "Nutrición",
    "Obstetricia",
    "Psicología",
    "Tecnología Médica",
  ],
  "Derecho y Ciencias Políticas": [
    "Derecho",
    "Ciencias Políticas y Gobernabilidad",
  ],
  "Educación y Humanidades": [
    "Educación Inicial",
    "Educación Primaria",
    "Educación Secundaria",
  ],
  Ingeniería: [
    "Ingeniería Civil",
    "Ingeniería Industrial",
    "Ingeniería de Computación y Sistemas",
    "Ingeniería de Software",
    "Ingeniería Electrónica",
    "Ingeniería de Telecomunicaciones",
    "Ingeniería Mecatrónica",
  ],
  "Medicina Humana": ["Medicina Humana"],
  "Arquitectura, Urbanismo y Artes": ["Arquitectura"],
  "Ciencias Agrarias": [
    "Ingeniería Agrónoma",
    "Medicina Veterinaria y Zootecnia",
  ],
};

export const RANGOS_EDAD = ["18-19", "20-22", "23-25", "26+"] as const;
export type RangoEdad = (typeof RANGOS_EDAD)[number];

export const GENEROS = [
  { value: "femenino", label: "Femenino" },
  { value: "masculino", label: "Masculino" },
  { value: "otro", label: "Otro" },
  { value: "prefiero_no_decir", label: "Prefiero no decir" },
] as const;

export type Genero = (typeof GENEROS)[number]["value"];

export const CICLOS = Array.from({ length: 14 }, (_, i) => i + 1) as readonly number[];

/**
 * Lista curada de medios de verificación reconocidos en Perú.
 *
 * No copiamos sus contenidos en nuestro sitio. En su lugar:
 *   - El equipo del curso comprueba cada caso con su publicación original.
 *   - El estudiante puede visitarlos directamente desde la página
 *     "No te dejes sorprender" para leer la verificación completa.
 */

export interface Verifier {
  id: string;
  name: string;
  url: string;
  description: string;
  organization: string;
}

export const VERIFIERS: Verifier[] = [
  {
    id: "ojo-publico",
    name: "OjoBiónico · Ojo Público",
    url: "https://ojo-publico.com/ojobionico",
    description:
      "Unidad de comprobación de Ojo Público enfocada en lo que dicen políticos y autoridades.",
    organization: "Ojo Público",
  },
  {
    id: "verificador-la-republica",
    name: "Verificador · La República",
    url: "https://larepublica.pe/verificador",
    description:
      "Equipo del diario La República que revisa si lo que dicen candidatos y autoridades es cierto.",
    organization: "La República",
  },
  {
    id: "convoca-verifica",
    name: "Convoca Verifica",
    url: "https://convoca.pe/agenda-propia/convoca-verifica",
    description:
      "Comprobación de discursos públicos y desinformación electoral por Convoca.pe.",
    organization: "Convoca.pe",
  },
  {
    id: "salud-con-lupa-fact",
    name: "Salud con Lupa · Verificación",
    url: "https://saludconlupa.com",
    description:
      "Periodismo de salud que revisa afirmaciones sobre políticas sanitarias.",
    organization: "Salud con Lupa",
  },
  {
    id: "proetica",
    name: "Proética",
    url: "https://www.proetica.org.pe",
    description:
      "Capítulo peruano de Transparencia Internacional. Vigila campaña y transparencia.",
    organization: "Proética",
  },
];

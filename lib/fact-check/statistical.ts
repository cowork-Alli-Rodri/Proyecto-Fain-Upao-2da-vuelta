/**
 * Detecta si un fact-check contiene datos estadísticos / de encuestas
 * (porcentajes de intención de voto, sondeos, ventajas en puntos, etc.).
 *
 * Estos casos se excluyen de la galería pública "Casos destacados" porque
 * mostrar cifras de encuestas —aunque sea para desmentirlas— instala un sesgo
 * de votación indirecto: el estudiante retiene el número ("Sánchez 40%"), no el
 * veredicto ("falso"). Para mantener el tratamiento simétrico de los candidatos
 * preferimos no exhibir esas piezas en el listado curado.
 *
 * No afecta al verificador on-demand del usuario: si alguien pega una afirmación
 * con cifras, igual recibe el veredicto literal del medio que la chequeó.
 */

// Porcentajes ("7%", "27 %", "40 por ciento") y ventajas en puntos
// ("5 puntos", "3 puntos porcentuales").
const PERCENT_OR_POINTS =
  /\b\d+(?:[.,]\d+)?\s*(?:%|por\s?ciento|puntos?(?:\s+porcentuales)?)/i;

// Acrónimos/encuestadoras frecuentes en Perú. Con límites de palabra para no
// falsear dentro de otras palabras.
const POLL_ACRONYMS = /\b(?:iep|ipsos|datum|cpi|gfk)\b/i;

// Términos de sondeo. Cubrimos variantes con y sin tilde porque las fuentes no
// son consistentes.
const POLL_PHRASES = [
  "encuesta",
  "encuestadora",
  "sondeo",
  "intención de voto",
  "intencion de voto",
  "intención de votos",
  "intencion de votos",
  "boca de urna",
  "flash electoral",
  "conteo rápido",
  "conteo rapido",
  "puntos porcentuales",
  "simulacro",
];

export function isStatisticalClaim(
  ...parts: Array<string | null | undefined>
): boolean {
  const text = parts
    .filter((p): p is string => Boolean(p))
    .join(" ")
    .toLowerCase();
  if (!text) return false;
  if (PERCENT_OR_POINTS.test(text)) return true;
  if (POLL_ACRONYMS.test(text)) return true;
  return POLL_PHRASES.some((p) => text.includes(p));
}

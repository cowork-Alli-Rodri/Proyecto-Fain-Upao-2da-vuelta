/**
 * Normalización de texto recibido del JNE.
 *
 * Constitución I del proyecto: los datos del JNE no se parafrasean ni se
 * filtran editorialmente — pero SÍ se permite "normalizar formato (acentos,
 * espacios)". Esta función aplica únicamente correcciones de formato
 * conocidas, NO altera el contenido.
 *
 * Correcciones aplicadas hoy:
 *  - `¿\t` → `• ` : los PDFs originales usan bullets que el portal del JNE
 *    convierte a `¿` + tab. Visualmente se muestra como signos de interrogación
 *    de apertura sueltos al inicio de cada ítem. Sustituirlos por un bullet
 *    limpio restaura la intención original sin agregar ni omitir contenido.
 *
 * Si el JNE arregla la fuente, este normalizador queda inocuo (el `¿\t`
 * nunca aparece en texto correcto).
 */
export function normalizeJneText(input: string | null | undefined): string | null {
  if (input == null) return null;
  let out = input;

  // Viñetas rotas (¿ + tab → bullet limpio).
  out = out.replace(/¿\t/g, "• ");

  // Algunos planes usan `¿` seguido de espacio simple como viñeta también.
  // (más raro pero aparece). Solo cuando va al inicio de línea para no
  // tocar preguntas reales tipo "¿Qué tan?".
  out = out.replace(/(^|\n)¿\s+/g, "$1• ");

  // Espacios duplicados que quedan tras la sustitución.
  out = out.replace(/[ \t]{2,}/g, " ");

  return out;
}

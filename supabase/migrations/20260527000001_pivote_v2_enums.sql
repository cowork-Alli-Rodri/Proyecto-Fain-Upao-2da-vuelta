-- ============================================================================
-- Pivote v2 — Migration 1/5: ENUMs
-- ============================================================================
-- Introduce las nuevas categorías del cuestionario v2 (5 dimensiones propias
-- mapeadas a las 4 dimensiones JNE) y el ENUM `momento` para distinguir el
-- bloque pre vs post del flujo.
--
-- El ENUM existente `dim_tematica_enum` (social, economica, ambiental,
-- institucional) NO se modifica: lo usa el comparador con los planes JNE
-- oficiales y debe mantenerse alineado al documento del candidato.
-- ============================================================================

-- Dimensiones propias del cuestionario.
-- Cada pregunta del cuestionario v2 usa una de estas + un mapping a la JNE.
CREATE TYPE public.dim_cuestionario_enum AS ENUM (
  'educacion',
  'juventud',
  'trabajo',
  'economia',
  'social_publicas'
);

COMMENT ON TYPE public.dim_cuestionario_enum IS
  'Dimensiones temáticas del cuestionario v2 (postura antes/después). Cada una se mapea a una dim_tematica_enum del JNE en questions.dimension_jne_mapping.';

-- Momento en el que se hace la pregunta (o la respuesta).
-- - 'pre'  → antes de ver los planes
-- - 'post' → después de ver los planes
-- - 'both' → la pregunta se hace en ambos bloques (mide cambio de opinión)
CREATE TYPE public.momento_enum AS ENUM ('pre', 'post', 'both');

COMMENT ON TYPE public.momento_enum IS
  'Cuándo se hace la pregunta o se registró la respuesta. ''both'' aplica solo a questions: la pregunta aparece en pre Y en post para medir delta.';

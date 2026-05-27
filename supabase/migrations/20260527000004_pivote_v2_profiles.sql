-- ============================================================================
-- Pivote v2 — Migration 4/5: profiles
-- ============================================================================
-- El flujo v2 tiene 3 hitos en lugar de 1:
--   1. completó cuestionario PRE
--   2. revisó las 4 dimensiones JNE en /candidatos
--   3. completó cuestionario POST
--
-- Cada hito tiene su timestamp + un puntero de paso para reanudación parcial.
--
-- Las columnas v1 (`current_step`, `questionnaire_completed_at`) se mantienen
-- temporalmente para compatibilidad de exports/queries de transición. Se
-- removerán en una migración futura (v3) una vez que el dashboard y los
-- exports estén 100% migrados a las columnas v2.
-- ============================================================================

ALTER TABLE public.profiles
  -- Puntero del paso actual en cada bloque del cuestionario (0 = no empezó).
  ADD COLUMN current_step_pre INT2 NOT NULL DEFAULT 0,
  ADD COLUMN current_step_post INT2 NOT NULL DEFAULT 0,

  -- Hito 1: cierre del bloque pre.
  ADD COLUMN questionnaire_pre_completed_at TIMESTAMPTZ,

  -- Hito 2: revisión de candidatos.
  -- Array de dimensiones JNE vistas (ej: {'social', 'economica', 'ambiental', 'institucional'}).
  -- Cuando length=4, el front desbloquea el botón "Continuar al cuestionario post".
  ADD COLUMN candidatos_dimensions_viewed TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN candidatos_completed_at TIMESTAMPTZ,

  -- Hito 3: cierre del bloque post.
  ADD COLUMN questionnaire_post_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.current_step_pre IS
  'Puntero del paso actual del cuestionario PRE (0 = no empezó, N = última pregunta respondida).';

COMMENT ON COLUMN public.profiles.current_step_post IS
  'Puntero del paso actual del cuestionario POST. Solo se incrementa después de candidatos_completed_at.';

COMMENT ON COLUMN public.profiles.candidatos_dimensions_viewed IS
  'Array de dimensiones JNE que el estudiante ya inspeccionó en /candidatos. Cuando length=4 (las 4 oficiales JNE), se considera completo y se setea candidatos_completed_at.';

COMMENT ON COLUMN public.profiles.questionnaire_pre_completed_at IS
  'Timestamp del cierre del bloque PRE. Solo se setea cuando el estudiante respondió todas las preguntas momento IN (''pre'', ''both'').';

COMMENT ON COLUMN public.profiles.questionnaire_post_completed_at IS
  'Timestamp del cierre del bloque POST. Solo se setea cuando el estudiante respondió todas las preguntas momento IN (''post'', ''both'') con momento_snapshot=''post''.';

-- Backfill: los usuarios v1 que ya completaron el cuestionario legacy se
-- consideran pre completos (sus answers ya fueron backfilled como 'pre' en la
-- migración anterior). Post queda NULL — esos usuarios verán el flujo nuevo
-- desde /candidatos y deberán completar el post.
UPDATE public.profiles
SET questionnaire_pre_completed_at = questionnaire_completed_at
WHERE questionnaire_completed_at IS NOT NULL;

-- Para los usuarios v1 que tenían current_step > 0, copiamos a current_step_pre.
UPDATE public.profiles
SET current_step_pre = current_step
WHERE current_step > 0;

-- Constraint: candidatos_completed_at solo puede setearse si pre está completo.
-- Constraint: questionnaire_post_completed_at solo si candidatos completos.
-- (Es defensa en profundidad: el middleware también lo enforce.)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_v2_flow_order
  CHECK (
    (candidatos_completed_at IS NULL OR questionnaire_pre_completed_at IS NOT NULL)
    AND
    (questionnaire_post_completed_at IS NULL OR candidatos_completed_at IS NOT NULL)
  );

-- Constraint: candidatos_dimensions_viewed solo puede contener dimensiones JNE válidas.
-- (No usamos un type ARRAY del enum porque PG es estricto con array of enum y
-- esto da más flexibilidad si en el futuro el JNE agrega dimensiones).
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_dimensions_viewed_valid
  CHECK (
    candidatos_dimensions_viewed <@ ARRAY['social', 'economica', 'ambiental', 'institucional']::TEXT[]
  );

-- Índice para queries del dashboard que filtran por avance del flujo.
CREATE INDEX idx_profiles_v2_flow_progress
  ON public.profiles(
    questionnaire_pre_completed_at,
    candidatos_completed_at,
    questionnaire_post_completed_at
  )
  WHERE role = 'student' AND is_anonymized = FALSE;

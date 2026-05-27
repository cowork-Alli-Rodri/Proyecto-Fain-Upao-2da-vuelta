-- ============================================================================
-- Pivote v2 — Migration 3/5: answers
-- ============================================================================
-- Cambios:
--
-- 1. `momento_snapshot` (pre|post): cada answer pertenece a un bloque del flujo.
--    El mismo (student, question) puede tener 2 answers si la pregunta es
--    momento='both' (mide cambio).
--
-- 2. `dimension_cuestionario_snapshot`: snapshot de la dimensión propia v2.
--    Nullable para compatibilidad con preguntas legacy v1 (que tienen NULL
--    en questions.dimension_cuestionario).
--
-- 3. El UNIQUE se expande de (student, question) a (student, question, momento).
--
-- 4. El trigger answers_snapshot_lock se extiende para incluir los nuevos
--    campos de snapshot en la verificación de inmutabilidad.
--
-- Backfill: las answers existentes (v1) se interpretan como 'pre' por convención
-- (eran respuestas antes de cualquier comparador obligatorio en el flujo).
-- `dimension_cuestionario_snapshot` queda NULL (preguntas legacy).
-- ============================================================================

-- 1. Agregar columnas nullable (no rompe inserts en flight).
ALTER TABLE public.answers
  ADD COLUMN momento_snapshot public.momento_enum,
  ADD COLUMN dimension_cuestionario_snapshot public.dim_cuestionario_enum;

COMMENT ON COLUMN public.answers.momento_snapshot IS
  'Bloque del flujo en el que se registró esta respuesta: ''pre'' o ''post''. Nunca ''both'' (eso aplica solo al banco de preguntas).';

COMMENT ON COLUMN public.answers.dimension_cuestionario_snapshot IS
  'Snapshot de la dimensión propia v2 al momento del insert. NULL si la pregunta es legacy v1 sin dimension_cuestionario.';

-- 2. Backfill: existing rows = 'pre' (eran v1, no había bloques).
UPDATE public.answers
SET momento_snapshot = 'pre'
WHERE momento_snapshot IS NULL;

-- 3. NOT NULL para momento_snapshot. dimension_cuestionario_snapshot queda nullable.
ALTER TABLE public.answers
  ALTER COLUMN momento_snapshot SET NOT NULL;

-- 4. Constraint: 'both' no es válido en answers (es solo para questions).
ALTER TABLE public.answers
  ADD CONSTRAINT answers_momento_snapshot_not_both
  CHECK (momento_snapshot IN ('pre', 'post'));

-- 5. Reemplazar el unique viejo (student, question) por uno que contemple momento.
-- El nombre del constraint inline lo genera Postgres como `answers_student_id_question_id_key`.
ALTER TABLE public.answers
  DROP CONSTRAINT IF EXISTS answers_student_id_question_id_key;

ALTER TABLE public.answers
  ADD CONSTRAINT answers_student_question_momento_unique
  UNIQUE (student_id, question_id, momento_snapshot);

-- 6. Índice para queries del dashboard que filtran por momento.
CREATE INDEX idx_answers_student_momento
  ON public.answers(student_id, momento_snapshot);

-- 7. Extender el trigger answers_snapshot_lock para incluir los nuevos snapshots.
-- Importante: si esta migration corre con CREATE OR REPLACE, mantenemos la
-- semántica de inmutabilidad para todos los snapshots (originales + nuevos).
CREATE OR REPLACE FUNCTION public.answers_snapshot_lock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.question_snapshot IS DISTINCT FROM OLD.question_snapshot
     OR NEW.dimension_snapshot IS DISTINCT FROM OLD.dimension_snapshot
     OR NEW.tipo_snapshot IS DISTINCT FROM OLD.tipo_snapshot
     OR NEW.student_id IS DISTINCT FROM OLD.student_id
     OR NEW.question_id IS DISTINCT FROM OLD.question_id
     OR NEW.momento_snapshot IS DISTINCT FROM OLD.momento_snapshot
     OR NEW.dimension_cuestionario_snapshot IS DISTINCT FROM OLD.dimension_cuestionario_snapshot THEN
    RAISE EXCEPTION 'answers: las columnas snapshot/identidad son inmutables tras el primer insert (FR-012)';
  END IF;
  RETURN NEW;
END;
$$;

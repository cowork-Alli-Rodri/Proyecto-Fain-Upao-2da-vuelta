-- ============================================================================
-- Pivote v2 — Migration 2/5: questions
-- ============================================================================
-- Agrega los campos necesarios para clasificar cada pregunta en el flujo pre/post
-- y para reportar agregaciones cruzadas con las dimensiones JNE en el dashboard.
--
-- - `momento`               : 'pre' | 'post' | 'both'. Default 'both' para v1 legacy.
-- - `dimension_cuestionario`: una de educacion/juventud/trabajo/economia/social_publicas.
-- - `dimension_jne_mapping` : la dimensión JNE oficial a la que ancla la pregunta.
--
-- La columna existente `dimension_tematica` se MANTIENE (no se borra ni se
-- renombra) para no romper exports/queries de transición. Las queries v2 leen
-- de `dimension_cuestionario` y `dimension_jne_mapping`.
-- ============================================================================

ALTER TABLE public.questions
  ADD COLUMN momento public.momento_enum NOT NULL DEFAULT 'both',
  ADD COLUMN dimension_cuestionario public.dim_cuestionario_enum,
  ADD COLUMN dimension_jne_mapping public.dim_tematica_enum;

COMMENT ON COLUMN public.questions.momento IS
  'Cuándo aparece esta pregunta en el flujo. ''both'' = se muestra idéntica en pre y en post (mide cambio).';

COMMENT ON COLUMN public.questions.dimension_cuestionario IS
  'Dimensión propia del cuestionario v2. NULL en preguntas legacy v1.';

COMMENT ON COLUMN public.questions.dimension_jne_mapping IS
  'Dimensión JNE oficial asociada para reporting cruzado. NULL en preguntas legacy v1.';

-- Índice: filtrado eficiente del banco activo por momento.
-- Predicado parcial: solo indexa filas activas (las que el flujo consume).
CREATE INDEX idx_questions_momento_activo
  ON public.questions(momento, orden)
  WHERE activo = TRUE;

-- Constraint: si dimension_cuestionario está seteada, dimension_jne_mapping
-- también debe estarlo. Garantiza que toda pregunta v2 tiene su anchor JNE.
ALTER TABLE public.questions
  ADD CONSTRAINT questions_v2_dimensions_paired
  CHECK (
    (dimension_cuestionario IS NULL AND dimension_jne_mapping IS NULL)
    OR (dimension_cuestionario IS NOT NULL AND dimension_jne_mapping IS NOT NULL)
  );

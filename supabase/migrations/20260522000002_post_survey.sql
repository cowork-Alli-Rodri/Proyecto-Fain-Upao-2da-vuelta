-- ============================================================================
-- Encuesta post-comparador (B5)
-- ============================================================================
-- Captura la percepción del estudiante DESPUÉS de analizar los planes
-- oficiales y ANTES de declarar su decisión final. Mide:
--   - Cambio de opinión tras la lectura
--   - Dimensión que más impactó la decisión
--   - Utilidad percibida (1-10)
--   - Recomendación a otros estudiantes
--
-- Una sola fila por estudiante. Se completa entre `comparador` y `preferencia`.
-- ============================================================================

CREATE TYPE public.opinion_change_enum AS ENUM ('si_mucho', 'si_un_poco', 'no');

CREATE TYPE public.dimension_top_enum AS ENUM (
  'social',
  'economica',
  'ambiental',
  'institucional',
  'ninguna'
);

CREATE TABLE public.post_surveys (
  student_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  opinion_changed   public.opinion_change_enum NOT NULL,
  dimension_top     public.dimension_top_enum NOT NULL,
  utility_rating    integer NOT NULL CHECK (utility_rating BETWEEN 1 AND 10),
  would_recommend   boolean NOT NULL,
  comentario        text CHECK (char_length(comentario) <= 500),
  submitted_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.post_surveys IS
  'Encuesta de cambio de opinión + utilidad percibida, completada tras el comparador y antes de la decisión final (B5).';

CREATE INDEX idx_post_surveys_submitted_at ON public.post_surveys (submitted_at DESC);

-- RLS: el estudiante puede insertar SU fila (solo una vez gracias a la PK).
-- Lectura: admin + service_role (para el dashboard del docente).

ALTER TABLE public.post_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_surveys_student_insert ON public.post_surveys
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY post_surveys_student_select_own ON public.post_surveys
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY post_surveys_admin_select_all ON public.post_surveys
  FOR SELECT
  TO authenticated
  USING (internal.current_role() IN ('admin', 'teacher'));

GRANT SELECT, INSERT ON public.post_surveys TO authenticated;
GRANT ALL ON public.post_surveys TO service_role;

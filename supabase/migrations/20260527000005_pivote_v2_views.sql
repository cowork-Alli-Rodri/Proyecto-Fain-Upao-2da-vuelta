-- ============================================================================
-- Pivote v2 — Migration 5/5: vistas materializadas del dashboard
-- ============================================================================
-- Reescribe las MVs para reportar:
--   1. Avance por hito del flujo nuevo (pre, candidatos, post, preferencia).
--   2. Cambio de opinión por estudiante y por dimensión cuestionario.
--   3. Heatmap pre/post por pregunta (matriz 5x5 sobre Likert).
--
-- Estrategia: dropeamos las MVs viejas (las recreamos con shape nuevo) y
-- agregamos `mv_delta_pre_post`. El resto de MVs sin afectación queda intacto.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DROP de la MV vieja para recrearla con métricas v2
-- ----------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS public.mv_kpis_curso CASCADE;

-- ----------------------------------------------------------------------------
-- mv_kpis_curso v2 — KPIs principales con desglose pre/post
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW public.mv_kpis_curso AS
WITH students AS (
  SELECT id, questionnaire_pre_completed_at, candidatos_completed_at,
         questionnaire_post_completed_at
  FROM public.profiles
  WHERE role = 'student' AND is_anonymized = FALSE
)
SELECT
  1 AS singleton_key,
  COUNT(*) AS total_inscritos,
  COUNT(*) FILTER (WHERE questionnaire_pre_completed_at IS NOT NULL) AS total_completaron_pre,
  COUNT(*) FILTER (WHERE candidatos_completed_at IS NOT NULL) AS total_completaron_candidatos,
  COUNT(*) FILTER (WHERE questionnaire_post_completed_at IS NOT NULL) AS total_completaron_post,
  COUNT(pref.id) AS total_preferencias,
  COUNT(*) FILTER (WHERE questionnaire_post_completed_at IS NOT NULL)
    - COUNT(pref.id) AS total_completaron_sin_preferencia,
  ROUND(AVG(pref.confianza)::numeric, 2) AS confianza_promedio
FROM students s
LEFT JOIN public.preferences pref ON pref.student_id = s.id;

CREATE UNIQUE INDEX idx_mv_kpis_curso_singleton ON public.mv_kpis_curso (singleton_key);

COMMENT ON MATERIALIZED VIEW public.mv_kpis_curso IS
  'KPIs principales v2: avance por hito (pre, candidatos, post) + preferencias + confianza promedio.';

-- ----------------------------------------------------------------------------
-- mv_delta_pre_post — NUEVA. Pivot pre vs post por (student, question)
-- ----------------------------------------------------------------------------
-- Una fila por cada combinación (student, question) donde el estudiante
-- respondió ambos momentos (pre y post). Es la base del heatmap y del
-- cálculo de "% cambiaron opinión".
--
-- valor_pre / valor_post se castean a numeric. Para preguntas Likert es
-- directo (1..5). Para tipos no numéricos (single, multiple, text), `valor`
-- es JSONB con shapes distintos: estos quedan NULL en valor_pre/post y se
-- deben filtrar en consumidor. La columna `tipo` permite ese filtro.

CREATE MATERIALIZED VIEW public.mv_delta_pre_post AS
SELECT
  pre.student_id,
  pre.question_id,
  q.dimension_cuestionario,
  q.dimension_jne_mapping,
  q.tipo AS tipo,
  -- Cast del valor JSON a numérico solo si es Likert. Si no, NULL.
  CASE
    WHEN q.tipo = 'likert' AND jsonb_typeof(pre.valor) = 'number'
      THEN (pre.valor)::text::int
    ELSE NULL
  END AS valor_pre,
  CASE
    WHEN q.tipo = 'likert' AND jsonb_typeof(post.valor) = 'number'
      THEN (post.valor)::text::int
    ELSE NULL
  END AS valor_post,
  CASE
    WHEN q.tipo = 'likert'
      AND jsonb_typeof(pre.valor) = 'number'
      AND jsonb_typeof(post.valor) = 'number'
    THEN (post.valor)::text::int - (pre.valor)::text::int
    ELSE NULL
  END AS delta
FROM public.answers pre
INNER JOIN public.answers post
  ON post.student_id = pre.student_id
  AND post.question_id = pre.question_id
  AND post.momento_snapshot = 'post'
INNER JOIN public.questions q
  ON q.id = pre.question_id
  AND q.momento = 'both'
INNER JOIN public.profiles p
  ON p.id = pre.student_id
  AND p.role = 'student'
  AND p.is_anonymized = FALSE
WHERE pre.momento_snapshot = 'pre';

CREATE UNIQUE INDEX idx_mv_delta_pre_post_unique
  ON public.mv_delta_pre_post (student_id, question_id);

CREATE INDEX idx_mv_delta_pre_post_dimension
  ON public.mv_delta_pre_post (dimension_cuestionario);

COMMENT ON MATERIALIZED VIEW public.mv_delta_pre_post IS
  'Pivot pre vs post por (student, question) sobre preguntas momento=''both''. Base para heatmap y % cambio opinión. valor_pre/valor_post NULL si la pregunta no es Likert.';

-- ----------------------------------------------------------------------------
-- mv_evolucion_temporal v2 — agrega serie de "completaron pre" y "completaron post"
-- ----------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS public.mv_evolucion_temporal CASCADE;

CREATE MATERIALIZED VIEW public.mv_evolucion_temporal AS
WITH eventos AS (
  -- Cada evento (cierre de bloque o preferencia) se cuenta como una "actividad"
  -- por estudiante por día.
  SELECT
    date_trunc('day', questionnaire_pre_completed_at AT TIME ZONE 'America/Lima')::date AS fecha,
    'completaron_pre'::text AS metrica,
    NULL::text AS candidato
  FROM public.profiles
  WHERE role = 'student' AND is_anonymized = FALSE
    AND questionnaire_pre_completed_at IS NOT NULL

  UNION ALL

  SELECT
    date_trunc('day', questionnaire_post_completed_at AT TIME ZONE 'America/Lima')::date,
    'completaron_post'::text,
    NULL::text
  FROM public.profiles
  WHERE role = 'student' AND is_anonymized = FALSE
    AND questionnaire_post_completed_at IS NOT NULL

  UNION ALL

  SELECT
    date_trunc('day', pref.submitted_at AT TIME ZONE 'America/Lima')::date,
    'preferencia_' || pref.candidato_preferido,
    pref.candidato_preferido
  FROM public.preferences pref
  JOIN public.profiles p ON p.id = pref.student_id
  WHERE p.is_anonymized = FALSE
)
SELECT
  fecha,
  metrica,
  candidato,
  COUNT(*) AS n
FROM eventos
GROUP BY fecha, metrica, candidato;

CREATE UNIQUE INDEX idx_mv_evol_temporal_unique
  ON public.mv_evolucion_temporal (fecha, metrica, COALESCE(candidato, ''));

COMMENT ON MATERIALIZED VIEW public.mv_evolucion_temporal IS
  'Evolución temporal v2: cierre de pre, cierre de post y preferencias declaradas, agrupado por día (TZ Lima).';

-- ----------------------------------------------------------------------------
-- mv_preferencia_por_carrera — sin cambios estructurales (referenciada acá
-- para que esta migration sea la fuente canónica de las MVs activas v2).
-- Ya existe desde 20260520000006. La dejamos tal cual.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- Grants para las MVs reconstruidas + la nueva
-- ----------------------------------------------------------------------------
-- Solo service_role lee directo. Las queries del dashboard usan createAdminClient.
-- Mantiene la política de security hardening (migration 20260521000001):
-- las MVs nunca se exponen vía PostgREST con anon/authenticated.

GRANT SELECT ON public.mv_kpis_curso TO service_role;
GRANT SELECT ON public.mv_delta_pre_post TO service_role;
GRANT SELECT ON public.mv_evolucion_temporal TO service_role;

REVOKE SELECT ON public.mv_kpis_curso FROM anon, authenticated;
REVOKE SELECT ON public.mv_delta_pre_post FROM anon, authenticated;
REVOKE SELECT ON public.mv_evolucion_temporal FROM anon, authenticated;

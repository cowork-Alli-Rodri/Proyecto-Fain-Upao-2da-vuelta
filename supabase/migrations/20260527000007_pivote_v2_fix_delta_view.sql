-- ============================================================================
-- Pivote v2 — Fix del cálculo de cambio de opinión pre/post
-- ============================================================================
-- Dos defectos en `mv_delta_pre_post` (migration 000005) dejaban el cambio de
-- opinión (núcleo del estudio) sin funcionar:
--
--   1. Era MATERIALIZED VIEW y nada la refrescaba (no había REFRESH en el repo).
--      En prod quedaba con 0 filas → dashboard "Cambio opinión 0%", heatmap y
--      gráfico por dimensión vacíos.
--
--   2. La extracción del valor usaba `jsonb_typeof(valor) = 'number'`, pero las
--      respuestas Likert se guardan como `{"value": 5}` (objeto JSONB), no como
--      número plano. La condición nunca se cumplía → valor_pre/valor_post/delta
--      siempre NULL incluso tras refrescar.
--
-- Fix:
--   - Se reemplaza por una VIEW normal (siempre viva, sin refresh).
--   - Se extrae el número con `valor->>'value'` (soporta el shape real).
--   - `security_invoker = true` + REVOKE a anon/authenticated: la vista nunca
--     expone datos saltándose RLS por PostgREST (security hardening 000001).
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS public.mv_delta_pre_post CASCADE;

-- VIEW normal (no materializada): el dataset es chico (≤ miles de filas) y así
-- el dashboard siempre refleja la data actual sin infraestructura de refresh.
-- Mantiene el nombre histórico `mv_delta_pre_post` para no tocar el código del
-- dashboard que la consulta (lib/dashboard/queries.ts).
CREATE VIEW public.mv_delta_pre_post
WITH (security_invoker = true) AS
SELECT
  pre.student_id,
  pre.question_id,
  q.dimension_cuestionario,
  q.dimension_jne_mapping,
  q.tipo AS tipo,
  -- Likert se guarda como {"value": N}; se extrae el entero de ->>'value'.
  CASE
    WHEN q.tipo = 'likert' AND jsonb_typeof(pre.valor->'value') = 'number'
      THEN (pre.valor->>'value')::int
    ELSE NULL
  END AS valor_pre,
  CASE
    WHEN q.tipo = 'likert' AND jsonb_typeof(post.valor->'value') = 'number'
      THEN (post.valor->>'value')::int
    ELSE NULL
  END AS valor_post,
  CASE
    WHEN q.tipo = 'likert'
      AND jsonb_typeof(pre.valor->'value') = 'number'
      AND jsonb_typeof(post.valor->'value') = 'number'
    THEN (post.valor->>'value')::int - (pre.valor->>'value')::int
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

COMMENT ON VIEW public.mv_delta_pre_post IS
  'Pivot pre vs post por (student, question) sobre preguntas momento=''both''. VIEW normal (siempre viva) tras fix 000006. valor_pre/valor_post extraídos de valor->>''value''. NULL si la pregunta no es Likert.';

GRANT SELECT ON public.mv_delta_pre_post TO service_role;
REVOKE SELECT ON public.mv_delta_pre_post FROM anon, authenticated;

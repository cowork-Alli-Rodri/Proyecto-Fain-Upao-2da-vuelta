-- ============================================================================
-- T018 — Vistas materializadas para el dashboard del docente
-- ============================================================================
-- KPIs y cruces precalculados. Se refrescan vía REFRESH MATERIALIZED VIEW
-- CONCURRENTLY desde server action (debounced 30s) o desde /admin/jne.
-- Cada vista necesita índice único para soportar CONCURRENTLY.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- mv_kpis_curso — KPIs principales del curso
-- ----------------------------------------------------------------------------

CREATE MATERIALIZED VIEW public.mv_kpis_curso AS
SELECT
  1 AS singleton_key,
  COUNT(*) FILTER (WHERE p.role = 'student' AND p.is_anonymized = false) AS total_inscritos,
  COUNT(*) FILTER (WHERE p.role = 'student' AND p.is_anonymized = false AND p.questionnaire_completed_at IS NOT NULL) AS total_completados,
  COUNT(pref.id) AS total_preferencias,
  COUNT(*) FILTER (WHERE p.role = 'student' AND p.is_anonymized = false AND p.questionnaire_completed_at IS NOT NULL)
    - COUNT(pref.id) AS total_completaron_sin_preferencia,
  ROUND(
    AVG(pref.confianza)::numeric,
    2
  ) AS confianza_promedio
FROM public.profiles p
LEFT JOIN public.preferences pref ON pref.student_id = p.id;

CREATE UNIQUE INDEX idx_mv_kpis_curso_singleton ON public.mv_kpis_curso (singleton_key);

COMMENT ON MATERIALIZED VIEW public.mv_kpis_curso IS
  'KPIs principales del dashboard (FR-025, edge case "completó sin preferencia"). Refresh vía REFRESH CONCURRENTLY.';

-- ----------------------------------------------------------------------------
-- mv_preferencia_por_carrera — cruce preferencia × carrera
-- ----------------------------------------------------------------------------

CREATE MATERIALIZED VIEW public.mv_preferencia_por_carrera AS
SELECT
  pr.facultad,
  pr.carrera,
  pref.candidato_preferido,
  COUNT(*) AS n,
  ROUND(AVG(pref.confianza)::numeric, 2) AS confianza_promedio
FROM public.preferences pref
JOIN public.profiles pr ON pr.id = pref.student_id
WHERE pr.is_anonymized = false
GROUP BY pr.facultad, pr.carrera, pref.candidato_preferido;

CREATE UNIQUE INDEX idx_mv_pref_carrera_unique ON public.mv_preferencia_por_carrera (facultad, carrera, candidato_preferido);

COMMENT ON MATERIALIZED VIEW public.mv_preferencia_por_carrera IS
  'Distribución de preferencia por facultad/carrera (FR-027).';

-- ----------------------------------------------------------------------------
-- mv_orden_vs_preferencia — control de sesgo de primacía (Q4)
-- ----------------------------------------------------------------------------

CREATE MATERIALIZED VIEW public.mv_orden_vs_preferencia AS
SELECT
  pref.compare_order_at_submit AS orden_asignado,
  pref.candidato_preferido,
  COUNT(*) AS n
FROM public.preferences pref
JOIN public.profiles pr ON pr.id = pref.student_id
WHERE pr.is_anonymized = false
GROUP BY pref.compare_order_at_submit, pref.candidato_preferido;

CREATE UNIQUE INDEX idx_mv_orden_pref_unique ON public.mv_orden_vs_preferencia (orden_asignado, candidato_preferido);

COMMENT ON MATERIALIZED VIEW public.mv_orden_vs_preferencia IS
  'Análisis del efecto de la posición visual sobre la preferencia (Q4, FR-014b).';

-- ----------------------------------------------------------------------------
-- mv_evolucion_temporal — preferencias por día
-- ----------------------------------------------------------------------------

CREATE MATERIALIZED VIEW public.mv_evolucion_temporal AS
SELECT
  date_trunc('day', pref.submitted_at AT TIME ZONE 'America/Lima')::date AS fecha,
  pref.candidato_preferido,
  COUNT(*) AS n
FROM public.preferences pref
JOIN public.profiles pr ON pr.id = pref.student_id
WHERE pr.is_anonymized = false
GROUP BY date_trunc('day', pref.submitted_at AT TIME ZONE 'America/Lima'), pref.candidato_preferido;

CREATE UNIQUE INDEX idx_mv_evol_unique ON public.mv_evolucion_temporal (fecha, candidato_preferido);

COMMENT ON MATERIALIZED VIEW public.mv_evolucion_temporal IS
  'Evolución temporal de preferencias agrupadas por día (timezone Lima).';

-- ----------------------------------------------------------------------------
-- Grants: las MVs son leídas desde server actions con rol authenticated
-- pero protegidas por role check al nivel de aplicación. RLS no aplica a MVs.
-- ----------------------------------------------------------------------------

GRANT SELECT ON public.mv_kpis_curso TO authenticated, service_role;
GRANT SELECT ON public.mv_preferencia_por_carrera TO authenticated, service_role;
GRANT SELECT ON public.mv_orden_vs_preferencia TO authenticated, service_role;
GRANT SELECT ON public.mv_evolucion_temporal TO authenticated, service_role;

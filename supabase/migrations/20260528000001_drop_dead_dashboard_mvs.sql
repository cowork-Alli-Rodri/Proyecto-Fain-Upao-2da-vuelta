-- ============================================================================
-- Limpieza — Drop de materialized views obsoletas del dashboard
-- ============================================================================
-- mv_kpis_curso, mv_preferencia_por_carrera y mv_evolucion_temporal quedaron
-- sin uso: el dashboard del docente calcula todo en JS leyendo directamente las
-- tablas (lib/dashboard/queries.ts). Nadie las consulta y nada las refrescaba
-- (el RPC `refresh_dashboard_views` nunca existió), así que en la práctica
-- estaban siempre vacías/stale. Se eliminan para no mantener infraestructura
-- muerta.
--
-- IMPORTANTE: `mv_delta_pre_post` NO se toca — la migración 000007 la convirtió
-- en VIEW normal y el dashboard SÍ la usa (cambio de opinión pre/post).
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS public.mv_kpis_curso CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mv_preferencia_por_carrera CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mv_evolucion_temporal CASCADE;

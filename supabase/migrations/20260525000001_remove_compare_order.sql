-- =============================================================================
-- Migration: Remove compare_order infrastructure
-- =============================================================================
-- Motivo: el flujo /cuestionario → /comparador → /encuesta-final fue
-- reemplazado por marketing → /candidatos (público) → /login → /cuestionario
-- → /encuesta-final. El comparador autenticado ya no existe; la columna
-- compare_order y su vista de "efecto orden" pierden sentido.
--
-- Pasos:
--   1. Drop materialized view mv_orden_vs_preferencia (depende de
--      preferences.compare_order_at_submit).
--   2. Drop helper assign_compare_order_random().
--   3. Drop columna profiles.compare_order.
--   4. Drop columna preferences.compare_order_at_submit.
--   5. Drop enum compare_order_enum (ya no quedan referencias).
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS public.mv_orden_vs_preferencia;

DROP FUNCTION IF EXISTS public.assign_compare_order_random();

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS compare_order;

ALTER TABLE public.preferences
  DROP COLUMN IF EXISTS compare_order_at_submit;

DROP TYPE IF EXISTS public.compare_order_enum;

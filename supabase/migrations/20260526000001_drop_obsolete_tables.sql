-- =============================================================================
-- Migration: Drop tablas obsoletas tras el refactor de mayo 2026
-- =============================================================================
-- Motivo:
--   - `plan_dimensions` y `plans` se llenaban con el endpoint antiguo del JNE
--     (4 dimensiones estructuradas). El nuevo endpoint sólo entrega un resumen
--     textual que ya guardamos en `candidates.plan_resumen`. /comparador
--     tampoco existe — nada consume estas tablas.
--   - `fact_check_suggestions` recibía reportes manuales desde el formulario de
--     /no-te-dejes-sorprender. Ese formulario fue reemplazado por el verificador
--     automático (Google Fact Check Tools API), así que la tabla no recibirá
--     entradas nuevas.
--
-- Pasos:
--   1. Drop `plan_dimensions` (FK → plans).
--   2. Drop `plans` (FK → candidates queda intacta).
--   3. Drop `fact_check_suggestions`.
--   4. Limpieza de tipos enum asociados (si quedan huérfanos).
-- =============================================================================

DROP TABLE IF EXISTS public.plan_dimensions CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;

DROP TABLE IF EXISTS public.fact_check_suggestions CASCADE;

-- El enum `fact_check_suggestion_status_enum` sólo lo usaba fact_check_suggestions.
DROP TYPE IF EXISTS public.fact_check_suggestion_status_enum;

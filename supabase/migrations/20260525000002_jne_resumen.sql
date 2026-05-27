-- =============================================================================
-- Migration: JNE moved its API. New endpoint returns AI-generated plan summary.
-- =============================================================================
-- El nuevo dominio (votoinformadoia.jne.gob.pe) reemplazó el endpoint estructurado
-- de 4 dimensiones por un endpoint único que devuelve un resumen textual del plan
-- de gobierno. Como /comparador fue removido, plan_dimensions deja de ser
-- consumida por la UI — la dejamos en el schema para preservar datos históricos
-- pero ya no la refrescamos.
--
-- Agrega `candidates.plan_resumen` para almacenar el texto del resumen.
-- =============================================================================

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS plan_resumen text;

COMMENT ON COLUMN public.candidates.plan_resumen IS
  'Resumen del plan de gobierno provisto por la nueva API del JNE (votoinformadoia). Refrescado por cron jne-refresh.';

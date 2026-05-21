-- ============================================================================
-- T019 — Seed allowed_teachers (vacío por defecto)
-- ============================================================================
-- La whitelist de correos docentes la mantiene el admin manualmente vía:
--   pnpm run add-teacher -- --email docente@upao.edu.pe --note "Razón"
-- o vía SQL directo:
--   INSERT INTO public.allowed_teachers (email, note) VALUES (...);
-- ============================================================================

-- Sin INSERTs: queda vacía en deploy inicial.
-- El admin agrega los correos del/los docente(s) según corresponda.

COMMENT ON TABLE public.allowed_teachers IS
  'Lista blanca docente (Q1, FR-024a). Vacía al deploy. Admin la pobla vía script add-teacher o SQL.';

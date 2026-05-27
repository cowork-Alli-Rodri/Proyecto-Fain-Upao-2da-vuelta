-- ============================================================================
-- Fix: SECURITY DEFINER function exposed via PostgREST (Supabase Advisor)
-- ============================================================================
-- Mueve public.current_role() al schema `internal` (no expuesto por PostgREST)
-- y actualiza las 16 RLS policies que la referencian.
--
-- Por qué internal y no simplemente SECURITY INVOKER:
-- current_role() lee public.profiles, que tiene RLS. Si fuera INVOKER,
-- se crearía recursión infinita al evaluar las mismas policies que dependen
-- de ella. SECURITY DEFINER es correcto aquí; el problema es solo la exposición
-- HTTP. Moverla a un schema no expuesto resuelve el warning sin cambiar lógica.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Schema internal (no listado en PostgREST db-schemas)
-- ----------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS internal;
GRANT USAGE ON SCHEMA internal TO postgres, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. Recrear función en internal
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION internal.current_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION internal.current_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION internal.current_role() TO authenticated, service_role;

COMMENT ON FUNCTION internal.current_role() IS
  'Rol del usuario autenticado actual. Solo uso interno (RLS policies). No expuesta via REST.';

-- ----------------------------------------------------------------------------
-- 3. Actualizar RLS policies — profiles
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS profiles_select_own_or_staff ON public.profiles;
CREATE POLICY profiles_select_own_or_staff ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR internal.current_role() IN ('teacher', 'admin')
  );

DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  USING (internal.current_role() = 'admin');

DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;
CREATE POLICY profiles_delete_admin ON public.profiles
  FOR DELETE
  USING (internal.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 4. consent_events
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS consent_select_own_or_admin ON public.consent_events;
CREATE POLICY consent_select_own_or_admin ON public.consent_events
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR internal.current_role() = 'admin'
  );

DROP POLICY IF EXISTS consent_delete_admin ON public.consent_events;
CREATE POLICY consent_delete_admin ON public.consent_events
  FOR DELETE
  USING (internal.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 5. questions
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS questions_select_active ON public.questions;
CREATE POLICY questions_select_active ON public.questions
  FOR SELECT
  USING (
    activo = true
    OR internal.current_role() = 'admin'
  );

DROP POLICY IF EXISTS questions_insert_admin ON public.questions;
CREATE POLICY questions_insert_admin ON public.questions
  FOR INSERT
  WITH CHECK (internal.current_role() = 'admin');

DROP POLICY IF EXISTS questions_update_admin ON public.questions;
CREATE POLICY questions_update_admin ON public.questions
  FOR UPDATE
  USING (internal.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 6. answers
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS answers_select_own_or_staff ON public.answers;
CREATE POLICY answers_select_own_or_staff ON public.answers
  FOR SELECT
  USING (
    student_id = auth.uid()
    OR internal.current_role() IN ('teacher', 'admin')
  );

-- ----------------------------------------------------------------------------
-- 7. preferences
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS preferences_select_own_or_staff ON public.preferences;
CREATE POLICY preferences_select_own_or_staff ON public.preferences
  FOR SELECT
  USING (
    student_id = auth.uid()
    OR internal.current_role() IN ('teacher', 'admin')
  );

DROP POLICY IF EXISTS preferences_delete_admin ON public.preferences;
CREATE POLICY preferences_delete_admin ON public.preferences
  FOR DELETE
  USING (internal.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 8. allowed_teachers
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS allowed_teachers_admin_all ON public.allowed_teachers;
CREATE POLICY allowed_teachers_admin_all ON public.allowed_teachers
  FOR ALL
  USING (internal.current_role() = 'admin')
  WITH CHECK (internal.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 9. usage_events
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS usage_events_select_admin ON public.usage_events;
CREATE POLICY usage_events_select_admin ON public.usage_events
  FOR SELECT
  USING (internal.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 10. jne_refresh_log
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS jne_log_select_admin ON public.jne_refresh_log;
CREATE POLICY jne_log_select_admin ON public.jne_refresh_log
  FOR SELECT
  USING (internal.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 11. anonymization_log
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS anon_log_select_admin ON public.anonymization_log;
CREATE POLICY anon_log_select_admin ON public.anonymization_log
  FOR SELECT
  USING (internal.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 12. app_settings
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS app_settings_admin_all ON public.app_settings;
CREATE POLICY app_settings_admin_all ON public.app_settings
  FOR ALL
  USING (internal.current_role() = 'admin')
  WITH CHECK (internal.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 13. Eliminar función de public (ya no necesaria, policies actualizadas)
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.current_role();

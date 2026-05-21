-- ============================================================================
-- T014 — RLS Policies (Voto Informado UPAO)
-- ============================================================================
-- Constitución III (NO NEGOCIABLE): RLS habilitado en TODA tabla que toca
-- auth.users. Matriz de policies según data-model.md.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: estudiante ve solo el suyo; teacher/admin ven todos
CREATE POLICY profiles_select_own_or_staff ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR public.current_role() IN ('teacher', 'admin')
  );

-- INSERT: el trigger on_auth_user_created se ejecuta con SECURITY DEFINER,
-- así que los usuarios no necesitan policy de INSERT.

-- UPDATE: el estudiante puede actualizar su propio profile excepto el campo role
CREATE POLICY profiles_update_own_not_role ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- UPDATE admin: puede actualizar todo
CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  USING (public.current_role() = 'admin');

-- DELETE: solo admin
CREATE POLICY profiles_delete_admin ON public.profiles
  FOR DELETE
  USING (public.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- consent_events
-- ----------------------------------------------------------------------------

ALTER TABLE public.consent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY consent_select_own_or_admin ON public.consent_events
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.current_role() = 'admin'
  );

CREATE POLICY consent_insert_own ON public.consent_events
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- No UPDATE policy: tabla inmutable.

CREATE POLICY consent_delete_admin ON public.consent_events
  FOR DELETE
  USING (public.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- questions
-- ----------------------------------------------------------------------------

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- SELECT: todo autenticado ve preguntas activas; admin ve todas
CREATE POLICY questions_select_active ON public.questions
  FOR SELECT
  USING (
    activo = true
    OR public.current_role() = 'admin'
  );

CREATE POLICY questions_insert_admin ON public.questions
  FOR INSERT
  WITH CHECK (public.current_role() = 'admin');

CREATE POLICY questions_update_admin ON public.questions
  FOR UPDATE
  USING (public.current_role() = 'admin');

-- DELETE: bloqueado vía trigger (soft delete con activo=false preferido).

-- ----------------------------------------------------------------------------
-- answers
-- ----------------------------------------------------------------------------

ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- SELECT: estudiante ve solo las suyas; teacher/admin ven todas (para dashboard)
CREATE POLICY answers_select_own_or_staff ON public.answers
  FOR SELECT
  USING (
    student_id = auth.uid()
    OR public.current_role() IN ('teacher', 'admin')
  );

-- INSERT: solo own y solo si no ha enviado el cuestionario
CREATE POLICY answers_insert_own_pre_complete ON public.answers
  FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND (
      SELECT questionnaire_completed_at FROM public.profiles WHERE id = auth.uid()
    ) IS NULL
  );

-- UPDATE: solo own y solo si no ha enviado el cuestionario (FR-011)
CREATE POLICY answers_update_own_pre_complete ON public.answers
  FOR UPDATE
  USING (
    student_id = auth.uid()
    AND (
      SELECT questionnaire_completed_at FROM public.profiles WHERE id = auth.uid()
    ) IS NULL
  );

-- No DELETE policy: respuestas nunca se borran (preservan historial).

-- ----------------------------------------------------------------------------
-- candidates / plans / plan_dimensions — lectura para autenticados, escritura solo service_role
-- ----------------------------------------------------------------------------

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_dimensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY candidates_select_authenticated ON public.candidates
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY plans_select_authenticated ON public.plans
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY plan_dimensions_select_authenticated ON public.plan_dimensions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Escritura: solo service_role (cron handlers). No hace falta policy explícita
-- porque service_role bypassea RLS por default.

-- ----------------------------------------------------------------------------
-- preferences
-- ----------------------------------------------------------------------------

ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY preferences_select_own_or_staff ON public.preferences
  FOR SELECT
  USING (
    student_id = auth.uid()
    OR public.current_role() IN ('teacher', 'admin')
  );

-- INSERT: solo own, una sola vez (UNIQUE student_id refuerza)
CREATE POLICY preferences_insert_own ON public.preferences
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- No UPDATE policy: inmutable v1 (FR-021, Q2).

CREATE POLICY preferences_delete_admin ON public.preferences
  FOR DELETE
  USING (public.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- allowed_teachers — solo admin
-- ----------------------------------------------------------------------------

ALTER TABLE public.allowed_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY allowed_teachers_admin_all ON public.allowed_teachers
  FOR ALL
  USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- usage_events — solo service_role escribe, admin lee
-- ----------------------------------------------------------------------------

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_events_select_admin ON public.usage_events
  FOR SELECT
  USING (public.current_role() = 'admin');

-- INSERT solo via service_role (no policy para authenticated).

-- ----------------------------------------------------------------------------
-- jne_refresh_log — admin lee, service_role escribe
-- ----------------------------------------------------------------------------

ALTER TABLE public.jne_refresh_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY jne_log_select_admin ON public.jne_refresh_log
  FOR SELECT
  USING (public.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- anonymization_log — admin lee, service_role escribe
-- ----------------------------------------------------------------------------

ALTER TABLE public.anonymization_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY anon_log_select_admin ON public.anonymization_log
  FOR SELECT
  USING (public.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- app_settings — admin lee y escribe, service_role bypassea
-- ----------------------------------------------------------------------------

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY app_settings_admin_all ON public.app_settings
  FOR ALL
  USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

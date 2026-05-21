-- ============================================================================
-- T015 — Triggers (Voto Informado UPAO)
-- ============================================================================
-- Constraints de negocio enforced en DB: snapshot lock, preferences inmutable,
-- soft delete de preguntas, email institucional auto-detectado, profile on signup.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. on_auth_user_created — crea profile al hacer signup, eleva rol si está en allowed_teachers
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role user_role := 'student';
BEGIN
  -- Eleva a teacher si el correo está en la whitelist (Q1)
  IF EXISTS (SELECT 1 FROM public.allowed_teachers WHERE email = NEW.email::citext) THEN
    v_role := 'teacher';
  END IF;

  INSERT INTO public.profiles (id, role, email, email_institucional)
  VALUES (
    NEW.id,
    v_role,
    NEW.email::citext,
    NEW.email ILIKE '%@upao.edu.pe'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
  'Crea profile en signup. Eleva rol a teacher si email está en allowed_teachers (Q1, FR-024a). Marca email_institucional para @upao.edu.pe (FR-002).';

-- ----------------------------------------------------------------------------
-- 2. profiles_set_email_institucional — recalcula flag al editar email
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.profiles_set_email_institucional()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.email_institucional := (NEW.email IS NOT NULL AND NEW.email::text ILIKE '%@upao.edu.pe');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_email_institucional
  BEFORE INSERT OR UPDATE OF email ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_set_email_institucional();

-- ----------------------------------------------------------------------------
-- 3. answers_snapshot_lock — impide modificar columnas snapshot tras insert
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.answers_snapshot_lock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.question_snapshot IS DISTINCT FROM OLD.question_snapshot
     OR NEW.dimension_snapshot IS DISTINCT FROM OLD.dimension_snapshot
     OR NEW.tipo_snapshot IS DISTINCT FROM OLD.tipo_snapshot
     OR NEW.student_id IS DISTINCT FROM OLD.student_id
     OR NEW.question_id IS DISTINCT FROM OLD.question_id THEN
    RAISE EXCEPTION 'answers: las columnas snapshot/identidad son inmutables tras el primer insert (FR-012)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_answers_snapshot_lock
  BEFORE UPDATE ON public.answers
  FOR EACH ROW
  EXECUTE FUNCTION public.answers_snapshot_lock();

-- ----------------------------------------------------------------------------
-- 4. preferences_immutable — bloquea cualquier UPDATE en preferences (v1)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.preferences_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'preferences: la preferencia es final por usuario en v1 (FR-021, Q2). Sin updates permitidos.';
END;
$$;

CREATE TRIGGER trg_preferences_immutable
  BEFORE UPDATE ON public.preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.preferences_immutable();

-- ----------------------------------------------------------------------------
-- 5. questions_no_delete — soft delete preferred (activo=false)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.questions_no_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'questions: usa soft delete (UPDATE activo=false). DELETE no permitido para preservar histórico (FR-032).';
END;
$$;

CREATE TRIGGER trg_questions_no_delete
  BEFORE DELETE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.questions_no_delete();

-- ----------------------------------------------------------------------------
-- 6. updated_at triggers — genéricos
-- ----------------------------------------------------------------------------

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_answers_updated_at
  BEFORE UPDATE ON public.answers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

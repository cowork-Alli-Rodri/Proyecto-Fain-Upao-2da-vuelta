-- ============================================================================
-- T013 — Init schema (Voto Informado UPAO)
-- ============================================================================
-- Crea ENUMs, 13 tablas, índices y constraints según data-model.md.
-- RLS y triggers se aplican en migraciones posteriores.
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid, digest
CREATE EXTENSION IF NOT EXISTS "citext";      -- case-insensitive email
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- búsqueda fuzzy en dashboard

-- ============================================================================
-- ENUM types
-- ============================================================================

CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE compare_order_enum AS ENUM ('keiko_left', 'roberto_left');
CREATE TYPE dim_tematica_enum AS ENUM ('social', 'economica', 'ambiental', 'institucional');
CREATE TYPE question_type_enum AS ENUM ('likert', 'single', 'multiple', 'text', 'ranking', 'comparison');

-- ============================================================================
-- 1. profiles — espejo de auth.users con rol, demografía y estado del estudiante
-- ============================================================================

CREATE TABLE public.profiles (
  id                          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                        user_role NOT NULL DEFAULT 'student',
  email_institucional         boolean NOT NULL DEFAULT false,
  nombres                     text,
  apellidos                   text,
  email                       citext,
  facultad                    text,
  carrera                     text,
  ciclo                       smallint CHECK (ciclo IS NULL OR (ciclo >= 1 AND ciclo <= 14)),
  rango_edad                  text CHECK (rango_edad IS NULL OR rango_edad IN ('17-19','20-22','23-25','26+')),
  genero                      text,
  compare_order               compare_order_enum,
  current_step                smallint NOT NULL DEFAULT 0,
  questionnaire_completed_at  timestamptz,
  is_anonymized               boolean NOT NULL DEFAULT false,
  anonymized_at               timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON public.profiles (role);
CREATE INDEX idx_profiles_facultad_carrera ON public.profiles (facultad, carrera);
CREATE INDEX idx_profiles_completed_at ON public.profiles (questionnaire_completed_at) WHERE questionnaire_completed_at IS NOT NULL;
CREATE INDEX idx_profiles_anonymized ON public.profiles (is_anonymized) WHERE is_anonymized = true;

COMMENT ON TABLE public.profiles IS 'Espejo de auth.users con rol y demografía. RLS habilitado en 0002.';
COMMENT ON COLUMN public.profiles.compare_order IS 'Orden izq/der asignado al primer acceso al comparador (FR-014a). Inmutable después.';
COMMENT ON COLUMN public.profiles.current_step IS 'Puntero al paso actual del cuestionario para resume (FR-010).';

-- ============================================================================
-- 2. consent_events — bitácora del consentimiento informado (Ley 29733)
-- ============================================================================

CREATE TABLE public.consent_events (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  accepted_terms_at        timestamptz NOT NULL,
  accepted_data_use_at     timestamptz NOT NULL,
  consent_version          text NOT NULL,
  ip_hash                  text,
  user_agent_hash          text
);

CREATE INDEX idx_consent_user_time ON public.consent_events (user_id, accepted_terms_at);

COMMENT ON TABLE public.consent_events IS 'Registro inmutable del consentimiento + opt-in explícito (FR-004, FR-004a, Q3).';

-- ============================================================================
-- 3. questions — banco de preguntas (10-15 activas en 4 dimensiones JNE)
-- ============================================================================

CREATE TABLE public.questions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden               smallint NOT NULL,
  dimension_tematica  dim_tematica_enum NOT NULL,
  tipo                question_type_enum NOT NULL,
  enunciado           text NOT NULL,
  opciones            jsonb,
  activo              boolean NOT NULL DEFAULT true,
  fuente              text,
  created_by          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT questions_text_no_options CHECK (
    (tipo = 'text' AND opciones IS NULL)
    OR (tipo <> 'text' AND opciones IS NOT NULL)
  )
);

CREATE INDEX idx_questions_activo_orden ON public.questions (activo, orden);

COMMENT ON TABLE public.questions IS 'Banco de preguntas editable por admin (FR-007a, FR-031). Snapshot en answers protege históricos.';

-- ============================================================================
-- 4. answers — respuestas del estudiante con snapshot del enunciado
-- ============================================================================

CREATE TABLE public.answers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id         uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  valor               jsonb NOT NULL,
  question_snapshot   text NOT NULL,
  dimension_snapshot  dim_tematica_enum NOT NULL,
  tipo_snapshot       question_type_enum NOT NULL,
  responded_at        timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, question_id)
);

CREATE INDEX idx_answers_student_time ON public.answers (student_id, responded_at);
CREATE INDEX idx_answers_question ON public.answers (question_id);

COMMENT ON TABLE public.answers IS 'Una respuesta por estudiante por pregunta. Snapshot del enunciado/tipo se setea en primer insert y nunca se modifica (FR-012).';

-- ============================================================================
-- 5. candidates — espejo del JNE
-- ============================================================================

CREATE TABLE public.candidates (
  id                          integer PRIMARY KEY,
  id_organizacion_politica    integer NOT NULL,
  nombre_completo             text NOT NULL,
  partido                     text NOT NULL,
  cargo                       text NOT NULL DEFAULT 'Presidente',
  foto_url                    text,
  plan_pdf_url                text,
  last_synced_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.candidates IS 'Espejo del JNE. id = idCandidato del JNE. Mantenido por cron jne-refresh.';

-- ============================================================================
-- 6. plans — plan de gobierno por candidato
-- ============================================================================

CREATE TABLE public.plans (
  id                  integer PRIMARY KEY,
  candidate_id        integer NOT NULL UNIQUE REFERENCES public.candidates(id) ON DELETE CASCADE,
  header_json         jsonb NOT NULL,
  last_synced_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.plans IS 'idPlanGobierno del JNE (Keiko 29690, Roberto 29688).';

-- ============================================================================
-- 7. plan_dimensions — 4 dimensiones por plan (Social/Económica/Ambiental/Institucional)
-- ============================================================================

CREATE TABLE public.plan_dimensions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id             integer NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  dimension           dim_tematica_enum NOT NULL,
  problema            text,
  objetivo            text,
  indicador           text,
  meta                text,
  raw_json            jsonb NOT NULL,
  last_synced_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, dimension)
);

CREATE INDEX idx_plan_dimensions_plan ON public.plan_dimensions (plan_id);

COMMENT ON TABLE public.plan_dimensions IS 'Detalle del plan por dimensión. Si campo NULL → UI muestra "No declarado por el JNE" (FR-018).';

-- ============================================================================
-- 8. preferences — preferencia final inmutable por usuario (Q2)
-- ============================================================================

CREATE TABLE public.preferences (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id                  uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidato_preferido         text NOT NULL CHECK (candidato_preferido IN ('keiko','roberto','indeciso')),
  confianza                   smallint NOT NULL CHECK (confianza >= 1 AND confianza <= 10),
  motivo                      text CHECK (motivo IS NULL OR length(motivo) <= 500),
  compare_order_at_submit     compare_order_enum NOT NULL,
  submitted_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_preferences_candidato ON public.preferences (candidato_preferido);
CREATE INDEX idx_preferences_submitted ON public.preferences (submitted_at);

COMMENT ON TABLE public.preferences IS 'Preferencia final por usuario. Inmutable en v1 (FR-021, Q2). UNIQUE student_id refuerza one-shot.';

-- ============================================================================
-- 9. allowed_teachers — whitelist de correos que se elevan a teacher al login (Q1)
-- ============================================================================

CREATE TABLE public.allowed_teachers (
  email           citext PRIMARY KEY,
  added_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  added_at        timestamptz NOT NULL DEFAULT now(),
  note            text
);

COMMENT ON TABLE public.allowed_teachers IS 'Lista blanca de docentes. Trigger on_auth_user_created lee esta tabla y eleva rol (FR-024a, Q1).';

-- ============================================================================
-- 10. usage_events — eventos anónimos de producto (sin PII, no FK a profiles)
-- ============================================================================

CREATE TABLE public.usage_events (
  id                  bigserial PRIMARY KEY,
  opaque_user_id      text NOT NULL,
  event_type          text NOT NULL,
  payload             jsonb,
  occurred_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_events_type_time ON public.usage_events (event_type, occurred_at);
CREATE INDEX idx_usage_events_user_time ON public.usage_events (opaque_user_id, occurred_at);

COMMENT ON TABLE public.usage_events IS 'Eventos anónimos. opaque_user_id es hash determinístico, NO FK — sobrevive a la anonimización.';

-- ============================================================================
-- 11. jne_refresh_log — auditoría del cron JNE
-- ============================================================================

CREATE TABLE public.jne_refresh_log (
  id                       bigserial PRIMARY KEY,
  triggered_by             text NOT NULL CHECK (triggered_by IN ('cron','admin')),
  started_at               timestamptz NOT NULL DEFAULT now(),
  finished_at              timestamptz,
  status                   text NOT NULL CHECK (status IN ('running','success','partial','failed')),
  candidates_updated       smallint NOT NULL DEFAULT 0,
  dimensions_updated       smallint NOT NULL DEFAULT 0,
  error_message            text
);

CREATE INDEX idx_jne_log_started ON public.jne_refresh_log (started_at DESC);

COMMENT ON TABLE public.jne_refresh_log IS 'Bitácora del cron de refresh JNE (FR-034, FR-035, FR-036).';

-- ============================================================================
-- 12. anonymization_log — auditoría Ley 29733
-- ============================================================================

CREATE TABLE public.anonymization_log (
  id                          bigserial PRIMARY KEY,
  executed_at                 timestamptz NOT NULL DEFAULT now(),
  affected_rows               integer NOT NULL DEFAULT 0,
  cycle_close_date_cutoff     timestamptz NOT NULL,
  executor                    text NOT NULL CHECK (executor IN ('cron','admin_manual','user_request'))
);

CREATE INDEX idx_anonymization_log_executed ON public.anonymization_log (executed_at DESC);

COMMENT ON TABLE public.anonymization_log IS 'Auditoría del job de anonimización Ley 29733 (FR-041c).';

-- ============================================================================
-- 13. app_settings — configuración global single-row
-- ============================================================================

CREATE TABLE public.app_settings (
  id                          smallint PRIMARY KEY CHECK (id = 1),
  ciclo_cierre_at             timestamptz,
  consent_version             text NOT NULL DEFAULT 'v1',
  jne_session_token           text,
  jne_token_expires_at        timestamptz
);

-- Seed la única fila permitida
INSERT INTO public.app_settings (id) VALUES (1);

COMMENT ON TABLE public.app_settings IS 'Configuración global. Solo existe un row (id=1). Admin actualiza ciclo_cierre_at.';

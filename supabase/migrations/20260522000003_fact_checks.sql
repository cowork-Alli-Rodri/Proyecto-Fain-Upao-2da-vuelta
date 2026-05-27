-- ============================================================================
-- Fact checks · "No te dejes sorprender" (B6 alternativo)
-- ============================================================================
-- En lugar de scrapear webs de fact-checkers (frágil — los HTML cambian sin
-- aviso) usamos una tabla curada por el admin con referencias a la fuente
-- verificadora real. El estudiante también puede SUGERIR contenido a revisar.
--
-- Decisión: no almacenamos el texto original de la noticia falsa para no
-- amplificarla — solo el contexto + el enlace al fact-check externo.
-- ============================================================================

CREATE TYPE public.fact_check_status_enum AS ENUM ('draft', 'published', 'archived');

CREATE TABLE public.fact_checks (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titular_falso         text NOT NULL CHECK (char_length(titular_falso) BETWEEN 5 AND 220),
  contexto              text NOT NULL CHECK (char_length(contexto) BETWEEN 20 AND 1000),
  fact_checker_name     text NOT NULL CHECK (char_length(fact_checker_name) BETWEEN 2 AND 80),
  fact_checker_url      text NOT NULL CHECK (fact_checker_url ~ '^https?://'),
  candidato_relacionado text CHECK (candidato_relacionado IN ('keiko', 'roberto', 'ambos', 'ninguno')),
  fecha_origen          date,
  status                public.fact_check_status_enum NOT NULL DEFAULT 'draft',
  published_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.fact_checks IS
  'Fact checks curados manualmente por el admin sobre desinformación que circula respecto a las candidaturas. Para B6 "No te dejes sorprender".';

CREATE INDEX idx_fact_checks_status_published ON public.fact_checks (status, published_at DESC);
CREATE INDEX idx_fact_checks_candidato ON public.fact_checks (candidato_relacionado);

CREATE TRIGGER fact_checks_set_updated_at
  BEFORE UPDATE ON public.fact_checks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sugerencias del público — cualquier usuario autenticado puede crear, solo
-- el admin las ve y procesa.
CREATE TYPE public.fact_check_suggestion_status_enum AS ENUM (
  'pending',
  'reviewed',
  'rejected',
  'converted'
);

CREATE TABLE public.fact_check_suggestions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titular_sospechoso    text NOT NULL CHECK (char_length(titular_sospechoso) BETWEEN 10 AND 220),
  url_o_fuente          text NOT NULL CHECK (char_length(url_o_fuente) BETWEEN 5 AND 500),
  comentario            text CHECK (char_length(comentario) <= 500),
  status                public.fact_check_suggestion_status_enum NOT NULL DEFAULT 'pending',
  submitted_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at          timestamptz NOT NULL DEFAULT now(),
  reviewed_at           timestamptz,
  reviewed_by           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fact_check_id         uuid REFERENCES public.fact_checks(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.fact_check_suggestions IS
  'Sugerencias de fact-check enviadas por estudiantes. El admin las revisa y, si procede, las convierte en un fact_check publicado.';

CREATE INDEX idx_fc_suggestions_status ON public.fact_check_suggestions (status, submitted_at DESC);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE public.fact_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_check_suggestions ENABLE ROW LEVEL SECURITY;

-- fact_checks: público lee solo `published`. Admin lee + escribe todo.
CREATE POLICY fact_checks_public_read ON public.fact_checks
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY fact_checks_admin_all ON public.fact_checks
  FOR ALL
  TO authenticated
  USING (internal.current_role() = 'admin')
  WITH CHECK (internal.current_role() = 'admin');

-- fact_check_suggestions: cualquier autenticado puede crear, ve solo las suyas.
-- Admin ve todas y puede actualizar status.
CREATE POLICY fc_suggestions_insert_authenticated ON public.fact_check_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (submitted_by = auth.uid() OR submitted_by IS NULL);

CREATE POLICY fc_suggestions_select_own ON public.fact_check_suggestions
  FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid());

CREATE POLICY fc_suggestions_admin_all ON public.fact_check_suggestions
  FOR ALL
  TO authenticated
  USING (internal.current_role() = 'admin')
  WITH CHECK (internal.current_role() = 'admin');

GRANT SELECT ON public.fact_checks TO anon, authenticated;
GRANT ALL ON public.fact_checks TO service_role;
GRANT SELECT, INSERT ON public.fact_check_suggestions TO authenticated;
GRANT ALL ON public.fact_check_suggestions TO service_role;

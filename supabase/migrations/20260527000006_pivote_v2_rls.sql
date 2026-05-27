-- ============================================================================
-- Pivote v2 — Migration 6/6: RLS policies actualizadas para flujo pre/post
-- ============================================================================
-- En v1, las policies de answers chequeaban `questionnaire_completed_at IS NULL`
-- para permitir insert/update. En v2 cada bloque tiene su propio cierre:
--
--   - momento_snapshot='pre'  → requiere questionnaire_pre_completed_at IS NULL
--   - momento_snapshot='post' → requiere questionnaire_post_completed_at IS NULL
--                                Y candidatos_completed_at IS NOT NULL (gating)
--
-- Esto enforces el orden del flujo a nivel de DB, defensa en profundidad
-- respecto al middleware.
-- ============================================================================

-- Drop policies viejas
DROP POLICY IF EXISTS answers_insert_own_pre_complete ON public.answers;
DROP POLICY IF EXISTS answers_update_own_pre_complete ON public.answers;

-- INSERT v2: depende del momento_snapshot que se está insertando
CREATE POLICY answers_insert_own_v2 ON public.answers
  FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND (
      -- Bloque pre: el cierre de pre todavía no ocurrió
      (
        momento_snapshot = 'pre'
        AND (
          SELECT questionnaire_pre_completed_at
          FROM public.profiles
          WHERE id = auth.uid()
        ) IS NULL
      )
      OR
      -- Bloque post: candidatos completos y cierre de post no ocurrido
      (
        momento_snapshot = 'post'
        AND (
          SELECT candidatos_completed_at
          FROM public.profiles
          WHERE id = auth.uid()
        ) IS NOT NULL
        AND (
          SELECT questionnaire_post_completed_at
          FROM public.profiles
          WHERE id = auth.uid()
        ) IS NULL
      )
    )
  );

-- UPDATE v2: mismas condiciones que INSERT pero contra el row existente.
-- (Usa USING para gating de qué rows puede tocar el user.)
CREATE POLICY answers_update_own_v2 ON public.answers
  FOR UPDATE
  USING (
    student_id = auth.uid()
    AND (
      (
        momento_snapshot = 'pre'
        AND (
          SELECT questionnaire_pre_completed_at
          FROM public.profiles
          WHERE id = auth.uid()
        ) IS NULL
      )
      OR
      (
        momento_snapshot = 'post'
        AND (
          SELECT questionnaire_post_completed_at
          FROM public.profiles
          WHERE id = auth.uid()
        ) IS NULL
      )
    )
  );

COMMENT ON POLICY answers_insert_own_v2 ON public.answers IS
  'v2: insert solo si el bloque correspondiente al momento_snapshot está abierto. Post requiere haber completado candidatos.';

COMMENT ON POLICY answers_update_own_v2 ON public.answers IS
  'v2: update solo del bloque que aún no se cerró. Una vez cerrado pre o post, esas answers quedan inmutables.';

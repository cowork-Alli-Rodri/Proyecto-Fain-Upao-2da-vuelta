-- ============================================================================
-- T016 — Helper functions (Voto Informado UPAO)
-- ============================================================================
-- Funciones SQL/PLPGSQL utilitarias. Se aplican antes de RLS porque las
-- policies dependen de current_role().
-- ============================================================================

-- ----------------------------------------------------------------------------
-- current_role() — rol del usuario autenticado actual
-- ----------------------------------------------------------------------------
-- Usado en RLS policies. SECURITY DEFINER porque el llamador (rol authenticated)
-- no tiene acceso directo a public.profiles bajo políticas RLS recursivas.
-- Devuelve NULL si no hay sesión o el profile no existe.

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_role() TO authenticated, service_role;

COMMENT ON FUNCTION public.current_role() IS
  'Rol del usuario autenticado actual (student/teacher/admin) o NULL si no hay sesión.';

-- ----------------------------------------------------------------------------
-- assign_compare_order_random() — sortea orden Keiko/Roberto 50/50
-- ----------------------------------------------------------------------------
-- Implementa la decisión Q4: orden aleatorio persistente por estudiante.
-- Usado por la server action assignCompareOrderIfMissing al primer acceso
-- al comparador.

CREATE OR REPLACE FUNCTION public.assign_compare_order_random()
RETURNS compare_order_enum
LANGUAGE sql
VOLATILE
AS $$
  SELECT CASE
    WHEN random() < 0.5 THEN 'keiko_left'::compare_order_enum
    ELSE 'roberto_left'::compare_order_enum
  END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_compare_order_random() TO authenticated, service_role;

COMMENT ON FUNCTION public.assign_compare_order_random() IS
  'Sortea orden izq/der 50/50 (Q4). Llamado una sola vez por estudiante al primer acceso al comparador.';

-- ----------------------------------------------------------------------------
-- hash_opaque_user_id(uuid) — hash determinístico para usage_events
-- ----------------------------------------------------------------------------
-- Convierte auth.users.id en un identificador opaco no reversible que sobrevive
-- a la anonimización. Usa SHA-256.

CREATE OR REPLACE FUNCTION public.hash_opaque_user_id(user_uuid uuid)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'u_' || encode(digest(user_uuid::text || ':voto-informado-upao', 'sha256'), 'hex');
$$;

GRANT EXECUTE ON FUNCTION public.hash_opaque_user_id(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.hash_opaque_user_id(uuid) IS
  'Hash SHA-256 determinístico de un UUID. Usado para opaque_user_id en usage_events (FR-039).';

-- ----------------------------------------------------------------------------
-- set_updated_at() — trigger genérico para updated_at
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
  'Trigger genérico que actualiza updated_at en cada UPDATE.';

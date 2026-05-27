-- ============================================================================
-- T-postlaunch — Endurecimiento de seguridad (Supabase Advisors)
-- ============================================================================
-- Resuelve los warnings del linter de Supabase:
--   1. function_search_path_mutable — fija search_path explícito en cada
--      function/trigger del proyecto (defensa anti search-path hijacking).
--   2. extension_in_public — mueve `citext` y `pg_trgm` al schema `extensions`
--      (práctica recomendada en Supabase Cloud).
--   3. materialized_view_in_api — revoca SELECT sobre las 4 MVs del dashboard
--      a roles anon/authenticated. Las queries del docente usan service-role.
--   4. anon_security_definer_function_executable — revoca EXECUTE sobre las
--      funciones SECURITY DEFINER que NO deben ser invocables vía /rest/v1/rpc.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Funciones — fijar search_path explícito
-- ----------------------------------------------------------------------------

ALTER FUNCTION public.assign_compare_order_random()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.set_updated_at()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.profiles_set_email_institucional()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.answers_snapshot_lock()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.preferences_immutable()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.questions_no_delete()
  SET search_path = public, pg_catalog;

-- Las funciones `current_role`, `hash_opaque_user_id`, `handle_new_user` y
-- `rls_auto_enable` ya tienen `SET search_path` en sus migraciones originales,
-- pero igual lo reforzamos por idempotencia.

ALTER FUNCTION public.current_role()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.hash_opaque_user_id(uuid)
  SET search_path = public, extensions, pg_catalog;


-- ----------------------------------------------------------------------------
-- 2. Mover extensiones de public → extensions
-- ----------------------------------------------------------------------------
-- Supabase Cloud provee el schema `extensions` con permisos correctos.
-- Si la migración corre en Supabase local (Docker) donde `extensions` no
-- existe, lo creamos defensivamente.

CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

ALTER EXTENSION citext SET SCHEMA extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;


-- ----------------------------------------------------------------------------
-- 3. Materialized views — revocar SELECT a roles anon/authenticated
-- ----------------------------------------------------------------------------
-- El dashboard del docente usa `createAdminClient` (service-role), que
-- bypassa estos permisos. Revocar a roles públicos elimina la posibilidad
-- de exponer agregados sensibles vía /rest/v1/.

REVOKE SELECT ON public.mv_kpis_curso FROM anon, authenticated;
REVOKE SELECT ON public.mv_preferencia_por_carrera FROM anon, authenticated;
REVOKE SELECT ON public.mv_orden_vs_preferencia FROM anon, authenticated;
REVOKE SELECT ON public.mv_evolucion_temporal FROM anon, authenticated;


-- ----------------------------------------------------------------------------
-- 4. SECURITY DEFINER functions — revocar EXECUTE de roles externos
-- ----------------------------------------------------------------------------
-- Estas funciones son helpers internos (usadas por RLS, triggers o jobs):
-- NO deben ser invocables vía /rest/v1/rpc/<nombre>.

REVOKE EXECUTE ON FUNCTION public.current_role() FROM anon, authenticated, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, PUBLIC;

-- `current_role()` SÍ debe ser ejecutable por authenticated porque las RLS
-- policies la invocan internamente al evaluar `public.current_role() = 'admin'`.
-- Re-otorgamos solo a authenticated. (anon nunca pasa por RLS porque no
-- pertenece al schema `auth.users`.)

GRANT EXECUTE ON FUNCTION public.current_role() TO authenticated, service_role;

-- `hash_opaque_user_id` la usan las server actions desde service-role; no
-- necesita ser expuesta vía RPC.
REVOKE EXECUTE ON FUNCTION public.hash_opaque_user_id(uuid) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.hash_opaque_user_id(uuid) TO service_role;

-- `assign_compare_order_random` la usa el server action `assignCompareOrderIfMissing`
-- bajo el rol del estudiante autenticado. Mantenerla ejecutable por authenticated.
-- (No requiere ajuste — el GRANT original ya estaba bien.)


COMMENT ON SCHEMA extensions IS
  'Schema para extensiones Postgres (citext, pg_trgm). Movidas desde public por seguridad.';

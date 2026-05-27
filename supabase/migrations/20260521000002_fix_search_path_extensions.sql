-- ============================================================================
-- Fix — incluir `extensions` en search_path de funciones que usan citext / pg_trgm
-- ============================================================================
-- En la migración anterior (20260521000001_security_hardening) movimos
-- las extensiones `citext` y `pg_trgm` al schema `extensions` por buenas
-- prácticas. Pero las funciones que castean a `citext` (handle_new_user
-- y profiles_set_email_institucional) tenían search_path = public, auth
-- — sin `extensions`. Resultado: `Database error saving new user` al hacer
-- signup.
-- ============================================================================

ALTER FUNCTION public.handle_new_user()
  SET search_path = public, auth, extensions, pg_catalog;

ALTER FUNCTION public.profiles_set_email_institucional()
  SET search_path = public, extensions, pg_catalog;

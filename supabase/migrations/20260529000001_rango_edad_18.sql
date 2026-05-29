-- ============================================================================
-- Rango de edad: ahora inicia en 18 años (edad mínima del electorado).
-- ============================================================================
-- Cambia las opciones de profiles.rango_edad de '17-19' a '18-19'. Migra las
-- filas existentes con '17-19' a '18-19' y reemplaza el CHECK constraint.
-- El nombre del constraint inline original es autogenerado por Postgres; lo
-- ubicamos por su definición para no depender del nombre exacto.
-- ============================================================================

DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.profiles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%rango_edad%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cname);
  END IF;
END $$;

UPDATE public.profiles SET rango_edad = '18-19' WHERE rango_edad = '17-19';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_rango_edad_check
  CHECK (rango_edad IS NULL OR rango_edad IN ('18-19','20-22','23-25','26+'));

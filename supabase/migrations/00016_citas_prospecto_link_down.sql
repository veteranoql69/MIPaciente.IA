DROP INDEX IF EXISTS idx_mpaci_citas_prospecto;
ALTER TABLE public.mpaci_citas
    DROP COLUMN IF EXISTS prospecto_id;

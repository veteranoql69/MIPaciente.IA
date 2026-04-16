-- Rollback: 00019_slug_lowercase_down.sql

ALTER TABLE public.mpaci_empresas
    DROP CONSTRAINT IF EXISTS mpaci_empresas_slug_lowercase;

ALTER TABLE public.mpaci_empresas
    DROP CONSTRAINT IF EXISTS mpaci_empresas_slug_format;

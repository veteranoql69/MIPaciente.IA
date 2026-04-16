-- Migración: 00009_multi_tenant_fks_down.sql
-- Descripción: Revertir la adición de columnas de empresa y sucursal.

ALTER TABLE public.mpaci_usuarios DROP COLUMN IF EXISTS empresa_id, DROP COLUMN IF EXISTS onboarding_completado;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS empresa_id, DROP COLUMN IF EXISTS canal_contacto, DROP COLUMN IF EXISTS canal_referencia;
ALTER TABLE public.mpaci_servicios DROP COLUMN IF EXISTS empresa_id;
ALTER TABLE public.mpaci_prospectos DROP COLUMN IF EXISTS empresa_id;
ALTER TABLE public.mpaci_citas DROP COLUMN IF EXISTS empresa_id, DROP COLUMN IF EXISTS sucursal_id;

DO $$ BEGIN
    ALTER TABLE public.mpaci_fichas_clinicas DROP COLUMN IF EXISTS empresa_id;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE public.mpaci_bloques_horarios DROP COLUMN IF EXISTS empresa_id, DROP COLUMN IF EXISTS sucursal_id;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

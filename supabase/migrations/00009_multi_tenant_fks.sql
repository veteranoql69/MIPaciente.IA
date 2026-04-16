-- Migración: 00009_multi_tenant_fks.sql
-- Descripción: Agregar columnas de empresa y sucursal a tablas existentes.
-- Objetivo: Vincular todos los datos operativos a una empresa específica.

-- mpaci_usuarios
ALTER TABLE public.mpaci_usuarios
    ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.mpaci_empresas(id),
    ADD COLUMN IF NOT EXISTS onboarding_completado BOOLEAN NOT NULL DEFAULT false;

-- mpaci_contactos
ALTER TABLE public.mpaci_contactos
    ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.mpaci_empresas(id),
    ADD COLUMN IF NOT EXISTS canal_contacto TEXT,
    ADD COLUMN IF NOT EXISTS canal_referencia TEXT;

-- mpaci_servicios
ALTER TABLE public.mpaci_servicios
    ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.mpaci_empresas(id);

-- mpaci_prospectos
ALTER TABLE public.mpaci_prospectos
    ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.mpaci_empresas(id);

-- mpaci_citas
ALTER TABLE public.mpaci_citas
    ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.mpaci_empresas(id),
    ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES public.mpaci_sucursales(id);

-- mpaci_fichas_clinicas (Asumiendo que existe por migraciones previas)
DO $$ BEGIN
    ALTER TABLE public.mpaci_fichas_clinicas ADD COLUMN empresa_id UUID REFERENCES public.mpaci_empresas(id);
EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN duplicate_column THEN NULL;
END $$;

-- mpaci_bloques_horarios (Asumiendo que existe por migraciones previas)
DO $$ BEGIN
    ALTER TABLE public.mpaci_bloques_horarios 
        ADD COLUMN empresa_id UUID REFERENCES public.mpaci_empresas(id),
        ADD COLUMN sucursal_id UUID REFERENCES public.mpaci_sucursales(id);
EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN duplicate_column THEN NULL;
END $$;

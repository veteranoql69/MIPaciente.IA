-- Migración: 00013_servicios_precios.sql
-- Descripción: Creación de la tabla de precios multi-cobertura por servicio.
-- Objetivo: Permitir que un mismo servicio clínico tenga distintos precios según la previsión/cobertura del paciente.

CREATE TABLE IF NOT EXISTS public.mpaci_servicios_precios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servicio_id UUID NOT NULL REFERENCES public.mpaci_servicios(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id) ON DELETE CASCADE,
    cobertura TEXT NOT NULL,    -- 'isapre_particular', 'pad_2026', 'ejercito', 'fonasa', 'otra'
    precio NUMERIC NOT NULL,
    etiqueta TEXT,              -- "PAD 2026", "Ejército" (nombre visible en UI)
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(servicio_id, empresa_id, cobertura)
);

-- Habilitar RLS
ALTER TABLE public.mpaci_servicios_precios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Staff lee precios de su empresa" ON public.mpaci_servicios_precios;
CREATE POLICY "Staff lee precios de su empresa" ON public.mpaci_servicios_precios FOR SELECT
    USING (
        empresa_id IS NOT NULL 
        AND empresa_id = get_my_empresa_id()
    );

DROP POLICY IF EXISTS "Admin gestiona precios de su empresa" ON public.mpaci_servicios_precios;
CREATE POLICY "Admin gestiona precios de su empresa" ON public.mpaci_servicios_precios FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

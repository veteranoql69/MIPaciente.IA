-- Migración: 00008_sucursales.sql
-- Descripción: Creación de la tabla de sucursales para empresas.
-- Objetivo: Soporte para clínicas con múltiples sedes físicas.

CREATE TABLE IF NOT EXISTS public.mpaci_sucursales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,           -- "Sede Principal", "Sede Norte"
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.mpaci_sucursales ENABLE ROW LEVEL SECURITY;

-- Políticas Básicas (Se delegan a 00011_multi_tenant_rls.sql)

-- Migración: 00007_empresas.sql
-- Descripción: Creación de la tabla de empresas para soportar multi-tenancy.
-- Objetivo: Permitir que múltiples clínicas operen en la misma base de datos de forma aislada.

CREATE TABLE IF NOT EXISTS public.mpaci_empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    plan_suscripcion TEXT,          -- nullable: 'starter', 'pro', 'enterprise'
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.mpaci_empresas ENABLE ROW LEVEL SECURITY;

-- Índice para búsquedas rápidas por slug (usado en el routing de Next.js)
CREATE INDEX IF NOT EXISTS idx_mpaci_empresas_slug ON public.mpaci_empresas(slug);

-- Políticas Básicas (Se delegan a 00011_multi_tenant_rls.sql para evitar dependencia circular)
-- La tabla mpaci_usuarios aún no tiene la columna empresa_id en este punto.

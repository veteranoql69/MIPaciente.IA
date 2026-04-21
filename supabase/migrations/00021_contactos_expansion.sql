-- ============================================================
-- Migración: 00021_contactos_expansion.sql
-- Descripción: Expande mpaci_contactos con todas las columnas
--   requeridas por Vista de Contacto Integrada V2.3
-- Módulo: Contactos
-- Sprint: 1
-- Autor: Arquitecto IA
-- ============================================================

-- 1. DATOS PERSONALES
ALTER TABLE public.mpaci_contactos
    ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
    ADD COLUMN IF NOT EXISTS genero TEXT;

COMMENT ON COLUMN public.mpaci_contactos.genero IS
    'Género del contacto. Valores sugeridos: masculino, femenino, otro, no_informa. Libre para flexibilidad.';

-- 2. CONTACTO ADICIONAL
ALTER TABLE public.mpaci_contactos
    ADD COLUMN IF NOT EXISTS direccion TEXT,
    ADD COLUMN IF NOT EXISTS comuna TEXT,
    ADD COLUMN IF NOT EXISTS region TEXT,
    ADD COLUMN IF NOT EXISTS telefono_secundario TEXT,
    ADD COLUMN IF NOT EXISTS email_alternativo TEXT;

-- 3. ADMINISTRATIVO (encabezado fijo del doc V2.3)
ALTER TABLE public.mpaci_contactos
    ADD COLUMN IF NOT EXISTS prevision TEXT,
    ADD COLUMN IF NOT EXISTS plan_convenio TEXT,
    ADD COLUMN IF NOT EXISTS empresa_paciente TEXT;

COMMENT ON COLUMN public.mpaci_contactos.prevision IS
    'Previsión de salud del paciente. Valores sugeridos: fonasa, isapre, particular, ninguna.';
COMMENT ON COLUMN public.mpaci_contactos.empresa_paciente IS
    'Empresa donde trabaja el paciente (no confundir con empresa_id que es la clínica/tenant).';

-- 4. CLÍNICO RÁPIDO (alimenta bloque amarillo de ficha clínica V1.6)
ALTER TABLE public.mpaci_contactos
    ADD COLUMN IF NOT EXISTS peso_kg NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS talla_cm NUMERIC(5,1);

-- 5. EMERGENCIA
ALTER TABLE public.mpaci_contactos
    ADD COLUMN IF NOT EXISTS emergencia_nombre TEXT,
    ADD COLUMN IF NOT EXISTS emergencia_telefono TEXT;

-- 6. META
ALTER TABLE public.mpaci_contactos
    ADD COLUMN IF NOT EXISTS observaciones_internas TEXT,
    ADD COLUMN IF NOT EXISTS campos_personalizados JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.mpaci_contactos.campos_personalizados IS
    'Campos dinámicos definidos por cada empresa/clínica. Schema libre, validado en la app.';

-- 7. TIMESTAMP DE ÚLTIMA ACTUALIZACIÓN (para el historial)
ALTER TABLE public.mpaci_contactos
    ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ DEFAULT now();

-- Trigger para actualizar automáticamente
CREATE OR REPLACE FUNCTION public.fn_contactos_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.actualizado_en = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contactos_updated_at ON public.mpaci_contactos;
CREATE TRIGGER trg_contactos_updated_at
    BEFORE UPDATE ON public.mpaci_contactos
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_contactos_updated_at();

-- 8. ÍNDICES PARA BÚSQUEDAS FRECUENTES
CREATE INDEX IF NOT EXISTS idx_mpaci_contactos_prevision ON public.mpaci_contactos(prevision);
CREATE INDEX IF NOT EXISTS idx_mpaci_contactos_comuna ON public.mpaci_contactos(comuna);
CREATE INDEX IF NOT EXISTS idx_mpaci_contactos_nombre_trgm
    ON public.mpaci_contactos USING gin (nombre gin_trgm_ops);

-- Habilitar extensión para búsqueda fuzzy (si no existe)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMENT ON TABLE public.mpaci_contactos IS
    'Universo completo de personas. Incluye prospectos, pacientes y contactos AI.
     Expandido en migración 00021 según Vista de Contacto Integrada V2.3.';

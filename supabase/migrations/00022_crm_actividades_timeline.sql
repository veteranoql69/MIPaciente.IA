-- ============================================================
-- Migración: 00022_crm_actividades_timeline.sql
-- Descripción: Expande CRM: actividades enriquecidas, campos
--   personalizados en prospectos, y timeline unificado.
-- Módulo: CRM + Vista de Contacto
-- Sprint: 1
-- Autor: Arquitecto IA
-- ============================================================

-- ============================================================
-- 1. EXPANDIR mpaci_actividades
-- ============================================================

-- 1A. Permitir tareas directas al contacto (sin pasar por prospecto)
-- Primero, hacer prospecto_id nullable
ALTER TABLE public.mpaci_actividades
    ALTER COLUMN prospecto_id DROP NOT NULL;

ALTER TABLE public.mpaci_actividades
    ADD COLUMN IF NOT EXISTS contacto_id UUID REFERENCES public.mpaci_contactos(id);

-- 1B. Detalle de tarea enriquecido
ALTER TABLE public.mpaci_actividades
    ADD COLUMN IF NOT EXISTS titulo TEXT,
    ADD COLUMN IF NOT EXISTS prioridad TEXT DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'comercial',
    ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente';

COMMENT ON COLUMN public.mpaci_actividades.prioridad IS
    'Prioridad de la tarea. Valores: baja, normal, alta, urgente.';
COMMENT ON COLUMN public.mpaci_actividades.categoria IS
    'Categoría de la tarea. Valores: comercial, clinica, administrativa.';
COMMENT ON COLUMN public.mpaci_actividades.estado IS
    'Estado de la tarea. Valores: pendiente, en_progreso, completada, cancelada.
     Reemplaza el boolean "completada" legacy.';

-- 1C. Asignación explícita (complementa asignado_a_id existente)
ALTER TABLE public.mpaci_actividades
    ADD COLUMN IF NOT EXISTS asignado_por UUID REFERENCES public.mpaci_usuarios(id),
    ADD COLUMN IF NOT EXISTS es_de_ia BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.mpaci_actividades.es_de_ia IS
    'Indica si la tarea fue creada o asignada por el agente IA.';

-- 1D. Cierre detallado
ALTER TABLE public.mpaci_actividades
    ADD COLUMN IF NOT EXISTS completada_en TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completada_por UUID REFERENCES public.mpaci_usuarios(id);

-- 1E. Backfill: migrar 'completada = true' al nuevo campo 'estado'
UPDATE public.mpaci_actividades
SET estado = 'completada',
    completada_en = creado_en  -- mejor aproximación
WHERE completada = true
  AND estado = 'pendiente';

-- 1F. Backfill: migrar tipo_actividad a titulo si titulo es nulo
UPDATE public.mpaci_actividades
SET titulo = tipo_actividad
WHERE titulo IS NULL AND tipo_actividad IS NOT NULL;

-- 1G. CHECK constraint para valores válidos
ALTER TABLE public.mpaci_actividades
    ADD CONSTRAINT chk_actividades_prioridad
        CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente'));

ALTER TABLE public.mpaci_actividades
    ADD CONSTRAINT chk_actividades_categoria
        CHECK (categoria IN ('comercial', 'clinica', 'administrativa'));

ALTER TABLE public.mpaci_actividades
    ADD CONSTRAINT chk_actividades_estado
        CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada'));

-- 1H. Validar que la tarea tenga al menos un vínculo (contacto o prospecto)
ALTER TABLE public.mpaci_actividades
    ADD CONSTRAINT chk_actividades_vinculo
        CHECK (contacto_id IS NOT NULL OR prospecto_id IS NOT NULL);

-- 1I. Índices
CREATE INDEX IF NOT EXISTS idx_mpaci_actividades_contacto ON public.mpaci_actividades(contacto_id);
CREATE INDEX IF NOT EXISTS idx_mpaci_actividades_estado ON public.mpaci_actividades(estado);
CREATE INDEX IF NOT EXISTS idx_mpaci_actividades_vencimiento ON public.mpaci_actividades(fecha_vencimiento);

-- ============================================================
-- 2. EXPANDIR mpaci_prospectos
-- ============================================================

ALTER TABLE public.mpaci_prospectos
    ADD COLUMN IF NOT EXISTS campos_personalizados JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.mpaci_prospectos.campos_personalizados IS
    'Campos dinámicos por trato. Schema libre definido por la clínica.';

-- ============================================================
-- 3. CREAR mpaci_timeline_eventos (Bitácora Integrada)
-- ============================================================
-- Requisito: TAB 6 de Vista de Contacto Integrada V2.3
-- Timeline unificado por contacto que incluye eventos de TODOS los módulos

CREATE TABLE IF NOT EXISTS public.mpaci_timeline_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    contacto_id UUID NOT NULL REFERENCES public.mpaci_contactos(id),

    -- Origen del evento
    origen TEXT NOT NULL,
    -- Valores: 'crm', 'agenda', 'ficha_clinica', 'whatsapp', 'email', 'ia', 'automatizacion', 'sistema'

    -- Referencia a la entidad que generó el evento (polimórfica)
    referencia_id UUID,
    referencia_tabla TEXT,
    -- Ejemplo: referencia_id = cita_id, referencia_tabla = 'mpaci_citas'

    -- Contenido visible en el timeline
    descripcion TEXT NOT NULL,
    metadata JSONB,
    -- Datos adicionales para renderizado contextual en el frontend

    -- Actor
    usuario_id UUID REFERENCES public.mpaci_usuarios(id),
    es_automatico BOOLEAN DEFAULT false,

    -- Timestamp
    creado_en TIMESTAMPTZ DEFAULT now()
    -- INMUTABLE: sin UPDATE/DELETE por RLS
);

-- Habilitar RLS
ALTER TABLE public.mpaci_timeline_eventos ENABLE ROW LEVEL SECURITY;

-- Políticas: Multi-tenant + solo lectura + insert
CREATE POLICY "Staff ve timeline de su empresa"
    ON public.mpaci_timeline_eventos FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
    );

CREATE POLICY "Staff inserta en timeline de su empresa"
    ON public.mpaci_timeline_eventos FOR INSERT
    WITH CHECK (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
    );

-- INMUTABILIDAD: No se puede editar ni borrar
CREATE POLICY "Timeline es inmutable - no update"
    ON public.mpaci_timeline_eventos FOR UPDATE USING (false);

CREATE POLICY "Timeline es inmutable - no delete"
    ON public.mpaci_timeline_eventos FOR DELETE USING (false);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_timeline_contacto ON public.mpaci_timeline_eventos(contacto_id);
CREATE INDEX IF NOT EXISTS idx_timeline_empresa_fecha ON public.mpaci_timeline_eventos(empresa_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_origen ON public.mpaci_timeline_eventos(origen);

COMMENT ON TABLE public.mpaci_timeline_eventos IS
    'Timeline unificado por contacto. Registra eventos de todos los módulos
     (CRM, Agenda, Ficha Clínica, WhatsApp, Email, IA, Automatizaciones).
     INMUTABLE: no permite UPDATE ni DELETE.';

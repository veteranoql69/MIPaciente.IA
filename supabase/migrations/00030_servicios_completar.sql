-- ============================================================
-- Migración: 00030_servicios_completar.sql
-- Descripción: Completa mpaci_servicios con los campos que
--   exige el doc Agenda V1.7 §3.1 (categoría, roles sugeridos,
--   flag de cirugía para vincular con ficha clínica V1.6 §4.3.1).
-- Módulo: Agenda + Ficha Clínica
-- Sprint: Ola A — Integridad
-- ============================================================

-- ============================================================
-- 1. Categoría del servicio (doc Agenda V1.7 §3.1)
-- ============================================================
ALTER TABLE public.mpaci_servicios
    ADD COLUMN IF NOT EXISTS categoria TEXT;

COMMENT ON COLUMN public.mpaci_servicios.categoria IS
    'Categoría clínica del servicio. Valores sugeridos:
     consulta, evaluacion, procedimiento, cirugia, control, examen, otro.
     Doc Agenda V1.7 §3.1.';

-- ============================================================
-- 2. Flag es_cirugia — permite filtrar cirugías en ficha V1.6 §4.3.1
-- ============================================================
ALTER TABLE public.mpaci_servicios
    ADD COLUMN IF NOT EXISTS es_cirugia BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.mpaci_servicios.es_cirugia IS
    'Marca si el servicio es una cirugía Urbamed. Usado por ficha clínica
     (tab Cirugías §4.3.1) para listar cirugías del paciente a partir de citas.';

-- ============================================================
-- 3. Roles sugeridos por servicio (doc Agenda V1.7 §3.1)
-- ============================================================
-- JSONB para flexibilidad: { "cirujano": 1, "ayudante": 1, "anestesista": 1, "arsenalera": 1 }
ALTER TABLE public.mpaci_servicios
    ADD COLUMN IF NOT EXISTS roles_sugeridos JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.mpaci_servicios.roles_sugeridos IS
    'Roles clínicos sugeridos y cuántos se esperan. Ej: {"cirujano":1,"ayudante":1,"anestesista":1}.
     Informativo: la agenda no valida cumplimiento. Doc Agenda V1.7 §3.1.';

-- ============================================================
-- 4. Índices útiles
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_servicios_categoria ON public.mpaci_servicios(categoria);
CREATE INDEX IF NOT EXISTS idx_servicios_es_cirugia
    ON public.mpaci_servicios(empresa_id) WHERE es_cirugia = true;

-- ============================================================
-- 5. CHECK constraint de categoría
-- ============================================================
ALTER TABLE public.mpaci_servicios
    DROP CONSTRAINT IF EXISTS chk_servicios_categoria;

ALTER TABLE public.mpaci_servicios
    ADD CONSTRAINT chk_servicios_categoria
        CHECK (categoria IS NULL OR categoria IN (
            'consulta', 'evaluacion', 'procedimiento', 'cirugia',
            'control', 'examen', 'otro'
        ));

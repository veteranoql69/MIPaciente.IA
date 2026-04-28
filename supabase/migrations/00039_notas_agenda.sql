-- ============================================================
-- Migración: 00039_notas_agenda.sql
-- Descripción: Notas operativas de agenda (doc V1.7 §17.4 —
--   fila superior fija con notas por día/semana) y tamaño de
--   bloque base configurable por empresa (doc V1.7 §18.1).
-- Módulo: Agenda
-- Sprint: Ola B — Funcionalidad
-- ============================================================

-- ============================================================
-- 1. mpaci_notas_agenda
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpaci_notas_agenda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    sucursal_id UUID REFERENCES public.mpaci_sucursales(id),

    alcance TEXT NOT NULL,
    -- Valores: 'dia', 'semana'
    fecha DATE NOT NULL,
    -- Si alcance=semana, fecha es el lunes de esa semana

    titulo TEXT,
    contenido TEXT NOT NULL,

    creado_por UUID REFERENCES public.mpaci_usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now(),
    actualizado_en TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_notas_alcance CHECK (alcance IN ('dia', 'semana'))
);

ALTER TABLE public.mpaci_notas_agenda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff ve notas agenda de su empresa" ON public.mpaci_notas_agenda;
CREATE POLICY "Staff ve notas agenda de su empresa"
    ON public.mpaci_notas_agenda FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

DROP POLICY IF EXISTS "Staff gestiona notas agenda de su empresa" ON public.mpaci_notas_agenda;
CREATE POLICY "Staff gestiona notas agenda de su empresa"
    ON public.mpaci_notas_agenda FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente')
        )
    );

CREATE INDEX IF NOT EXISTS idx_notas_agenda_sucursal_fecha
    ON public.mpaci_notas_agenda(sucursal_id, fecha);

-- Trigger de actualizado_en
CREATE OR REPLACE FUNCTION public.fn_notas_agenda_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.actualizado_en = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notas_agenda_updated_at ON public.mpaci_notas_agenda;
CREATE TRIGGER trg_notas_agenda_updated_at
    BEFORE UPDATE ON public.mpaci_notas_agenda
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_notas_agenda_updated_at();

COMMENT ON TABLE public.mpaci_notas_agenda IS
    'Notas operativas mostradas en la fila superior fija de la agenda.
     Alcance día o semana. Doc Agenda V1.7 §17.4.';

-- ============================================================
-- 2. Bloque base configurable por empresa (doc V1.7 §18.1)
-- ============================================================
ALTER TABLE public.mpaci_empresas
    ADD COLUMN IF NOT EXISTS bloque_base_min INTEGER DEFAULT 15;

ALTER TABLE public.mpaci_empresas
    DROP CONSTRAINT IF EXISTS chk_empresas_bloque_base;

ALTER TABLE public.mpaci_empresas
    ADD CONSTRAINT chk_empresas_bloque_base
        CHECK (bloque_base_min IN (10, 15, 20));

COMMENT ON COLUMN public.mpaci_empresas.bloque_base_min IS
    'Tamaño del bloque base de la agenda en minutos. Valores: 10, 15, 20.
     Doc Agenda V1.7 §18.1.';

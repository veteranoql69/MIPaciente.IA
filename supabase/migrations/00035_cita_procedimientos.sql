-- ============================================================
-- Migración: 00035_cita_procedimientos.sql
-- Descripción: Soporta procedimientos múltiples por cita
--   (concurrentes o secuenciales) según doc Agenda V1.7 §18.3.
--   Hoy mpaci_citas.servicio_id es 1:1; este cambio introduce
--   una tabla N:M y deprecia (sin romper) el FK directo.
-- Módulo: Agenda
-- Sprint: Ola B — Funcionalidad
-- ============================================================

-- ============================================================
-- 1. Tabla mpaci_cita_procedimientos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpaci_cita_procedimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    cita_id UUID NOT NULL REFERENCES public.mpaci_citas(id) ON DELETE CASCADE,
    servicio_id UUID NOT NULL REFERENCES public.mpaci_servicios(id),

    orden INTEGER NOT NULL DEFAULT 0,
    tipo_ejecucion TEXT NOT NULL DEFAULT 'secuencial',
    -- Valores: 'concurrente', 'secuencial'

    -- Snapshots (mismo principio que mpaci_citas, pero por procedimiento)
    duracion_snapshot_min INTEGER,
    precio_snapshot NUMERIC,
    honorarios_snapshot JSONB,
    cobertura_usada TEXT,

    creado_en TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_cita_proc_tipo
        CHECK (tipo_ejecucion IN ('concurrente', 'secuencial')),
    CONSTRAINT uq_cita_proc_orden
        UNIQUE (cita_id, orden)
);

ALTER TABLE public.mpaci_cita_procedimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff ve procedimientos de su empresa" ON public.mpaci_cita_procedimientos;
DROP POLICY IF EXISTS "Staff gestiona procedimientos de su empresa" ON public.mpaci_cita_procedimientos;
CREATE POLICY "Staff ve procedimientos de su empresa"
    ON public.mpaci_cita_procedimientos FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Staff gestiona procedimientos de su empresa"
    ON public.mpaci_cita_procedimientos FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'medico')
        )
    );

CREATE INDEX IF NOT EXISTS idx_cita_proc_cita ON public.mpaci_cita_procedimientos(cita_id);
CREATE INDEX IF NOT EXISTS idx_cita_proc_servicio ON public.mpaci_cita_procedimientos(servicio_id);

COMMENT ON TABLE public.mpaci_cita_procedimientos IS
    'Procedimientos múltiples (concurrentes o secuenciales) dentro de una cita.
     Reemplaza el uso 1:1 de citas.servicio_id. Doc Agenda V1.7 §18.3.';

-- ============================================================
-- 2. Backfill: migrar citas existentes a tabla N:M
-- ============================================================
INSERT INTO public.mpaci_cita_procedimientos (
    empresa_id, cita_id, servicio_id, orden, tipo_ejecucion,
    duracion_snapshot_min, precio_snapshot, honorarios_snapshot, cobertura_usada
)
SELECT
    c.empresa_id,
    c.id,
    c.servicio_id,
    0,
    'secuencial',
    c.duracion_snapshot_min,
    c.precio_snapshot,
    c.honorarios_snapshot,
    c.cobertura_usada
FROM public.mpaci_citas c
WHERE c.servicio_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.mpaci_cita_procedimientos
    WHERE cita_id = c.id
  );

-- ============================================================
-- 3. Deprecar citas.servicio_id (mantener por compat — no eliminar aún)
-- ============================================================
-- Hacerla nullable: nuevas citas pueden no tener servicio_id directo
-- si se usa solo mpaci_cita_procedimientos
ALTER TABLE public.mpaci_citas
    ALTER COLUMN servicio_id DROP NOT NULL;

COMMENT ON COLUMN public.mpaci_citas.servicio_id IS
    'DEPRECATED desde 00035. Servicio principal de la cita (legacy 1:1).
     Para procedimientos múltiples usar mpaci_cita_procedimientos.
     Se mantiene nullable para backward compatibility y para casos 1:1 simples.';

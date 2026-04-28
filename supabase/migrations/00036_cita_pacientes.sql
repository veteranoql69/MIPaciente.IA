-- ============================================================
-- Migración: 00036_cita_pacientes.sql
-- Descripción: Soporta múltiples pacientes en un mismo horario
--   (doc Agenda V1.7 §19.5). Hoy mpaci_citas.contacto_id es 1:1;
--   este cambio introduce tabla N:M y deprecia el FK directo.
-- Módulo: Agenda
-- Sprint: Ola B — Funcionalidad
-- ============================================================

-- ============================================================
-- 1. Tabla mpaci_cita_pacientes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpaci_cita_pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    cita_id UUID NOT NULL REFERENCES public.mpaci_citas(id) ON DELETE CASCADE,
    contacto_id UUID NOT NULL REFERENCES public.mpaci_contactos(id),

    es_principal BOOLEAN DEFAULT false,
    -- Si es la cita de grupo, uno puede marcarse como principal (quien pagó, etc.)

    -- Estado por paciente (algunos podrían no presentarse aunque la cita sí se realizó)
    estado_asistencia TEXT DEFAULT 'pendiente',
    -- Valores: 'pendiente', 'asistio', 'no_asistio'

    creado_en TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_cita_paciente_asistencia
        CHECK (estado_asistencia IN ('pendiente', 'asistio', 'no_asistio')),
    CONSTRAINT uq_cita_paciente
        UNIQUE (cita_id, contacto_id)
);

ALTER TABLE public.mpaci_cita_pacientes ENABLE ROW LEVEL SECURITY;

-- ELIMINACIÓN DE POLÍTICAS EXISTENTES PARA EVITAR ERRORES (IDEMPOTENCIA)
DROP POLICY IF EXISTS "Staff ve cita_pacientes de su empresa" ON public.mpaci_cita_pacientes;
CREATE POLICY "Staff ve cita_pacientes de su empresa"
    ON public.mpaci_cita_pacientes FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

DROP POLICY IF EXISTS "Staff gestiona cita_pacientes de su empresa" ON public.mpaci_cita_pacientes;
CREATE POLICY "Staff gestiona cita_pacientes de su empresa"
    ON public.mpaci_cita_pacientes FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'medico', 'enfermera_tens')
        )
    );

-- Solo uno puede ser principal por cita
CREATE UNIQUE INDEX IF NOT EXISTS uq_cita_paciente_principal
    ON public.mpaci_cita_pacientes(cita_id) WHERE es_principal = true;

CREATE INDEX IF NOT EXISTS idx_cita_pacientes_cita
    ON public.mpaci_cita_pacientes(cita_id);
CREATE INDEX IF NOT EXISTS idx_cita_pacientes_contacto
    ON public.mpaci_cita_pacientes(contacto_id);

COMMENT ON TABLE public.mpaci_cita_pacientes IS
    'Múltiples pacientes en una misma cita (doc Agenda V1.7 §19.5).
     Reemplaza el uso 1:1 de citas.contacto_id. Cada paciente tiene su
     propio estado_asistencia.';

-- ============================================================
-- 2. Backfill: poblar desde citas existentes
-- ============================================================
INSERT INTO public.mpaci_cita_pacientes (
    empresa_id, cita_id, contacto_id, es_principal, estado_asistencia
)
SELECT
    c.empresa_id,
    c.id,
    c.contacto_id,
    true,
    CASE
        WHEN c.estado_operativo = 'Realizada' THEN 'asistio'
        WHEN c.estado_operativo = 'No asistió' THEN 'no_asistio'
        ELSE 'pendiente'
    END
FROM public.mpaci_citas c
WHERE c.contacto_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.mpaci_cita_pacientes
    WHERE cita_id = c.id AND contacto_id = c.contacto_id
  );

-- ============================================================
-- 3. Deprecar citas.contacto_id
-- ============================================================
ALTER TABLE public.mpaci_citas
    ALTER COLUMN contacto_id DROP NOT NULL;

COMMENT ON COLUMN public.mpaci_citas.contacto_id IS
    'DEPRECATED desde 00036. Paciente principal de la cita (legacy 1:1).
     Para múltiples pacientes usar mpaci_cita_pacientes.
     Se mantiene nullable para backward compatibility y casos 1:1 simples.';

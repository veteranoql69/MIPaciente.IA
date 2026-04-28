-- ============================================================
-- Migración: 00034_horarios_prestador.sql
-- Descripción: Horarios base del prestador (doc Agenda V1.7 §17.3).
--   Permite definir una plantilla semanal recurrente con pausas
--   y excepciones, en lugar de crear bloques puntuales a mano.
-- Módulo: Agenda
-- Sprint: Ola B — Funcionalidad
-- ============================================================

-- ============================================================
-- 1. Horario base semanal (recurrente)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpaci_horarios_prestador (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    medico_id UUID NOT NULL REFERENCES public.mpaci_usuarios(id) ON DELETE CASCADE,
    sucursal_id UUID NOT NULL REFERENCES public.mpaci_sucursales(id),

    dia_semana INTEGER NOT NULL,
    -- 0=domingo, 1=lunes, ..., 6=sábado (ISO: postgres EXTRACT(DOW))
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,

    vigente_desde DATE NOT NULL DEFAULT CURRENT_DATE,
    vigente_hasta DATE,
    -- NULL = indefinido

    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_horarios_dia CHECK (dia_semana BETWEEN 0 AND 6),
    CONSTRAINT chk_horarios_rango CHECK (hora_fin > hora_inicio)
);

ALTER TABLE public.mpaci_horarios_prestador ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff ve horarios de su empresa" ON public.mpaci_horarios_prestador;
DROP POLICY IF EXISTS "Admin gestiona horarios de su empresa" ON public.mpaci_horarios_prestador;
CREATE POLICY "Staff ve horarios de su empresa"
    ON public.mpaci_horarios_prestador FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Admin gestiona horarios de su empresa"
    ON public.mpaci_horarios_prestador FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND (
            EXISTS (SELECT 1 FROM public.mpaci_usuarios
                    WHERE id = auth.uid() AND rol IN ('admin_general', 'admin', 'asistente'))
            OR auth.uid() = medico_id
        )
    );

CREATE INDEX IF NOT EXISTS idx_horarios_medico
    ON public.mpaci_horarios_prestador(medico_id, dia_semana);
CREATE INDEX IF NOT EXISTS idx_horarios_sucursal
    ON public.mpaci_horarios_prestador(sucursal_id);

COMMENT ON TABLE public.mpaci_horarios_prestador IS
    'Plantilla semanal recurrente de horarios del prestador. Genera disponibilidad
     por demanda. Se combina con mpaci_horarios_pausas y mpaci_horarios_excepciones.
     Doc Agenda V1.7 §17.3.';

-- ============================================================
-- 2. Pausas dentro del horario (colación, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpaci_horarios_pausas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    horario_id UUID NOT NULL REFERENCES public.mpaci_horarios_prestador(id) ON DELETE CASCADE,

    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    motivo TEXT,
    -- Ej: 'Colación', 'Descanso clínico'

    CONSTRAINT chk_pausas_rango CHECK (hora_fin > hora_inicio)
);

ALTER TABLE public.mpaci_horarios_pausas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff ve pausas via horario" ON public.mpaci_horarios_pausas;
DROP POLICY IF EXISTS "Admin gestiona pausas via horario" ON public.mpaci_horarios_pausas;
CREATE POLICY "Staff ve pausas via horario"
    ON public.mpaci_horarios_pausas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.mpaci_horarios_prestador h
            WHERE h.id = horario_id
            AND h.empresa_id = get_my_empresa_id()
        )
    );

CREATE POLICY "Admin gestiona pausas via horario"
    ON public.mpaci_horarios_pausas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.mpaci_horarios_prestador h
            WHERE h.id = horario_id
            AND h.empresa_id = get_my_empresa_id()
            AND (
                EXISTS (SELECT 1 FROM public.mpaci_usuarios
                        WHERE id = auth.uid() AND rol IN ('admin_general', 'admin', 'asistente'))
                OR auth.uid() = h.medico_id
            )
        )
    );

COMMENT ON TABLE public.mpaci_horarios_pausas IS
    'Pausas recurrentes dentro del horario base (colación, descansos).
     Doc Agenda V1.7 §17.3.';

-- ============================================================
-- 3. Excepciones puntuales (sobrescriben el horario base en fecha específica)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpaci_horarios_excepciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    medico_id UUID NOT NULL REFERENCES public.mpaci_usuarios(id) ON DELETE CASCADE,

    fecha DATE NOT NULL,
    tipo TEXT NOT NULL,
    -- Valores: 'no_disponible' (cierra el día), 'horario_especial' (cambia horario)

    hora_inicio TIME,
    hora_fin TIME,
    motivo TEXT,

    creado_en TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_excepciones_tipo
        CHECK (tipo IN ('no_disponible', 'horario_especial')),
    CONSTRAINT chk_excepciones_rango
        CHECK (hora_fin IS NULL OR hora_inicio IS NULL OR hora_fin > hora_inicio)
);

ALTER TABLE public.mpaci_horarios_excepciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff ve excepciones de su empresa" ON public.mpaci_horarios_excepciones;
DROP POLICY IF EXISTS "Admin gestiona excepciones de su empresa" ON public.mpaci_horarios_excepciones;
CREATE POLICY "Staff ve excepciones de su empresa"
    ON public.mpaci_horarios_excepciones FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Admin gestiona excepciones de su empresa"
    ON public.mpaci_horarios_excepciones FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND (
            EXISTS (SELECT 1 FROM public.mpaci_usuarios
                    WHERE id = auth.uid() AND rol IN ('admin_general', 'admin', 'asistente'))
            OR auth.uid() = medico_id
        )
    );

CREATE INDEX IF NOT EXISTS idx_excepciones_medico_fecha
    ON public.mpaci_horarios_excepciones(medico_id, fecha);

COMMENT ON TABLE public.mpaci_horarios_excepciones IS
    'Excepciones puntuales al horario base (día cerrado, horario especial).
     Doc Agenda V1.7 §17.3 y §17.5.';

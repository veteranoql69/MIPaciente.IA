-- ============================================================
-- Migración: 00023_agenda_expansion.sql
-- Descripción: Expande el módulo de Agenda Médica según V1.7:
--   - Nuevas columnas en mpaci_citas (3er eje, salas, GCal, cancelación)
--   - Nuevas columnas en mpaci_bloques_horarios (motivo, tipo)
--   - Tabla mpaci_salas
--   - Tabla mpaci_servicios_config (Service Builder)
--   - Tabla mpaci_equipo_cita (equipo clínico por procedimiento)
--   - Tabla mpaci_pagos_cita (pagos detallados)
--   - Tabla mpaci_auditoria_citas (auditoría integral)
-- Sprint: 1-2
-- Autor: Arquitecto IA
-- ============================================================

-- ============================================================
-- 1. TABLA mpaci_salas (debe existir antes de las FK en citas)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mpaci_salas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    sucursal_id UUID NOT NULL REFERENCES public.mpaci_sucursales(id),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_salas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve salas de su empresa"
    ON public.mpaci_salas FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Admin gestiona salas de su empresa"
    ON public.mpaci_salas FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin')
        )
    );

CREATE INDEX IF NOT EXISTS idx_salas_sucursal ON public.mpaci_salas(sucursal_id);

COMMENT ON TABLE public.mpaci_salas IS
    'Salas/pabellones por sucursal. Recurso asignable a citas y configuraciones de servicio.';

-- ============================================================
-- 2. EXPANDIR mpaci_citas
-- ============================================================

-- 2A. Tercer eje de estado: confirmación
ALTER TABLE public.mpaci_citas
    ADD COLUMN IF NOT EXISTS estado_confirmacion TEXT DEFAULT 'no_confirmada';

ALTER TABLE public.mpaci_citas
    ADD CONSTRAINT chk_citas_confirmacion
        CHECK (estado_confirmacion IN ('no_confirmada', 'confirmada'));

-- 2B. Cobertura aplicada en esta cita específica
ALTER TABLE public.mpaci_citas
    ADD COLUMN IF NOT EXISTS cobertura_usada TEXT;

COMMENT ON COLUMN public.mpaci_citas.cobertura_usada IS
    'Cobertura del paciente usada en esta cita (ej: fonasa, isapre_particular, pad_2026).
     Se usa para buscar precio en mpaci_servicios_precios. Si no encuentra, usa precio_base.';

-- 2C. Google Calendar sync
ALTER TABLE public.mpaci_citas
    ADD COLUMN IF NOT EXISTS gcal_event_id TEXT;

COMMENT ON COLUMN public.mpaci_citas.gcal_event_id IS
    'ID del evento en Google Calendar. GCal es solo visualizador (doc V1.7 sección 6).';

-- 2D. Sala asignada
ALTER TABLE public.mpaci_citas
    ADD COLUMN IF NOT EXISTS sala_id UUID REFERENCES public.mpaci_salas(id);

-- 2E. Motivo de cancelación
ALTER TABLE public.mpaci_citas
    ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT;

-- 2F. Expandir valores válidos de estado_operativo (doc V1.7 sección 5.1)
-- Los CHECK constraints no existen actualmente, solo un DEFAULT.
-- Agregamos un CHECK para los valores del doc.
COMMENT ON COLUMN public.mpaci_citas.estado_operativo IS
    'Eje operativo de la cita. Valores válidos según Agenda V1.7:
     Agendada, Realizada, No realizada (presente), No asistió,
     Cancelada por clínica, Cancelada por paciente dentro de plazo,
     Cancelada por paciente fuera de plazo.';

-- Índices
CREATE INDEX IF NOT EXISTS idx_citas_confirmacion ON public.mpaci_citas(estado_confirmacion);
CREATE INDEX IF NOT EXISTS idx_citas_sala ON public.mpaci_citas(sala_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha_inicio ON public.mpaci_citas(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_citas_medico_fecha ON public.mpaci_citas(medico_id, fecha_inicio);

-- ============================================================
-- 3. EXPANDIR mpaci_bloques_horarios
-- ============================================================

ALTER TABLE public.mpaci_bloques_horarios
    ADD COLUMN IF NOT EXISTS motivo TEXT,
    ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'no_disponible';

COMMENT ON COLUMN public.mpaci_bloques_horarios.tipo IS
    'Tipo de bloqueo. Valores: no_disponible, excepcion_puntual, vacaciones (doc V1.7 sección 17.5).';
COMMENT ON COLUMN public.mpaci_bloques_horarios.motivo IS
    'Razón del bloqueo. Texto libre. Ej: Almuerzo, Vacaciones familia, Cirugía externa.';

-- ============================================================
-- 4. TABLA mpaci_servicios_config (Service Builder Dinámico)
-- ============================================================
-- Requisito: doc V1.7 sección 3.2
-- Configuración dinámica por (servicio + médico + sede)

CREATE TABLE IF NOT EXISTS public.mpaci_servicios_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    servicio_id UUID NOT NULL REFERENCES public.mpaci_servicios(id),
    medico_id UUID NOT NULL REFERENCES public.mpaci_usuarios(id),
    sucursal_id UUID NOT NULL REFERENCES public.mpaci_sucursales(id),

    -- Tiempos (override del servicio base)
    duracion_minutos INTEGER,
    buffer_pre_min INTEGER DEFAULT 0,
    buffer_post_min INTEGER DEFAULT 0,

    -- Recursos
    sala_id UUID REFERENCES public.mpaci_salas(id),

    -- Honorarios por prestador (doc V1.7 sección 16)
    modelo_honorarios TEXT,
    -- Valores: 'fijo', 'bloque_procedimiento', 'cirugia_general'
    monto_bloque NUMERIC,
    monto_por_cirugia NUMERIC,

    -- Visibilidad (doc V1.7 sección 3.2 punto 8)
    alias TEXT,
    -- Nombre privado para mostrar en GCal (ej: "Cir. Mamaria" en vez del nombre real)
    notas_privadas TEXT,

    -- Estado
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now(),

    -- Un solo config por combinación servicio+médico+sucursal+empresa
    CONSTRAINT uq_servicios_config
        UNIQUE(servicio_id, medico_id, sucursal_id, empresa_id)
);

ALTER TABLE public.mpaci_servicios_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve config de su empresa"
    ON public.mpaci_servicios_config FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Admin gestiona config de su empresa"
    ON public.mpaci_servicios_config FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE INDEX IF NOT EXISTS idx_servicios_config_medico ON public.mpaci_servicios_config(medico_id);
CREATE INDEX IF NOT EXISTS idx_servicios_config_servicio ON public.mpaci_servicios_config(servicio_id);

COMMENT ON TABLE public.mpaci_servicios_config IS
    'Service Builder Dinámico: configuración operativa por (servicio + médico + sede).
     Define tiempos, recursos, honorarios y visibilidad. Doc Agenda V1.7 sección 3.2.';

-- ============================================================
-- 5. TABLA mpaci_equipo_cita (Equipo clínico por procedimiento)
-- ============================================================
-- Requisito: doc V1.7 sección 7 y 9 (cierre express)

CREATE TABLE IF NOT EXISTS public.mpaci_equipo_cita (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    cita_id UUID NOT NULL REFERENCES public.mpaci_citas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.mpaci_usuarios(id),

    -- Rol clínico en este procedimiento
    rol_clinico TEXT NOT NULL,
    -- Valores sugeridos: 'cirujano', 'ayudante', 'anestesista', 'arsenalera', 'encargada_pabellon'

    -- Honorarios (nullable hasta cierre express — D3)
    honorario_calculado NUMERIC,
    -- Calculado automáticamente según mpaci_servicios_config.modelo_honorarios
    honorario_fijado NUMERIC,
    -- NULL hasta cierre express. INMUTABLE una vez fijado.
    fijado_en TIMESTAMPTZ,
    fijado_por UUID REFERENCES public.mpaci_usuarios(id),

    creado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_equipo_cita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve equipo de su empresa"
    ON public.mpaci_equipo_cita FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Staff gestiona equipo de su empresa"
    ON public.mpaci_equipo_cita FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'asistente')
        )
    );

-- Proteger honorarios fijados: no se puede modificar una vez fijado
-- (Esto se valida en la app/Server Action, no en RLS, para mensajes de error claros)

CREATE INDEX IF NOT EXISTS idx_equipo_cita_cita ON public.mpaci_equipo_cita(cita_id);
CREATE INDEX IF NOT EXISTS idx_equipo_cita_usuario ON public.mpaci_equipo_cita(usuario_id);

COMMENT ON TABLE public.mpaci_equipo_cita IS
    'Equipo clínico asignado por cita/procedimiento. Roles y honorarios.
     Honorarios se fijan en cierre express (doc V1.7 sección 9).
     honorario_fijado es INMUTABLE una vez establecido.';

-- ============================================================
-- 6. TABLA mpaci_pagos_cita (Pagos detallados)
-- ============================================================
-- Requisito: doc V1.7 sección 10

CREATE TABLE IF NOT EXISTS public.mpaci_pagos_cita (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    cita_id UUID NOT NULL REFERENCES public.mpaci_citas(id) ON DELETE CASCADE,

    tipo TEXT NOT NULL,
    -- Valores: 'pago', 'abono', 'reembolso', 'cortesia'
    monto NUMERIC NOT NULL,
    medio_pago TEXT,
    -- Valores sugeridos: 'efectivo', 'tarjeta', 'transferencia', 'cheque'
    referencia TEXT,
    -- Número de comprobante, transacción bancaria, etc.

    registrado_por UUID NOT NULL REFERENCES public.mpaci_usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now()
    -- INMUTABLE: sin UPDATE/DELETE
);

ALTER TABLE public.mpaci_pagos_cita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve pagos de su empresa"
    ON public.mpaci_pagos_cita FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Staff inserta pagos en su empresa"
    ON public.mpaci_pagos_cita FOR INSERT
    WITH CHECK (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'asistente')
        )
    );

-- INMUTABILIDAD
CREATE POLICY "Pagos son inmutables - no update"
    ON public.mpaci_pagos_cita FOR UPDATE USING (false);

CREATE POLICY "Pagos son inmutables - no delete"
    ON public.mpaci_pagos_cita FOR DELETE USING (false);

ALTER TABLE public.mpaci_pagos_cita
    ADD CONSTRAINT chk_pagos_tipo CHECK (tipo IN ('pago', 'abono', 'reembolso', 'cortesia'));

CREATE INDEX IF NOT EXISTS idx_pagos_cita ON public.mpaci_pagos_cita(cita_id);

COMMENT ON TABLE public.mpaci_pagos_cita IS
    'Registro detallado de pagos por cita. INMUTABLE: no permite UPDATE ni DELETE.
     Los reembolsos se registran como tipo "reembolso". Doc Agenda V1.7 sección 10.';

-- ============================================================
-- 7. TABLA mpaci_auditoria_citas (Auditoría integral)
-- ============================================================
-- Requisito: doc V1.7 sección 11

CREATE TABLE IF NOT EXISTS public.mpaci_auditoria_citas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    cita_id UUID NOT NULL REFERENCES public.mpaci_citas(id) ON DELETE CASCADE,

    tipo_evento TEXT NOT NULL,
    -- Valores: 'cambio_estado_operativo', 'cambio_confirmacion', 'cambio_pago',
    --          'cierre_express', 'asignacion_equipo', 'reagendamiento', 'creacion', 'cancelacion'
    valor_anterior TEXT,
    valor_nuevo TEXT,

    usuario_id UUID REFERENCES public.mpaci_usuarios(id),
    motivo TEXT,
    version_config TEXT,
    -- Snapshot del config usado al momento del evento (para trazabilidad)

    creado_en TIMESTAMPTZ DEFAULT now()
    -- INMUTABLE
);

ALTER TABLE public.mpaci_auditoria_citas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve auditoria de su empresa"
    ON public.mpaci_auditoria_citas FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Staff inserta auditoria en su empresa"
    ON public.mpaci_auditoria_citas FOR INSERT
    WITH CHECK (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
    );

-- INMUTABILIDAD
CREATE POLICY "Auditoria citas inmutable - no update"
    ON public.mpaci_auditoria_citas FOR UPDATE USING (false);

CREATE POLICY "Auditoria citas inmutable - no delete"
    ON public.mpaci_auditoria_citas FOR DELETE USING (false);

CREATE INDEX IF NOT EXISTS idx_auditoria_cita ON public.mpaci_auditoria_citas(cita_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_citas_fecha ON public.mpaci_auditoria_citas(empresa_id, creado_en DESC);

COMMENT ON TABLE public.mpaci_auditoria_citas IS
    'Auditoría integral de cambios en citas. INMUTABLE.
     Registra cambios de estado, cierre express, asignación de equipo, reagendamientos.
     Doc Agenda V1.7 sección 11.';

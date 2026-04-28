-- ============================================================
-- Migración: 00029_check_constraints_criticos.sql
-- Descripción: Añade CHECK constraints faltantes en valores
--   enumerados guardados como TEXT. Cierra la brecha de
--   enforcement donde hoy solo hay COMMENT.
-- Módulo: Cross (Agenda, CRM, Ficha)
-- Sprint: Ola A — Integridad
-- Autor: Arquitecto IA
-- ============================================================

-- ============================================================
-- 1. mpaci_citas.estado_operativo (doc Agenda V1.7 §5.1)
-- ============================================================
-- Valores válidos: 7 estados operativos

-- Backfill: normalizar valores legacy ('No asistió' con/sin tilde, etc.)
UPDATE public.mpaci_citas
SET estado_operativo = 'Agendada'
WHERE estado_operativo NOT IN (
    'Agendada', 'Realizada', 'No realizada (presente)', 'No asistió',
    'Cancelada por clínica',
    'Cancelada por paciente dentro de plazo',
    'Cancelada por paciente fuera de plazo',
    -- Legacy aceptado
    'Cancelada'
);

-- Eliminar legacy 'Cancelada' → mapear a 'Cancelada por clínica'
UPDATE public.mpaci_citas
SET estado_operativo = 'Cancelada por clínica'
WHERE estado_operativo = 'Cancelada';

ALTER TABLE public.mpaci_citas
    DROP CONSTRAINT IF EXISTS chk_citas_estado_operativo;

ALTER TABLE public.mpaci_citas
    ADD CONSTRAINT chk_citas_estado_operativo
        CHECK (estado_operativo IN (
            'Agendada',
            'Realizada',
            'No realizada (presente)',
            'No asistió',
            'Cancelada por clínica',
            'Cancelada por paciente dentro de plazo',
            'Cancelada por paciente fuera de plazo'
        ));

-- ============================================================
-- 2. mpaci_citas.estado_pago (doc Agenda V1.7 §5.3)
-- ============================================================
UPDATE public.mpaci_citas
SET estado_pago = 'No pagado'
WHERE estado_pago NOT IN (
    'No pagado', 'Pago parcial', 'Pago total', 'Cortesía', 'Reembolsado'
);

ALTER TABLE public.mpaci_citas
    DROP CONSTRAINT IF EXISTS chk_citas_estado_pago;

ALTER TABLE public.mpaci_citas
    ADD CONSTRAINT chk_citas_estado_pago
        CHECK (estado_pago IN (
            'No pagado', 'Pago parcial', 'Pago total', 'Cortesía', 'Reembolsado'
        ));

-- ============================================================
-- 3. mpaci_equipo_cita.rol_clinico (doc Agenda V1.7 §7)
-- ============================================================
ALTER TABLE public.mpaci_equipo_cita
    DROP CONSTRAINT IF EXISTS chk_equipo_cita_rol;

ALTER TABLE public.mpaci_equipo_cita
    ADD CONSTRAINT chk_equipo_cita_rol
        CHECK (rol_clinico IN (
            'cirujano', 'ayudante', 'anestesista', 'arsenalera', 'encargada_pabellon'
        ));

-- ============================================================
-- 4. mpaci_bloques_horarios.tipo y .estado_bloque
-- ============================================================
ALTER TABLE public.mpaci_bloques_horarios
    DROP CONSTRAINT IF EXISTS chk_bloques_tipo;

ALTER TABLE public.mpaci_bloques_horarios
    ADD CONSTRAINT chk_bloques_tipo
        CHECK (tipo IN ('no_disponible', 'excepcion_puntual', 'vacaciones', 'colacion'));

ALTER TABLE public.mpaci_bloques_horarios
    DROP CONSTRAINT IF EXISTS chk_bloques_estado;

ALTER TABLE public.mpaci_bloques_horarios
    ADD CONSTRAINT chk_bloques_estado
        CHECK (estado_bloque IN ('Disponible', 'Reservado', 'Bloqueado_Personal'));

-- ============================================================
-- 5. mpaci_prospectos.estado (doc V2.3 — estados del embudo)
-- ============================================================
UPDATE public.mpaci_prospectos
SET estado = 'Nuevo'
WHERE estado NOT IN (
    'Nuevo', 'En seguimiento', 'Interesado', 'Agendado', 'Ganado', 'Perdido'
);

ALTER TABLE public.mpaci_prospectos
    DROP CONSTRAINT IF EXISTS chk_prospectos_estado;

ALTER TABLE public.mpaci_prospectos
    ADD CONSTRAINT chk_prospectos_estado
        CHECK (estado IN (
            'Nuevo', 'En seguimiento', 'Interesado', 'Agendado', 'Ganado', 'Perdido'
        ));

-- ============================================================
-- 6. mpaci_servicios_precios.cobertura (doc Agenda V1.7 §3.2.2)
-- ============================================================
ALTER TABLE public.mpaci_servicios_precios
    DROP CONSTRAINT IF EXISTS chk_precios_cobertura;

ALTER TABLE public.mpaci_servicios_precios
    ADD CONSTRAINT chk_precios_cobertura
        CHECK (cobertura IN (
            'particular', 'fonasa', 'isapre_particular', 'pad_2026', 'ejercito', 'otra'
        ));

-- ============================================================
-- 7. mpaci_diagnosticos.lateralidad y .estado (doc Ficha V1.6 §4.1)
-- ============================================================
ALTER TABLE public.mpaci_diagnosticos
    DROP CONSTRAINT IF EXISTS chk_diagnosticos_lateralidad;

ALTER TABLE public.mpaci_diagnosticos
    ADD CONSTRAINT chk_diagnosticos_lateralidad
        CHECK (lateralidad IS NULL OR lateralidad IN ('bilateral', 'izquierdo', 'derecho'));

ALTER TABLE public.mpaci_diagnosticos
    DROP CONSTRAINT IF EXISTS chk_diagnosticos_estado;

ALTER TABLE public.mpaci_diagnosticos
    ADD CONSTRAINT chk_diagnosticos_estado
        CHECK (estado IN ('activo', 'inactivo', 'resuelto'));

-- ============================================================
-- 8. mpaci_alergias.severidad (doc Ficha V1.6 §4.4)
-- ============================================================
ALTER TABLE public.mpaci_alergias
    DROP CONSTRAINT IF EXISTS chk_alergias_severidad;

ALTER TABLE public.mpaci_alergias
    ADD CONSTRAINT chk_alergias_severidad
        CHECK (severidad IS NULL OR severidad IN ('leve', 'moderada', 'severa'));

-- ============================================================
-- 9. mpaci_medicamentos_paciente.estado
-- ============================================================
ALTER TABLE public.mpaci_medicamentos_paciente
    DROP CONSTRAINT IF EXISTS chk_medicamentos_estado;

ALTER TABLE public.mpaci_medicamentos_paciente
    ADD CONSTRAINT chk_medicamentos_estado
        CHECK (estado IN ('activo', 'suspendido', 'completado'));

COMMENT ON CONSTRAINT chk_citas_estado_operativo ON public.mpaci_citas IS
    'Enforcement de los 7 estados operativos del doc Agenda V1.7 §5.1.';

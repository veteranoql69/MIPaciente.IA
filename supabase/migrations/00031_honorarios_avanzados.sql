-- ============================================================
-- Migración: 00031_honorarios_avanzados.sql
-- Descripción: Completa mpaci_servicios_config con los campos
--   de honorarios que exige el doc Agenda V1.7 §8 y §16:
--   - unidad (caso/bloque/hora)
--   - pct_no_realizada
--   - fee_cancelacion_tardia
--   - honorarios_por_rol (JSONB granular)
--   - modo_bloque, monto_por_cirugia_general
--   - CHECK de modelo_honorarios
-- Módulo: Agenda — Honorarios
-- Sprint: Ola A — Integridad
-- ============================================================

-- ============================================================
-- 1. Unidad del honorario (doc §8: caso/bloque/hora)
-- ============================================================
ALTER TABLE public.mpaci_servicios_config
    ADD COLUMN IF NOT EXISTS unidad_honorario TEXT DEFAULT 'caso';

COMMENT ON COLUMN public.mpaci_servicios_config.unidad_honorario IS
    'Unidad de cálculo del honorario. Valores: caso, bloque, hora.
     Doc Agenda V1.7 §8.';

-- ============================================================
-- 2. Modo bloque (doc §16.2): cómo se genera el honorario por bloque
-- ============================================================
ALTER TABLE public.mpaci_servicios_config
    ADD COLUMN IF NOT EXISTS modo_bloque TEXT;

COMMENT ON COLUMN public.mpaci_servicios_config.modo_bloque IS
    'Cómo se genera el honorario de bloque. Valores:
     automatico (se genera solo), confirmacion (requiere validar).
     Doc Agenda V1.7 §16.3.';

-- ============================================================
-- 3. Monto por cirugía general (doc §16.1.c)
-- ============================================================
-- El modelo "cirugía general + rol adicional" tiene un componente fijo
-- por cirugía (distinto de monto_por_cirugia que podía confundirse)
ALTER TABLE public.mpaci_servicios_config
    ADD COLUMN IF NOT EXISTS monto_por_cirugia_general NUMERIC;

COMMENT ON COLUMN public.mpaci_servicios_config.monto_por_cirugia_general IS
    'Monto fijo por participar como cirujano general, independiente del servicio.
     Se suma al honorario_por_rol. Doc Agenda V1.7 §16.1.c.';

-- ============================================================
-- 4. Honorarios por rol (JSONB granular)
-- ============================================================
-- Estructura: { "cirujano": 250000, "ayudante": 50000, "anestesista": 120000, "arsenalera": 35000 }
ALTER TABLE public.mpaci_servicios_config
    ADD COLUMN IF NOT EXISTS honorarios_por_rol JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.mpaci_servicios_config.honorarios_por_rol IS
    'Honorario por rol clínico en este servicio. Ej: {"cirujano":250000,"ayudante":50000}.
     Doc Agenda V1.7 §16.';

-- ============================================================
-- 5. Porcentaje sobre "No realizada (presente)" y fee cancelación tardía
-- ============================================================
ALTER TABLE public.mpaci_servicios_config
    ADD COLUMN IF NOT EXISTS pct_no_realizada NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.mpaci_servicios_config.pct_no_realizada IS
    'Porcentaje del honorario que se paga si la cita queda en estado
     "No realizada (presente)". Valor entre 0 y 100. Doc Agenda V1.7 §8.';

ALTER TABLE public.mpaci_servicios_config
    ADD COLUMN IF NOT EXISTS fee_cancelacion_tardia NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.mpaci_servicios_config.fee_cancelacion_tardia IS
    'Monto fijo por cancelación tardía del paciente (fuera de plazo).
     Doc Agenda V1.7 §8.';

-- ============================================================
-- 6. CHECK constraints
-- ============================================================
ALTER TABLE public.mpaci_servicios_config
    DROP CONSTRAINT IF EXISTS chk_servicios_config_modelo;

ALTER TABLE public.mpaci_servicios_config
    ADD CONSTRAINT chk_servicios_config_modelo
        CHECK (modelo_honorarios IS NULL OR modelo_honorarios IN (
            'fijo', 'bloque_procedimiento', 'cirugia_general'
        ));

ALTER TABLE public.mpaci_servicios_config
    DROP CONSTRAINT IF EXISTS chk_servicios_config_unidad;

ALTER TABLE public.mpaci_servicios_config
    ADD CONSTRAINT chk_servicios_config_unidad
        CHECK (unidad_honorario IN ('caso', 'bloque', 'hora'));

ALTER TABLE public.mpaci_servicios_config
    DROP CONSTRAINT IF EXISTS chk_servicios_config_modo_bloque;

ALTER TABLE public.mpaci_servicios_config
    ADD CONSTRAINT chk_servicios_config_modo_bloque
        CHECK (modo_bloque IS NULL OR modo_bloque IN ('automatico', 'confirmacion'));

ALTER TABLE public.mpaci_servicios_config
    DROP CONSTRAINT IF EXISTS chk_servicios_config_pct_no_realizada;

ALTER TABLE public.mpaci_servicios_config
    ADD CONSTRAINT chk_servicios_config_pct_no_realizada
        CHECK (pct_no_realizada >= 0 AND pct_no_realizada <= 100);

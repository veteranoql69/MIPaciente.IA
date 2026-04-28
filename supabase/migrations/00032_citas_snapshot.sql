-- ============================================================
-- Migración: 00032_citas_snapshot.sql
-- Descripción: Implementa la inmutabilidad histórica exigida
--   por el doc Agenda V1.7 §3.3 ("citas históricas mantienen
--   su versión"). Congela precio, duración y snapshot de config
--   al momento de crear la cita. Sin esto, cambiar un precio
--   en el catálogo altera registros históricos.
-- Módulo: Agenda
-- Sprint: Ola A — Integridad
-- ============================================================

-- ============================================================
-- 1. Campos de snapshot en mpaci_citas
-- ============================================================
ALTER TABLE public.mpaci_citas
    ADD COLUMN IF NOT EXISTS precio_snapshot NUMERIC,
    ADD COLUMN IF NOT EXISTS duracion_snapshot_min INTEGER,
    ADD COLUMN IF NOT EXISTS config_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS honorarios_snapshot JSONB;

COMMENT ON COLUMN public.mpaci_citas.precio_snapshot IS
    'Precio efectivo congelado al crear la cita (según servicios_precios + cobertura).
     NUNCA se actualiza. Si cambia el catálogo, esta cita mantiene su precio histórico.';
COMMENT ON COLUMN public.mpaci_citas.duracion_snapshot_min IS
    'Duración en minutos congelada al crear la cita (servicios_config override
     o servicios.duracion_minutos base).';
COMMENT ON COLUMN public.mpaci_citas.config_snapshot IS
    'Snapshot del servicios_config vigente al crear la cita (buffers, sala, alias).
     Inmutable. Doc Agenda V1.7 §3.3 y §11.';
COMMENT ON COLUMN public.mpaci_citas.honorarios_snapshot IS
    'Snapshot de honorarios_por_rol + modelo + unidad al crear la cita.
     Base para cálculo en cierre express. Inmutable.';

-- ============================================================
-- 2. Backfill para citas existentes
-- ============================================================
-- Rellenar precio_snapshot con precio_base si está nulo
UPDATE public.mpaci_citas
SET precio_snapshot = COALESCE(precio_base, 0)
WHERE precio_snapshot IS NULL;

-- Rellenar duración desde fecha_fin - fecha_inicio (fallback)
UPDATE public.mpaci_citas
SET duracion_snapshot_min = GREATEST(
    EXTRACT(EPOCH FROM (fecha_fin - fecha_inicio))::INTEGER / 60,
    1
)
WHERE duracion_snapshot_min IS NULL;

-- ============================================================
-- 3. Trigger: auto-poblar snapshot al INSERT si falta
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_citas_autofill_snapshot()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_precio NUMERIC;
    v_duracion INTEGER;
    v_config JSONB;
BEGIN
    -- Precio: buscar en servicios_precios por cobertura, fallback a servicios.precio_base
    IF NEW.precio_snapshot IS NULL THEN
        IF NEW.cobertura_usada IS NOT NULL THEN
            SELECT precio INTO v_precio
            FROM public.mpaci_servicios_precios
            WHERE servicio_id = NEW.servicio_id
              AND cobertura = NEW.cobertura_usada
              AND activo = true
            LIMIT 1;
        END IF;

        IF v_precio IS NULL THEN
            SELECT precio_base INTO v_precio
            FROM public.mpaci_servicios
            WHERE id = NEW.servicio_id;
        END IF;

        NEW.precio_snapshot := COALESCE(v_precio, NEW.precio_base, 0);
    END IF;

    -- Duración: desde servicios_config override, fallback a servicios
    IF NEW.duracion_snapshot_min IS NULL THEN
        SELECT duracion_minutos INTO v_duracion
        FROM public.mpaci_servicios_config
        WHERE servicio_id = NEW.servicio_id
          AND medico_id = NEW.medico_id
          AND activo = true
        LIMIT 1;

        IF v_duracion IS NULL THEN
            SELECT duracion_minutos INTO v_duracion
            FROM public.mpaci_servicios
            WHERE id = NEW.servicio_id;
        END IF;

        NEW.duracion_snapshot_min := COALESCE(
            v_duracion,
            (EXTRACT(EPOCH FROM (NEW.fecha_fin - NEW.fecha_inicio))::INTEGER / 60),
            30
        );
    END IF;

    -- Config snapshot: guardar referencia al config vigente
    IF NEW.config_snapshot IS NULL THEN
        SELECT to_jsonb(sc.*) INTO v_config
        FROM public.mpaci_servicios_config sc
        WHERE sc.servicio_id = NEW.servicio_id
          AND sc.medico_id = NEW.medico_id
          AND sc.activo = true
        LIMIT 1;

        NEW.config_snapshot := v_config;
        NEW.honorarios_snapshot := v_config -> 'honorarios_por_rol';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_citas_autofill_snapshot ON public.mpaci_citas;
CREATE TRIGGER trg_citas_autofill_snapshot
    BEFORE INSERT ON public.mpaci_citas
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_citas_autofill_snapshot();

-- ============================================================
-- 4. Trigger: bloquear UPDATE de campos snapshot
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_citas_proteger_snapshot()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.precio_snapshot IS DISTINCT FROM NEW.precio_snapshot THEN
        RAISE EXCEPTION 'precio_snapshot es inmutable (doc Agenda V1.7 §3.3)';
    END IF;
    IF OLD.duracion_snapshot_min IS DISTINCT FROM NEW.duracion_snapshot_min THEN
        RAISE EXCEPTION 'duracion_snapshot_min es inmutable (doc Agenda V1.7 §3.3)';
    END IF;
    IF OLD.config_snapshot IS DISTINCT FROM NEW.config_snapshot THEN
        RAISE EXCEPTION 'config_snapshot es inmutable (doc Agenda V1.7 §3.3)';
    END IF;
    IF OLD.honorarios_snapshot IS DISTINCT FROM NEW.honorarios_snapshot THEN
        RAISE EXCEPTION 'honorarios_snapshot es inmutable (doc Agenda V1.7 §3.3)';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_citas_proteger_snapshot ON public.mpaci_citas;
CREATE TRIGGER trg_citas_proteger_snapshot
    BEFORE UPDATE ON public.mpaci_citas
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_citas_proteger_snapshot();

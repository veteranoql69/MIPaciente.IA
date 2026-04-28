-- ============================================================
-- Migración: 00033_inmutabilidad_honorarios_trigger.sql
-- Descripción: Enforza en DB la inmutabilidad de honorario_fijado
--   en mpaci_equipo_cita. Hoy la regla solo está comentada en
--   00023 y delegada a Server Actions. Ola A cierra el gap.
-- Módulo: Agenda — Honorarios
-- Sprint: Ola A — Integridad
-- Referencia: doc Agenda V1.7 §8, §9 (cierre express), §11 (auditoría)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_equipo_cita_proteger_honorario()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Si ya había un honorario fijado, no se puede modificar
    IF OLD.honorario_fijado IS NOT NULL
       AND OLD.honorario_fijado IS DISTINCT FROM NEW.honorario_fijado THEN
        RAISE EXCEPTION
            'honorario_fijado es inmutable una vez establecido (doc Agenda V1.7 §8). '
            'Para correcciones, registrar una nueva auditoría y crear un pago de ajuste.';
    END IF;

    -- Fijado_en y fijado_por también son inmutables una vez set
    IF OLD.fijado_en IS NOT NULL
       AND OLD.fijado_en IS DISTINCT FROM NEW.fijado_en THEN
        RAISE EXCEPTION 'fijado_en es inmutable una vez establecido';
    END IF;

    IF OLD.fijado_por IS NOT NULL
       AND OLD.fijado_por IS DISTINCT FROM NEW.fijado_por THEN
        RAISE EXCEPTION 'fijado_por es inmutable una vez establecido';
    END IF;

    -- Al fijar honorario, debe haber snapshot de quién y cuándo
    IF NEW.honorario_fijado IS NOT NULL AND OLD.honorario_fijado IS NULL THEN
        IF NEW.fijado_en IS NULL THEN
            NEW.fijado_en := now();
        END IF;
        IF NEW.fijado_por IS NULL THEN
            NEW.fijado_por := auth.uid();
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_equipo_cita_proteger_honorario ON public.mpaci_equipo_cita;
CREATE TRIGGER trg_equipo_cita_proteger_honorario
    BEFORE UPDATE ON public.mpaci_equipo_cita
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_equipo_cita_proteger_honorario();

COMMENT ON FUNCTION public.fn_equipo_cita_proteger_honorario() IS
    'Enforza inmutabilidad de honorario_fijado en equipo_cita.
     Una vez fijado (cierre express), no se puede modificar. Doc Agenda V1.7 §8.';

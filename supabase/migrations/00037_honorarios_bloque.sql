-- ============================================================
-- Migración: 00037_honorarios_bloque.sql
-- Descripción: Honorarios por bloque (doc Agenda V1.7 §16.3).
--   Un honorario por día/bloque/prestador, independiente de
--   los honorarios por procedimiento. Puede ser automático o
--   requerir confirmación (según servicios_config.modo_bloque).
-- Módulo: Agenda — Honorarios
-- Sprint: Ola B — Funcionalidad
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mpaci_honorarios_bloque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    medico_id UUID NOT NULL REFERENCES public.mpaci_usuarios(id),
    sucursal_id UUID REFERENCES public.mpaci_sucursales(id),

    fecha DATE NOT NULL,
    bloque_rango TSTZRANGE NOT NULL,
    -- Rango exacto del bloque pagado

    monto NUMERIC NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente_confirmacion',
    -- Valores: 'auto' (generado automático), 'pendiente_confirmacion',
    --          'confirmado', 'rechazado'

    confirmado_en TIMESTAMPTZ,
    confirmado_por UUID REFERENCES public.mpaci_usuarios(id),

    -- Trazabilidad del cálculo
    config_snapshot JSONB,
    -- Snapshot de servicios_config al momento de generar el honorario

    creado_en TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_honorarios_bloque_estado
        CHECK (estado IN ('auto', 'pendiente_confirmacion', 'confirmado', 'rechazado')),
    CONSTRAINT chk_honorarios_bloque_monto
        CHECK (monto >= 0),
    -- Un solo honorario de bloque por médico + día + rango
    CONSTRAINT uq_honorarios_bloque
        EXCLUDE USING gist (
            medico_id WITH =,
            bloque_rango WITH &&
        )
);

ALTER TABLE public.mpaci_honorarios_bloque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff ve honorarios bloque de su empresa" ON public.mpaci_honorarios_bloque;
CREATE POLICY "Staff ve honorarios bloque de su empresa"
    ON public.mpaci_honorarios_bloque FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND (
            auth.uid() = medico_id
            OR EXISTS (SELECT 1 FROM public.mpaci_usuarios
                       WHERE id = auth.uid()
                       AND rol IN ('admin_general', 'admin', 'asistente'))
        )
    );

DROP POLICY IF EXISTS "Admin inserta honorarios bloque" ON public.mpaci_honorarios_bloque;
CREATE POLICY "Admin inserta honorarios bloque"
    ON public.mpaci_honorarios_bloque FOR INSERT
    WITH CHECK (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'sistema')
        )
    );

-- Solo admin puede confirmar/rechazar
DROP POLICY IF EXISTS "Admin confirma honorarios bloque" ON public.mpaci_honorarios_bloque;
CREATE POLICY "Admin confirma honorarios bloque"
    ON public.mpaci_honorarios_bloque FOR UPDATE
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin')
        )
    );

-- Inmutable una vez confirmado: trigger
CREATE OR REPLACE FUNCTION public.fn_honorarios_bloque_lock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.estado = 'confirmado' AND NEW.estado != 'confirmado' THEN
        RAISE EXCEPTION 'Honorario de bloque confirmado es inmutable (doc Agenda V1.7 §8)';
    END IF;
    IF OLD.estado = 'confirmado' AND OLD.monto IS DISTINCT FROM NEW.monto THEN
        RAISE EXCEPTION 'Monto de honorario confirmado es inmutable';
    END IF;
    IF NEW.estado = 'confirmado' AND OLD.estado != 'confirmado' THEN
        NEW.confirmado_en := COALESCE(NEW.confirmado_en, now());
        NEW.confirmado_por := COALESCE(NEW.confirmado_por, auth.uid());
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_honorarios_bloque_lock ON public.mpaci_honorarios_bloque;
CREATE TRIGGER trg_honorarios_bloque_lock
    BEFORE UPDATE ON public.mpaci_honorarios_bloque
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_honorarios_bloque_lock();

CREATE INDEX IF NOT EXISTS idx_honorarios_bloque_medico_fecha
    ON public.mpaci_honorarios_bloque(medico_id, fecha);
CREATE INDEX IF NOT EXISTS idx_honorarios_bloque_estado
    ON public.mpaci_honorarios_bloque(empresa_id, estado);

COMMENT ON TABLE public.mpaci_honorarios_bloque IS
    'Honorario por día/bloque del prestador (independiente de procedimientos).
     Doc Agenda V1.7 §16.3. Uno por médico + rango (EXCLUDE constraint).';

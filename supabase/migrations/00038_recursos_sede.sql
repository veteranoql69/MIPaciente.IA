-- ============================================================
-- Migración: 00038_recursos_sede.sql
-- Descripción: Insumos y equipamiento por sede (doc Agenda V1.7 §4).
--   Permite que un servicios_config declare qué recursos
--   materiales requiere un procedimiento, además de la sala.
-- Módulo: Agenda — Recursos
-- Sprint: Ola B — Funcionalidad
-- ============================================================

-- ============================================================
-- 1. Insumos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpaci_insumos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    sucursal_id UUID REFERENCES public.mpaci_sucursales(id),

    nombre TEXT NOT NULL,
    sku TEXT,
    unidad TEXT DEFAULT 'unidad',
    -- 'unidad', 'caja', 'ml', 'mg', etc.
    stock_actual NUMERIC DEFAULT 0,
    stock_minimo NUMERIC DEFAULT 0,

    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_insumos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff ve insumos de su empresa" ON public.mpaci_insumos;
CREATE POLICY "Staff ve insumos de su empresa"
    ON public.mpaci_insumos FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

DROP POLICY IF EXISTS "Admin gestiona insumos de su empresa" ON public.mpaci_insumos;
CREATE POLICY "Admin gestiona insumos de su empresa"
    ON public.mpaci_insumos FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente')
        )
    );

CREATE INDEX IF NOT EXISTS idx_insumos_sucursal
    ON public.mpaci_insumos(sucursal_id);

COMMENT ON TABLE public.mpaci_insumos IS
    'Insumos clínicos con stock por sucursal. Doc Agenda V1.7 §4.';

-- ============================================================
-- 2. Equipamiento (equipos reutilizables)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpaci_equipamiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    sucursal_id UUID REFERENCES public.mpaci_sucursales(id),

    nombre TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_equipamiento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff ve equipamiento de su empresa" ON public.mpaci_equipamiento;
CREATE POLICY "Staff ve equipamiento de su empresa"
    ON public.mpaci_equipamiento FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

DROP POLICY IF EXISTS "Admin gestiona equipamiento de su empresa" ON public.mpaci_equipamiento;
CREATE POLICY "Admin gestiona equipamiento de su empresa"
    ON public.mpaci_equipamiento FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente')
        )
    );

COMMENT ON TABLE public.mpaci_equipamiento IS
    'Equipamiento clínico reutilizable (distinto de insumos consumibles).
     Doc Agenda V1.7 §4.';

-- ============================================================
-- 3. N:M servicios_config ↔ recursos (insumos/equipos requeridos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpaci_servicios_config_recursos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servicios_config_id UUID NOT NULL REFERENCES public.mpaci_servicios_config(id) ON DELETE CASCADE,

    tipo_recurso TEXT NOT NULL,
    -- Valores: 'insumo', 'equipamiento'
    recurso_id UUID NOT NULL,
    -- FK polimórfica: referencia a mpaci_insumos.id o mpaci_equipamiento.id

    cantidad NUMERIC DEFAULT 1,

    CONSTRAINT chk_config_recursos_tipo
        CHECK (tipo_recurso IN ('insumo', 'equipamiento')),
    CONSTRAINT uq_config_recurso
        UNIQUE (servicios_config_id, tipo_recurso, recurso_id)
);

ALTER TABLE public.mpaci_servicios_config_recursos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff ve config_recursos via config" ON public.mpaci_servicios_config_recursos;
CREATE POLICY "Staff ve config_recursos via config"
    ON public.mpaci_servicios_config_recursos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.mpaci_servicios_config sc
            WHERE sc.id = servicios_config_id
            AND sc.empresa_id = get_my_empresa_id()
        )
    );

DROP POLICY IF EXISTS "Admin gestiona config_recursos via config" ON public.mpaci_servicios_config_recursos;
CREATE POLICY "Admin gestiona config_recursos via config"
    ON public.mpaci_servicios_config_recursos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.mpaci_servicios_config sc
            WHERE sc.id = servicios_config_id
            AND sc.empresa_id = get_my_empresa_id()
            AND EXISTS (
                SELECT 1 FROM public.mpaci_usuarios
                WHERE id = auth.uid()
                AND rol IN ('admin_general', 'admin')
            )
        )
    );

COMMENT ON TABLE public.mpaci_servicios_config_recursos IS
    'Recursos materiales requeridos por una configuración de servicio
     (insumos consumibles o equipamiento reutilizable). FK polimórfica
     validada en app. Doc Agenda V1.7 §4.';

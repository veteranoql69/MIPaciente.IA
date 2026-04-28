-- ============================================================
-- Migración: 00044_campanas_fuentes.sql
-- Descripción: Campañas de marketing y fuentes de lead
--   estructuradas (doc Estadísticas V1.1 §1.2 ROI de campañas).
--   Reemplaza el uso de mpaci_contactos.canal_origen TEXT libre.
-- Módulo: CRM + Marketing → Estadísticas
-- Sprint: Ola C — Analítica
-- ============================================================

-- ============================================================
-- 1. Fuentes de lead (catálogo por empresa)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpaci_fuentes_lead (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),

    nombre TEXT NOT NULL,
    -- Ej: 'WhatsApp', 'Formulario Web', 'Instagram Ads', 'Referido', 'Manual'
    tipo TEXT NOT NULL,
    -- Valores: 'organico', 'pagado', 'referido', 'manual', 'ia'

    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_fuentes_tipo
        CHECK (tipo IN ('organico', 'pagado', 'referido', 'manual', 'ia')),
    CONSTRAINT uq_fuentes_nombre
        UNIQUE (empresa_id, nombre)
);

ALTER TABLE public.mpaci_fuentes_lead ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve fuentes de su empresa"
    ON public.mpaci_fuentes_lead FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Admin gestiona fuentes de su empresa"
    ON public.mpaci_fuentes_lead FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin')
        )
    );

COMMENT ON TABLE public.mpaci_fuentes_lead IS
    'Fuentes de origen de leads. Reemplaza canal_origen TEXT libre.
     Doc Estadísticas V1.1 §5.';

-- ============================================================
-- 2. Campañas (para ROI)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpaci_campanas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    fuente_id UUID REFERENCES public.mpaci_fuentes_lead(id),

    nombre TEXT NOT NULL,
    canal TEXT,
    -- 'Instagram Ads', 'Google Ads', 'Meta Ads', 'Email', 'SMS', etc.

    fecha_inicio DATE,
    fecha_fin DATE,

    -- ROI: inversión en CLP (o moneda local de la empresa)
    inversion NUMERIC DEFAULT 0,
    moneda TEXT DEFAULT 'CLP',

    objetivo TEXT,
    -- Descripción libre
    activa BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_campanas_rango
        CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);

ALTER TABLE public.mpaci_campanas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve campanas de su empresa"
    ON public.mpaci_campanas FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Admin gestiona campanas de su empresa"
    ON public.mpaci_campanas FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin')
        )
    );

CREATE INDEX IF NOT EXISTS idx_campanas_fuente ON public.mpaci_campanas(fuente_id);
CREATE INDEX IF NOT EXISTS idx_campanas_activa
    ON public.mpaci_campanas(empresa_id) WHERE activa = true;

COMMENT ON TABLE public.mpaci_campanas IS
    'Campañas de marketing con inversión trackeada para cálculo de ROI.
     Doc Estadísticas V1.1 §1.2.';

-- ============================================================
-- 3. Vincular mpaci_contactos a fuente y campaña
-- ============================================================
ALTER TABLE public.mpaci_contactos
    ADD COLUMN IF NOT EXISTS fuente_id UUID REFERENCES public.mpaci_fuentes_lead(id),
    ADD COLUMN IF NOT EXISTS campana_id UUID REFERENCES public.mpaci_campanas(id);

COMMENT ON COLUMN public.mpaci_contactos.fuente_id IS
    'FK estructurada a fuente de lead. Reemplaza canal_origen TEXT.
     canal_origen se mantiene por compat legacy.';
COMMENT ON COLUMN public.mpaci_contactos.campana_id IS
    'Campaña específica que generó el lead (opcional). Alimenta ROI.';

CREATE INDEX IF NOT EXISTS idx_contactos_fuente ON public.mpaci_contactos(fuente_id);
CREATE INDEX IF NOT EXISTS idx_contactos_campana ON public.mpaci_contactos(campana_id);

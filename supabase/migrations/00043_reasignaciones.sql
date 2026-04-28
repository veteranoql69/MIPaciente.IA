-- ============================================================
-- Migración: 00043_reasignaciones.sql
-- Descripción: Tabla dedicada de reasignaciones de contacto/prospecto
--   para soportar el módulo de Estadísticas V1.1 §7
--   (Estadísticas de reasignación con motivos, tiempos,
--   conversiones post-reasignación).
-- Módulo: CRM → Estadísticas
-- Sprint: Ola C — Saneamiento / Analítica
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mpaci_reasignaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),

    -- Sujeto de la reasignación (contacto o prospecto)
    contacto_id UUID REFERENCES public.mpaci_contactos(id),
    prospecto_id UUID REFERENCES public.mpaci_prospectos(id),

    -- De quién a quién
    de_usuario_id UUID REFERENCES public.mpaci_usuarios(id),
    -- NULL = contacto no tenía responsable previo
    a_usuario_id UUID NOT NULL REFERENCES public.mpaci_usuarios(id),

    motivo TEXT NOT NULL,
    -- Libre. Ej: 'sin respuesta 7 días', 'cambio de sede', 'especialidad'
    motivo_categoria TEXT,
    -- Clasificación para reportes. Valores sugeridos:
    -- 'sin_respuesta', 'especialidad', 'cambio_sede', 'carga_trabajo',
    -- 'vacaciones', 'otro'

    -- Quién ejecutó la reasignación (puede ser IA)
    ejecutado_por UUID REFERENCES public.mpaci_usuarios(id),
    ejecutado_por_ia BOOLEAN DEFAULT false,

    creado_en TIMESTAMPTZ DEFAULT now(),
    -- INMUTABLE

    CONSTRAINT chk_reasignaciones_sujeto
        CHECK (contacto_id IS NOT NULL OR prospecto_id IS NOT NULL),
    CONSTRAINT chk_reasignaciones_distintos
        CHECK (de_usuario_id IS NULL OR de_usuario_id != a_usuario_id)
);

ALTER TABLE public.mpaci_reasignaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve reasignaciones de su empresa"
    ON public.mpaci_reasignaciones FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente')
        )
    );

CREATE POLICY "Staff inserta reasignaciones en su empresa"
    ON public.mpaci_reasignaciones FOR INSERT
    WITH CHECK (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'sistema')
        )
    );

-- Inmutabilidad
CREATE POLICY "Reasignaciones inmutables - no update"
    ON public.mpaci_reasignaciones FOR UPDATE USING (false);
CREATE POLICY "Reasignaciones inmutables - no delete"
    ON public.mpaci_reasignaciones FOR DELETE USING (false);

CREATE INDEX IF NOT EXISTS idx_reasignaciones_contacto
    ON public.mpaci_reasignaciones(contacto_id);
CREATE INDEX IF NOT EXISTS idx_reasignaciones_prospecto
    ON public.mpaci_reasignaciones(prospecto_id);
CREATE INDEX IF NOT EXISTS idx_reasignaciones_fecha
    ON public.mpaci_reasignaciones(empresa_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_reasignaciones_a_usuario
    ON public.mpaci_reasignaciones(a_usuario_id, creado_en DESC);

COMMENT ON TABLE public.mpaci_reasignaciones IS
    'Historial inmutable de reasignaciones de contactos/prospectos.
     Alimenta reportes de Estadísticas §7 (total, por asistente, motivos,
     tiempos, conversiones post-reasignación).';

-- ============================================================
-- Migración: 00041_frases_rapidas.sql
-- Descripción: Frases rápidas (biblioteca institucional y
--   personal, doc Ficha V1.6 §4.5) y versionado histórico
--   de plantillas clínicas.
-- Módulo: Ficha Clínica
-- Sprint: Ola B — Funcionalidad
-- ============================================================

-- ============================================================
-- 1. Frases rápidas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpaci_frases_rapidas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),

    ambito TEXT NOT NULL,
    -- Valores: 'institucional' (visible a toda la empresa) o
    --          'personal' (solo del usuario que la creó)
    usuario_id UUID REFERENCES public.mpaci_usuarios(id),
    -- Requerido si ambito = 'personal'

    atajo TEXT,
    -- Shortcut opcional, ej: '/dx' para insertar rápido
    contenido TEXT NOT NULL,

    uso_count INTEGER DEFAULT 0,
    -- Contador de uso para ordenar "más usadas primero"

    creado_en TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_frases_ambito
        CHECK (ambito IN ('institucional', 'personal')),
    CONSTRAINT chk_frases_usuario_coherente
        CHECK (
            (ambito = 'institucional') OR
            (ambito = 'personal' AND usuario_id IS NOT NULL)
        )
);

ALTER TABLE public.mpaci_frases_rapidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve frases de su empresa"
    ON public.mpaci_frases_rapidas FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND (
            ambito = 'institucional'
            OR (ambito = 'personal' AND usuario_id = auth.uid())
        )
    );

CREATE POLICY "Clinicos gestionan sus frases personales"
    ON public.mpaci_frases_rapidas FOR ALL
    USING (
        empresa_id = get_my_empresa_id()
        AND ambito = 'personal'
        AND usuario_id = auth.uid()
    );

CREATE POLICY "Admin gestiona frases institucionales"
    ON public.mpaci_frases_rapidas FOR ALL
    USING (
        empresa_id = get_my_empresa_id()
        AND ambito = 'institucional'
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin')
        )
    );

CREATE INDEX IF NOT EXISTS idx_frases_empresa_ambito
    ON public.mpaci_frases_rapidas(empresa_id, ambito);
CREATE INDEX IF NOT EXISTS idx_frases_usuario
    ON public.mpaci_frases_rapidas(usuario_id) WHERE ambito = 'personal';

COMMENT ON TABLE public.mpaci_frases_rapidas IS
    'Frases rápidas para completar ficha clínica. Ámbitos: institucional
     (toda la empresa) y personal (solo del usuario). Doc Ficha V1.6 §4.5.';

-- ============================================================
-- 2. Versionado de plantillas clínicas
-- ============================================================
-- El doc V1.6 §4.5 menciona "versionado automático" de plantillas.
-- mpaci_plantillas_clinicas ya tiene .version pero sin historial.
-- Esta tabla guarda cada versión publicada para poder:
--  - Ver cambios históricos
--  - Que un registro_clinico pueda referenciar a la versión exacta

CREATE TABLE IF NOT EXISTS public.mpaci_plantillas_clinicas_versiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plantilla_id UUID NOT NULL REFERENCES public.mpaci_plantillas_clinicas(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,

    -- Snapshot completo de los campos en esa versión
    campos JSONB NOT NULL,
    nombre TEXT NOT NULL,
    categoria TEXT,

    creado_por UUID REFERENCES public.mpaci_usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now(),

    UNIQUE (plantilla_id, version)
);

ALTER TABLE public.mpaci_plantillas_clinicas_versiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve versiones plantillas via plantilla"
    ON public.mpaci_plantillas_clinicas_versiones FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.mpaci_plantillas_clinicas p
            WHERE p.id = plantilla_id
            AND p.empresa_id = get_my_empresa_id()
        )
    );

-- Inmutables una vez creadas
CREATE POLICY "Versiones plantillas inmutables - no update"
    ON public.mpaci_plantillas_clinicas_versiones FOR UPDATE USING (false);
CREATE POLICY "Versiones plantillas inmutables - no delete"
    ON public.mpaci_plantillas_clinicas_versiones FOR DELETE USING (false);

CREATE POLICY "Admin inserta versiones plantillas"
    ON public.mpaci_plantillas_clinicas_versiones FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.mpaci_plantillas_clinicas p
            WHERE p.id = plantilla_id
            AND p.empresa_id = get_my_empresa_id()
            AND EXISTS (
                SELECT 1 FROM public.mpaci_usuarios
                WHERE id = auth.uid()
                AND rol IN ('admin_general', 'admin')
            )
        )
    );

CREATE INDEX IF NOT EXISTS idx_plantillas_versiones_plantilla
    ON public.mpaci_plantillas_clinicas_versiones(plantilla_id, version DESC);

-- Trigger: al UPDATE de plantilla, archivar la versión anterior
CREATE OR REPLACE FUNCTION public.fn_plantillas_archivar_version()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Solo archivar si realmente cambiaron los campos o el nombre
    IF OLD.campos IS DISTINCT FROM NEW.campos
       OR OLD.nombre IS DISTINCT FROM NEW.nombre
       OR OLD.categoria IS DISTINCT FROM NEW.categoria THEN

        INSERT INTO public.mpaci_plantillas_clinicas_versiones (
            plantilla_id, version, campos, nombre, categoria, creado_por
        ) VALUES (
            OLD.id, OLD.version, OLD.campos, OLD.nombre, OLD.categoria, OLD.creado_por
        )
        ON CONFLICT (plantilla_id, version) DO NOTHING;

        -- Incrementar versión para el UPDATE actual
        NEW.version := OLD.version + 1;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_plantillas_archivar_version ON public.mpaci_plantillas_clinicas;
CREATE TRIGGER trg_plantillas_archivar_version
    BEFORE UPDATE ON public.mpaci_plantillas_clinicas
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_plantillas_archivar_version();

COMMENT ON TABLE public.mpaci_plantillas_clinicas_versiones IS
    'Historial de versiones de plantillas clínicas. Cada UPDATE que modifica
     los campos dispara un archivado automático. Inmutable. Doc Ficha V1.6 §4.5.';

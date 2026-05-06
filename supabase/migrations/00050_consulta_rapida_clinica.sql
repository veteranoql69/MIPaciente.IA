-- ============================================================
-- Migración: 00050_consulta_rapida_clinica.sql
-- Descripción: Persistencia del panel de doble-clic "Consulta
--   Rápida" del módulo Agenda. Agrega:
--   1. mpaci_motivos_consulta  — catálogo por empresa + personalizables
--   2. Columnas de consulta rápida en mpaci_fichas_clinicas:
--      motivos_consulta_ids, notas_medicas, examenes_solicitados,
--      notas_examenes, examen_fisico (JSONB), fotos_examenes_paths
-- Módulo: Agenda ↔ Ficha Clínica
-- Sprint: 6
-- Autor: Arquitecto IA
-- ============================================================

-- ============================================================
-- 1. CATÁLOGO DE MOTIVOS DE CONSULTA (por empresa)
-- ============================================================
-- Permite al médico:
--   a) Seleccionar motivos predefinidos (chips)
--   b) Agregar motivos propios que quedan en el catálogo
-- Los motivos globales tienen empresa_id NULL (seed en staging)

CREATE TABLE IF NOT EXISTS public.mpaci_motivos_consulta (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id  UUID REFERENCES public.mpaci_empresas(id),
    -- NULL = motivo global disponible para todas las empresas

    nombre      TEXT NOT NULL,
    activo      BOOLEAN DEFAULT true,

    -- Orden de aparición en la UI (los más usados primero)
    orden       INTEGER DEFAULT 100,

    creado_por  UUID REFERENCES public.mpaci_usuarios(id),
    creado_en   TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_motivo_empresa UNIQUE (empresa_id, nombre)
);

ALTER TABLE public.mpaci_motivos_consulta ENABLE ROW LEVEL SECURITY;

-- Todos los staff ven: los globales (NULL) + los de su empresa
CREATE POLICY "Staff ve motivos de su empresa y globales"
    ON public.mpaci_motivos_consulta FOR SELECT
    USING (
        empresa_id IS NULL
        OR empresa_id = get_my_empresa_id()
    );

-- Médicos y admins crean nuevos motivos propios
CREATE POLICY "Clinicos gestionan motivos de su empresa"
    ON public.mpaci_motivos_consulta FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'medico')
        )
    );

CREATE INDEX IF NOT EXISTS idx_motivos_empresa
    ON public.mpaci_motivos_consulta(empresa_id)
    WHERE activo = true;

COMMENT ON TABLE public.mpaci_motivos_consulta IS
    'Catálogo de motivos de consulta por empresa + globales (empresa_id NULL).
     El médico selecciona desde chips y puede crear nuevos que se persisten aquí.
     Sprint 6 — panel consulta rápida desde agenda.';

-- ── Seed de motivos globales ──────────────────────────────────────────────────
INSERT INTO public.mpaci_motivos_consulta (empresa_id, nombre, orden)
VALUES
    (NULL, 'Control post-op',             10),
    (NULL, 'Síntomas urinarios',          20),
    (NULL, 'Dolor pélvico',               30),
    (NULL, 'Cólico renal',                40),
    (NULL, 'Consulta de inicio',          50),
    (NULL, 'Revisión de exámenes',        60),
    (NULL, 'Seguimiento tratamiento',     70),
    (NULL, 'Segunda opinión',             80),
    (NULL, 'Urgencia',                    90),
    (NULL, 'Resultado de biopsia',        100),
    (NULL, 'Solicitud de cirugía',        110),
    (NULL, 'Preparación pre-operatoria',  120)
ON CONFLICT (empresa_id, nombre) DO NOTHING;

-- ============================================================
-- 2. COLUMNAS DE CONSULTA RÁPIDA EN mpaci_fichas_clinicas
-- ============================================================
-- Estrategia: agregar columnas estructuradas directamente en la
-- ficha (una por visita), evitando JOINs extra para la carga rápida
-- desde el panel de doble-clic de la agenda.

-- 2a. Motivos de consulta seleccionados en esta visita
--     Array de IDs de mpaci_motivos_consulta
ALTER TABLE public.mpaci_fichas_clinicas
    ADD COLUMN IF NOT EXISTS motivos_consulta_ids UUID[] DEFAULT '{}';

-- 2b. Texto libre de notas médicas del médico para esta visita
ALTER TABLE public.mpaci_fichas_clinicas
    ADD COLUMN IF NOT EXISTS notas_medicas TEXT;

-- 2c. Exámenes solicitados/anotados
--     Array de nombres de exámenes (del catálogo de chips)
ALTER TABLE public.mpaci_fichas_clinicas
    ADD COLUMN IF NOT EXISTS examenes_solicitados TEXT[] DEFAULT '{}';

-- 2d. Notas de exámenes (texto adicional)
ALTER TABLE public.mpaci_fichas_clinicas
    ADD COLUMN IF NOT EXISTS notas_examenes TEXT;

-- 2e. Examen físico estructurado
--     JSONB para flexibilidad: peso, talla, imc, presion_arterial, hallazgos
--     Estructura esperada:
--     {
--       "peso_kg":          72.5,
--       "talla_cm":         178,
--       "imc":              22.9,
--       "presion_arterial": "120/80",
--       "hallazgos":        "Próstata aumentada de volumen al tacto rectal."
--     }
ALTER TABLE public.mpaci_fichas_clinicas
    ADD COLUMN IF NOT EXISTS examen_fisico JSONB DEFAULT '{}'::jsonb;

-- 2f. Paths de fotos de examen físico en Supabase Storage
--     Cada elemento: "examenes_fisicos/empresa_x/contacto_y/foto1.jpg"
ALTER TABLE public.mpaci_fichas_clinicas
    ADD COLUMN IF NOT EXISTS fotos_examenes_paths TEXT[] DEFAULT '{}';

-- 2g. Médico que realizó la consulta (para filtros futuros)
--     Puede ser distinto al medico_id de la cita (ej: reemplazo)
ALTER TABLE public.mpaci_fichas_clinicas
    ADD COLUMN IF NOT EXISTS medico_consulta_id UUID
    REFERENCES public.mpaci_usuarios(id);

-- 2h. Timestamp de última edición (para ventana 24h de inmutabilidad)
ALTER TABLE public.mpaci_fichas_clinicas
    ADD COLUMN IF NOT EXISTS ultima_edicion_en TIMESTAMPTZ DEFAULT now();

COMMENT ON COLUMN public.mpaci_fichas_clinicas.motivos_consulta_ids IS
    'IDs de mpaci_motivos_consulta seleccionados en esta visita.';
COMMENT ON COLUMN public.mpaci_fichas_clinicas.notas_medicas IS
    'Notas clínicas libres del médico. Chips rápidos + texto libre.';
COMMENT ON COLUMN public.mpaci_fichas_clinicas.examenes_solicitados IS
    'Nombres de exámenes solicitados/anotados (del catálogo de chips).';
COMMENT ON COLUMN public.mpaci_fichas_clinicas.notas_examenes IS
    'Texto adicional sobre exámenes. Se muestra en historial del paciente.';
COMMENT ON COLUMN public.mpaci_fichas_clinicas.examen_fisico IS
    'JSONB con: peso_kg, talla_cm, imc (calculado), presion_arterial, hallazgos.';
COMMENT ON COLUMN public.mpaci_fichas_clinicas.fotos_examenes_paths IS
    'Paths en Supabase Storage de fotos/imágenes del examen físico.';
COMMENT ON COLUMN public.mpaci_fichas_clinicas.ultima_edicion_en IS
    'Timestamp de última edición. Determina la ventana de 24h de inmutabilidad.';

-- ============================================================
-- 3. ÍNDICES DE SOPORTE
-- ============================================================

-- Búsqueda de fichas por médico que realizó la consulta
CREATE INDEX IF NOT EXISTS idx_fichas_medico_consulta
    ON public.mpaci_fichas_clinicas(medico_consulta_id);

-- GIN para búsqueda dentro de examen_fisico JSONB
CREATE INDEX IF NOT EXISTS idx_fichas_examen_fisico_gin
    ON public.mpaci_fichas_clinicas USING gin(examen_fisico);

-- Fichas editadas recientemente (para ventana 24h)
CREATE INDEX IF NOT EXISTS idx_fichas_ultima_edicion
    ON public.mpaci_fichas_clinicas(ultima_edicion_en DESC);

-- ============================================================
-- 4. ACTUALIZAR RLS DE mpaci_fichas_clinicas
-- ============================================================
-- Permitir UPDATE dentro de 24h de ultima_edicion_en
-- (La política existente de INSERT ya existe; solo agregamos UPDATE)

-- Política UPDATE: médico puede editar su propia ficha dentro de 24h
DO $$
BEGIN
    -- Solo crear si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename  = 'mpaci_fichas_clinicas'
          AND policyname = 'Medico edita ficha dentro de 24h'
    ) THEN
        EXECUTE $policy$
            CREATE POLICY "Medico edita ficha dentro de 24h"
                ON public.mpaci_fichas_clinicas
                FOR UPDATE
                USING (
                    empresa_id = get_my_empresa_id()
                    AND EXISTS (
                        SELECT 1 FROM public.mpaci_usuarios
                        WHERE id = auth.uid() AND rol IN ('admin', 'medico')
                    )
                    AND (
                        -- Ventana de 24h desde la última edición
                        ultima_edicion_en > now() - INTERVAL '24 hours'
                        -- O el admin siempre puede editar
                        OR EXISTS (
                            SELECT 1 FROM public.mpaci_usuarios
                            WHERE id = auth.uid() AND rol = 'admin'
                        )
                    )
                );
        $policy$;
    END IF;
END;
$$;

-- ============================================================
-- 5. FUNCIÓN HELPER: calcular IMC
-- ============================================================

CREATE OR REPLACE FUNCTION public.calcular_imc(peso_kg NUMERIC, talla_cm NUMERIC)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT ROUND(peso_kg / POWER(talla_cm / 100.0, 2), 1);
$$;

COMMENT ON FUNCTION public.calcular_imc IS
    'Calcula el IMC dado peso en kg y talla en cm. IMMUTABLE para uso en generated columns futuras.';

-- ============================================================
-- 6. ACTUALIZAR DOCUMENTO DE SCHEMA
-- ============================================================
-- (Registro en comentario — actualizar 02_database_schema.md manualmente)
-- mpaci_motivos_consulta: empresa_id (nullable=global), nombre, activo, orden   [00050]
-- mpaci_fichas_clinicas: +motivos_consulta_ids, +notas_medicas,
--   +examenes_solicitados, +notas_examenes, +examen_fisico (JSONB),
--   +fotos_examenes_paths, +medico_consulta_id, +ultima_edicion_en              [00050]

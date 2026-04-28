-- ============================================================
-- Migración: 00040_catalogo_cie10.sql
-- Descripción: Catálogo maestro CIE-10 global (no multi-tenant,
--   compartido por todas las empresas) y FK opcional en
--   mpaci_diagnosticos. Doc Ficha Clínica V1.6 §4.1
--   ("diagnósticos solo desde catálogo CIE-10").
--   También catálogo de medicamentos.
-- Módulo: Ficha Clínica — Catálogos
-- Sprint: Ola B — Funcionalidad
-- ============================================================

-- ============================================================
-- 1. Catálogo CIE-10 (global)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpaci_catalogo_cie10 (
    codigo TEXT PRIMARY KEY,
    -- Ej: 'K35.2' (apendicitis aguda con peritonitis generalizada)
    descripcion TEXT NOT NULL,
    capitulo TEXT,
    -- Ej: 'XI' (Enfermedades del sistema digestivo)
    bloque TEXT,
    -- Ej: 'K35-K38' (Enfermedades del apéndice)
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_catalogo_cie10 ENABLE ROW LEVEL SECURITY;

-- Catálogo público de lectura para usuarios autenticados
DROP POLICY IF EXISTS "Usuarios autenticados leen catalogo cie10" ON public.mpaci_catalogo_cie10;
CREATE POLICY "Usuarios autenticados leen catalogo cie10"
    ON public.mpaci_catalogo_cie10 FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Solo superusuario (fuera de RLS) modifica el catálogo — no hay policy ALL

-- Búsqueda trigram para autocomplete
CREATE INDEX IF NOT EXISTS idx_cie10_descripcion_trgm
    ON public.mpaci_catalogo_cie10 USING gin (descripcion gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cie10_codigo_trgm
    ON public.mpaci_catalogo_cie10 USING gin (codigo gin_trgm_ops);

COMMENT ON TABLE public.mpaci_catalogo_cie10 IS
    'Catálogo global CIE-10. Compartido entre todas las empresas.
     Se carga una sola vez vía seed. Doc Ficha V1.6 §4.1.';

-- ============================================================
-- 2. FK opcional desde mpaci_diagnosticos al catálogo
-- ============================================================
-- No se hace la FK estricta hasta que el catálogo esté poblado con data oficial.
-- Validación blanda: que el codigo_cie10 exista si el catálogo tiene filas.
-- Por ahora solo se agrega un índice para joins rápidos.
CREATE INDEX IF NOT EXISTS idx_diagnosticos_codigo_cie10
    ON public.mpaci_diagnosticos(codigo_cie10);

-- ============================================================
-- 3. Catálogo de medicamentos (global, simplificado)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpaci_catalogo_medicamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_generico TEXT NOT NULL,
    nombre_comercial TEXT,
    principio_activo TEXT,
    forma_farmaceutica TEXT,
    -- 'comprimido', 'jarabe', 'inyectable', 'tópico', etc.
    concentracion TEXT,
    -- '500mg', '10mg/ml', etc.
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_catalogo_medicamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados leen catalogo medicamentos" ON public.mpaci_catalogo_medicamentos;
CREATE POLICY "Usuarios autenticados leen catalogo medicamentos"
    ON public.mpaci_catalogo_medicamentos FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_catalogo_med_generico_trgm
    ON public.mpaci_catalogo_medicamentos USING gin (nombre_generico gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_catalogo_med_comercial_trgm
    ON public.mpaci_catalogo_medicamentos USING gin (nombre_comercial gin_trgm_ops);

-- FK opcional desde mpaci_medicamentos_paciente
ALTER TABLE public.mpaci_medicamentos_paciente
    ADD COLUMN IF NOT EXISTS catalogo_id UUID REFERENCES public.mpaci_catalogo_medicamentos(id);

COMMENT ON COLUMN public.mpaci_medicamentos_paciente.catalogo_id IS
    'Referencia al catálogo global de medicamentos. NULL si el médico
     registró un medicamento libre que aún no existe en el catálogo.';

COMMENT ON TABLE public.mpaci_catalogo_medicamentos IS
    'Catálogo global de medicamentos. Se carga vía seed con data oficial (ISP, etc.).
     Doc Ficha V1.6 §4.2.';

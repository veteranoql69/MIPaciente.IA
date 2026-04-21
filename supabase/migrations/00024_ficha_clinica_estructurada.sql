-- ============================================================
-- Migración: 00024_ficha_clinica_estructurada.sql
-- Descripción: Reemplaza el modelo plano de ficha clínica con
--   un sistema estructurado según doc Ficha Clínica V1.6:
--   - Diagnósticos CIE-10 longitudinales
--   - Medicamentos longitudinales
--   - Alergias con severidad
--   - Cirugías externas (antecedentes)
--   - Plantillas clínicas (formularios tipados)
--   - Registros clínicos (instancias de plantilla por visita)
--   - Documentos del paciente
-- Módulo: Ficha Clínica
-- Sprint: 2-3
-- Autor: Arquitecto IA
-- ============================================================

-- ============================================================
-- 1. DIAGNÓSTICOS LONGITUDINALES (CIE-10)
-- ============================================================
-- Requisito: doc V1.6 sección 4.1
-- Son del PACIENTE (contacto_id), no de la cita

CREATE TABLE IF NOT EXISTS public.mpaci_diagnosticos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    contacto_id UUID NOT NULL REFERENCES public.mpaci_contactos(id),

    codigo_cie10 TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    lateralidad TEXT,
    -- Valores: 'bilateral', 'izquierdo', 'derecho', NULL

    estado TEXT DEFAULT 'activo',
    -- Valores: 'activo', 'inactivo', 'resuelto'

    -- Flags para bloque amarillo y búsqueda rápida
    es_principal BOOLEAN DEFAULT false,
    -- Si true → aparece en bloque amarillo de alertas
    es_favorito BOOLEAN DEFAULT false,
    -- Si true → aparece primero en búsquedas del catálogo

    -- Nota tipo Kindle (doc V1.6 sección 4.1)
    nota TEXT,

    creado_por UUID REFERENCES public.mpaci_usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_diagnosticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve diagnosticos de su empresa"
    ON public.mpaci_diagnosticos FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Clinicos gestionan diagnosticos de su empresa"
    ON public.mpaci_diagnosticos FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'medico')
        )
    );

CREATE INDEX IF NOT EXISTS idx_diagnosticos_contacto ON public.mpaci_diagnosticos(contacto_id);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_cie10 ON public.mpaci_diagnosticos(codigo_cie10);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_principal ON public.mpaci_diagnosticos(contacto_id) WHERE es_principal = true;

COMMENT ON TABLE public.mpaci_diagnosticos IS
    'Diagnósticos CIE-10 longitudinales del paciente (no por cita).
     Flags es_principal (bloque amarillo) y es_favorito (búsqueda).
     Doc Ficha Clínica V1.6 sección 4.1.';

-- ============================================================
-- 2. MEDICAMENTOS LONGITUDINALES
-- ============================================================
-- Requisito: doc V1.6 sección 4.2

CREATE TABLE IF NOT EXISTS public.mpaci_medicamentos_paciente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    contacto_id UUID NOT NULL REFERENCES public.mpaci_contactos(id),

    nombre TEXT NOT NULL,
    estado TEXT DEFAULT 'activo',
    -- Valores: 'activo', 'suspendido', 'completado'

    es_principal BOOLEAN DEFAULT false,
    es_favorito BOOLEAN DEFAULT false,
    nota TEXT,

    creado_por UUID REFERENCES public.mpaci_usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_medicamentos_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve medicamentos de su empresa"
    ON public.mpaci_medicamentos_paciente FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Clinicos gestionan medicamentos de su empresa"
    ON public.mpaci_medicamentos_paciente FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'medico')
        )
    );

CREATE INDEX IF NOT EXISTS idx_medicamentos_contacto ON public.mpaci_medicamentos_paciente(contacto_id);

COMMENT ON TABLE public.mpaci_medicamentos_paciente IS
    'Medicamentos longitudinales del paciente. Doc Ficha Clínica V1.6 sección 4.2.';

-- ============================================================
-- 3. ALERGIAS
-- ============================================================
-- Requisito: doc V1.6 sección 4.4

CREATE TABLE IF NOT EXISTS public.mpaci_alergias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    contacto_id UUID NOT NULL REFERENCES public.mpaci_contactos(id),

    sustancia TEXT NOT NULL,
    reaccion TEXT,
    severidad TEXT,
    -- Valores: 'leve', 'moderada', 'severa'

    -- Todas las alergias van al bloque amarillo por defecto
    es_principal BOOLEAN DEFAULT true,
    nota TEXT,

    creado_por UUID REFERENCES public.mpaci_usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_alergias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve alergias de su empresa"
    ON public.mpaci_alergias FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Clinicos gestionan alergias de su empresa"
    ON public.mpaci_alergias FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'medico')
        )
    );

CREATE INDEX IF NOT EXISTS idx_alergias_contacto ON public.mpaci_alergias(contacto_id);

COMMENT ON TABLE public.mpaci_alergias IS
    'Alergias del paciente con severidad. Todas aparecen en bloque amarillo por defecto.
     Doc Ficha Clínica V1.6 sección 4.4.';

-- ============================================================
-- 4. CIRUGÍAS EXTERNAS (Antecedentes históricos)
-- ============================================================
-- Requisito: doc V1.6 sección 4.3.2 (Cirugías No Urbamed)

CREATE TABLE IF NOT EXISTS public.mpaci_cirugias_externas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    contacto_id UUID NOT NULL REFERENCES public.mpaci_contactos(id),

    nombre TEXT NOT NULL,
    fecha DATE,
    profesional_lugar TEXT,
    -- "Dr. Rodríguez, Hospital X" — campo libre

    es_principal BOOLEAN DEFAULT false,
    nota TEXT,

    creado_por UUID REFERENCES public.mpaci_usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_cirugias_externas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve cirugias externas de su empresa"
    ON public.mpaci_cirugias_externas FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Clinicos gestionan cirugias externas de su empresa"
    ON public.mpaci_cirugias_externas FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'medico')
        )
    );

CREATE INDEX IF NOT EXISTS idx_cirugias_ext_contacto ON public.mpaci_cirugias_externas(contacto_id);

COMMENT ON TABLE public.mpaci_cirugias_externas IS
    'Cirugías realizadas fuera de la clínica (antecedentes históricos).
     Se consideran siempre como realizadas. Doc V1.6 sección 4.3.2.';

-- ============================================================
-- 5. PLANTILLAS CLÍNICAS (Definición de formularios)
-- ============================================================
-- Requisito: doc V1.6 sección 4.5

CREATE TABLE IF NOT EXISTS public.mpaci_plantillas_clinicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),

    nombre TEXT NOT NULL,
    categoria TEXT,
    -- Valores sugeridos: 'evaluacion', 'procedimiento', 'consentimiento', 'control'

    -- Definición de campos tipados
    -- Cada campo: { "key": "motivo_consulta", "tipo": "texto_largo", "label": "Motivo de consulta", "requerido": true }
    -- Tipos soportados (doc V1.6 sección 4.5):
    --   texto_corto, texto_largo, lista, checkbox, opcion_unica,
    --   opciones_multiples, fecha_hora, numerico, calculo, vinculado
    campos JSONB NOT NULL DEFAULT '[]'::jsonb,

    version INTEGER DEFAULT 1,
    activo BOOLEAN DEFAULT true,

    creado_por UUID REFERENCES public.mpaci_usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_plantillas_clinicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve plantillas de su empresa"
    ON public.mpaci_plantillas_clinicas FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Admin gestiona plantillas de su empresa"
    ON public.mpaci_plantillas_clinicas FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin')
        )
    );

CREATE INDEX IF NOT EXISTS idx_plantillas_empresa ON public.mpaci_plantillas_clinicas(empresa_id);

COMMENT ON TABLE public.mpaci_plantillas_clinicas IS
    'Definición de plantillas clínicas (formularios tipados) por empresa.
     Cada plantilla tiene una lista de campos JSON con tipo, label, validaciones.
     Se instancian como mpaci_registros_clinicos por visita. Doc V1.6 sección 4.5.';

-- ============================================================
-- 6. REGISTROS CLÍNICOS (Instancias de plantilla por visita)
-- ============================================================
-- Requisito: Reemplaza contenido_texto de mpaci_fichas_clinicas
-- Una ficha clínica puede tener N registros (cada uno es una plantilla completada)

CREATE TABLE IF NOT EXISTS public.mpaci_registros_clinicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    ficha_id UUID NOT NULL REFERENCES public.mpaci_fichas_clinicas(id) ON DELETE CASCADE,
    plantilla_id UUID REFERENCES public.mpaci_plantillas_clinicas(id),
    version_plantilla INTEGER,
    -- Snapshot de la versión de plantilla usada al momento de crear

    -- Respuestas al formulario
    -- Estructura: { "motivo_consulta": "Dolor en ...", "peso": 72.5, ... }
    contenido JSONB NOT NULL DEFAULT '{}'::jsonb,

    creado_por UUID REFERENCES public.mpaci_usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now()
    -- INMUTABLE: sin UPDATE/DELETE por RLS (hereda inmutabilidad de ficha clínica)
);

ALTER TABLE public.mpaci_registros_clinicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve registros de su empresa"
    ON public.mpaci_registros_clinicos FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Medicos insertan registros en su empresa"
    ON public.mpaci_registros_clinicos FOR INSERT
    WITH CHECK (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'medico')
        )
    );

-- Registros clínicos son INMUTABLES (como la ficha clínica post-24h)
-- La edición se permite solo dentro de las 24h de la ficha padre
-- Esto se valida en el Server Action, no en RLS (para mensajes claros)

-- No bloqueamos UPDATE globalmente porque el médico puede editar
-- dentro de las 24h. La lógica de lock la hereda de mpaci_fichas_clinicas.

CREATE INDEX IF NOT EXISTS idx_registros_ficha ON public.mpaci_registros_clinicos(ficha_id);
CREATE INDEX IF NOT EXISTS idx_registros_plantilla ON public.mpaci_registros_clinicos(plantilla_id);

COMMENT ON TABLE public.mpaci_registros_clinicos IS
    'Instancias de plantilla clínica completada por visita. Reemplaza contenido_texto.
     Cada registro contiene las respuestas JSON a un formulario tipado.
     Hereda inmutabilidad post-24h de mpaci_fichas_clinicas.';

-- Deprecar contenido_texto (no eliminamos por compatibilidad)
COMMENT ON COLUMN public.mpaci_fichas_clinicas.contenido_texto IS
    'DEPRECATED desde migración 00024. Usar mpaci_registros_clinicos para datos estructurados.
     Mantener para backward compatibility con datos legacy.';

-- ============================================================
-- 7. DOCUMENTOS DEL PACIENTE
-- ============================================================
-- Requisito: doc V2.3 TAB 7 "Documentos del Paciente"
-- Centraliza todos los documentos del contacto

CREATE TABLE IF NOT EXISTS public.mpaci_documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    contacto_id UUID NOT NULL REFERENCES public.mpaci_contactos(id),

    -- Vínculos opcionales a entidades específicas
    cita_id UUID REFERENCES public.mpaci_citas(id),
    ficha_id UUID REFERENCES public.mpaci_fichas_clinicas(id),

    -- Clasificación (doc V2.3 sección 9)
    tipo TEXT NOT NULL,
    -- Valores: 'clinico', 'administrativo', 'otro'

    nombre TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    -- Path en Supabase Storage (ej: 'documentos/empresa_x/contacto_y/archivo.pdf')

    mime_type TEXT,
    tamanio_bytes INTEGER,

    origen TEXT,
    -- Valores: 'stirling_pdf', 'upload_manual', 'whatsapp', 'ia', 'plantilla'

    subido_por UUID REFERENCES public.mpaci_usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve documentos de su empresa"
    ON public.mpaci_documentos FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Staff gestiona documentos de su empresa"
    ON public.mpaci_documentos FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'medico', 'asistente')
        )
    );

ALTER TABLE public.mpaci_documentos
    ADD CONSTRAINT chk_documentos_tipo CHECK (tipo IN ('clinico', 'administrativo', 'otro'));

CREATE INDEX IF NOT EXISTS idx_documentos_contacto ON public.mpaci_documentos(contacto_id);
CREATE INDEX IF NOT EXISTS idx_documentos_cita ON public.mpaci_documentos(cita_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON public.mpaci_documentos(contacto_id, tipo);

COMMENT ON TABLE public.mpaci_documentos IS
    'Repositorio centralizado de documentos del paciente.
     Incluye documentos clínicos (PDF generados por Stirling), administrativos y otros.
     Doc Vista de Contacto V2.3 TAB 7.';

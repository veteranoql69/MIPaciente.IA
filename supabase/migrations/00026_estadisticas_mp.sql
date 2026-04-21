-- ============================================================
-- Migración: 00026_estadisticas_mp.sql
-- Descripción: Crea el módulo de Estadísticas MP según doc V1.1:
--   - Reportes individuales con métricas configurables
--   - Tableros compuestos con permisos independientes
--   - Relación N:M tablero-reporte con posición
--   - Permisos por tablero (usuario, rol, sede)
-- Módulo: Estadísticas
-- Sprint: 6+
-- Autor: Arquitecto IA
-- ============================================================

-- ============================================================
-- 1. REPORTES INDIVIDUALES
-- ============================================================
-- Requisito: doc V1.1 sección 1

CREATE TABLE IF NOT EXISTS public.mpaci_reportes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),

    nombre TEXT NOT NULL,
    descripcion TEXT,

    -- Configuración del reporte (doc V1.1 sección 1.3)
    -- Estructura:
    -- {
    --   "metricas": ["leads_nuevos", "cirugias_realizadas", "conversiones"],
    --   "filtros": {
    --     "medico_id": ["uuid1", "uuid2"],
    --     "prevision": ["fonasa", "isapre"],
    --     "sede_id": ["uuid1"],
    --     "rango_fechas": { "desde": "2026-01-01", "hasta": "2026-03-31" }
    --   },
    --   "visualizacion": "grafico_barras",
    --   "comparativo_mensual": true,
    --   "ejes": { "x": "meses", "y": "cantidad" }
    -- }
    configuracion JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Tipo de visualización
    tipo_visualizacion TEXT DEFAULT 'tabla',
    -- Valores: 'tabla', 'grafico_barras', 'grafico_lineas', 'grafico_torta', 'kpi', 'mixto'

    -- Permisos individuales del reporte (doc V1.1 sección 1.4)
    -- Solo aplican cuando el reporte se ve de forma individual
    -- Dentro de un tablero, el tablero sobreescribe (doc V1.1 sección 2.4)
    visibilidad TEXT DEFAULT 'creador',
    -- Valores: 'creador', 'roles', 'sede', 'usuarios'
    visibilidad_config JSONB DEFAULT '{}'::jsonb,
    -- Según visibilidad:
    -- 'roles': { "roles": ["admin", "medico"] }
    -- 'sede': { "sucursal_ids": ["uuid1"] }
    -- 'usuarios': { "usuario_ids": ["uuid1", "uuid2"] }

    creado_por UUID NOT NULL REFERENCES public.mpaci_usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now(),
    actualizado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_reportes ENABLE ROW LEVEL SECURITY;

-- Todo staff puede ver reportes que le correspondan
-- La lógica de visibilidad fina se implementa en la app
CREATE POLICY "Staff ve reportes de su empresa"
    ON public.mpaci_reportes FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Staff gestiona reportes de su empresa"
    ON public.mpaci_reportes FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
    );

CREATE INDEX IF NOT EXISTS idx_reportes_empresa ON public.mpaci_reportes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_reportes_creador ON public.mpaci_reportes(creado_por);

COMMENT ON TABLE public.mpaci_reportes IS
    'Unidad mínima del sistema de estadísticas. Cada reporte tiene métricas,
     filtros, visualización y permisos individuales. Doc Estadísticas V1.1 sección 1.';

-- ============================================================
-- 2. TABLEROS
-- ============================================================
-- Requisito: doc V1.1 sección 2

CREATE TABLE IF NOT EXISTS public.mpaci_tableros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),

    nombre TEXT NOT NULL,
    descripcion TEXT,

    -- Configuración visual (doc V1.1 sección 3)
    -- { "columnas": 2, "layout": "grid" }
    configuracion_visual JSONB DEFAULT '{"columnas": 2}'::jsonb,

    creado_por UUID NOT NULL REFERENCES public.mpaci_usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now(),
    actualizado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_tableros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve tableros de su empresa"
    ON public.mpaci_tableros FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

CREATE POLICY "Staff gestiona tableros de su empresa"
    ON public.mpaci_tableros FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
    );

CREATE INDEX IF NOT EXISTS idx_tableros_empresa ON public.mpaci_tableros(empresa_id);

COMMENT ON TABLE public.mpaci_tableros IS
    'Vistas compuestas que agrupan múltiples reportes. Grid de 2 columnas internas.
     Los permisos del tablero sobreescriben los del reporte. Doc V1.1 sección 2.';

-- ============================================================
-- 3. RELACIÓN TABLERO ↔ REPORTE (N:M con posición)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mpaci_tableros_reportes (
    tablero_id UUID NOT NULL REFERENCES public.mpaci_tableros(id) ON DELETE CASCADE,
    reporte_id UUID NOT NULL REFERENCES public.mpaci_reportes(id) ON DELETE CASCADE,

    posicion INTEGER NOT NULL DEFAULT 0,
    -- Orden del reporte dentro del tablero (para drag & drop)

    -- Configuración de tamaño dentro del grid
    ancho TEXT DEFAULT 'medio',
    -- Valores: 'completo' (2 cols), 'medio' (1 col)

    PRIMARY KEY (tablero_id, reporte_id)
);

ALTER TABLE public.mpaci_tableros_reportes ENABLE ROW LEVEL SECURITY;

-- Hereda permisos del tablero
CREATE POLICY "Staff ve tableros_reportes via tablero"
    ON public.mpaci_tableros_reportes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.mpaci_tableros t
            WHERE t.id = tablero_id
            AND t.empresa_id = get_my_empresa_id()
        )
    );

CREATE POLICY "Staff gestiona tableros_reportes via tablero"
    ON public.mpaci_tableros_reportes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.mpaci_tableros t
            WHERE t.id = tablero_id
            AND t.empresa_id = get_my_empresa_id()
        )
    );

COMMENT ON TABLE public.mpaci_tableros_reportes IS
    'Relación N:M entre tableros y reportes con posición para drag & drop.';

-- ============================================================
-- 4. PERMISOS POR TABLERO
-- ============================================================
-- Requisito: doc V1.1 sección 2.3 y 2.4

CREATE TABLE IF NOT EXISTS public.mpaci_permisos_tablero (
    tablero_id UUID NOT NULL REFERENCES public.mpaci_tableros(id) ON DELETE CASCADE,

    tipo TEXT NOT NULL,
    -- Valores: 'usuario', 'rol', 'sede'

    referencia_id UUID NOT NULL,
    -- Si tipo = 'usuario' → user_id
    -- Si tipo = 'rol'     → no aplica UUID, se usa referencia_texto
    -- Si tipo = 'sede'    → sucursal_id

    referencia_texto TEXT,
    -- Para tipo 'rol': 'admin', 'medico', etc.

    PRIMARY KEY (tablero_id, tipo, referencia_id)
);

ALTER TABLE public.mpaci_permisos_tablero ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve permisos tablero via tablero"
    ON public.mpaci_permisos_tablero FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.mpaci_tableros t
            WHERE t.id = tablero_id
            AND t.empresa_id = get_my_empresa_id()
        )
    );

CREATE POLICY "Staff gestiona permisos tablero via tablero"
    ON public.mpaci_permisos_tablero FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.mpaci_tableros t
            WHERE t.id = tablero_id
            AND t.empresa_id = get_my_empresa_id()
        )
    );

COMMENT ON TABLE public.mpaci_permisos_tablero IS
    'Permisos de acceso por tablero. El tablero sobreescribe los permisos
     individuales de cada reporte contenido. Doc V1.1 sección 2.4.';

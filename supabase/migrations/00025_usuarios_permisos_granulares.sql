-- ============================================================
-- Migración: 00025_usuarios_permisos_granulares.sql
-- Descripción: Evoluciona el sistema de permisos según doc V6:
--   - Nuevos roles en app_role enum
--   - Permisos modulares JSONB por usuario
--   - Plantillas de permisos base
--   - Auditoría de cambios de permisos
-- Módulo: Usuarios y Permisos
-- Sprint: 3-4
-- Autor: Arquitecto IA
-- ============================================================

-- ============================================================
-- 1. EXPANDIR app_role ENUM (D1)
-- ============================================================
-- PostgreSQL no permite DROP VALUE de un enum.
-- Agregamos los nuevos valores sin eliminar 'gerente' (deprecated).
-- ALTER TYPE ... ADD VALUE no es transaccional, se ejecuta fuera de bloque.

-- Verificamos y agregamos cada valor solo si no existe
DO $$ BEGIN
    -- Verificar si 'admin_general' ya existe
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin_general' AND enumtypid = 'app_role'::regtype) THEN
        ALTER TYPE app_role ADD VALUE 'admin_general';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'enfermera_tens' AND enumtypid = 'app_role'::regtype) THEN
        ALTER TYPE app_role ADD VALUE 'enfermera_tens';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'externo' AND enumtypid = 'app_role'::regtype) THEN
        ALTER TYPE app_role ADD VALUE 'externo';
    END IF;
END $$;

COMMENT ON TYPE app_role IS
    'Roles base del sistema Mi-Paciente. Doc Usuarios y Permisos V6.
     Valores actuales: admin_general, admin, medico, asistente, enfermera_tens, externo, sistema.
     DEPRECATED: gerente (mantener por backward compatibility, no usar en código nuevo).';

-- ============================================================
-- 2. TABLA mpaci_plantillas_permisos
-- ============================================================
-- Requisito: doc V6 sección 6

CREATE TABLE IF NOT EXISTS public.mpaci_plantillas_permisos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),

    nombre TEXT NOT NULL,
    -- Ej: 'Administrador General', 'Médico', 'Asistente', 'Enfermera/TENS', 'Externo'

    -- Mapa de permisos modulares (casillas ticables del doc V6 sección 5)
    -- Estructura:
    -- {
    --   "agenda.acceder": true,
    --   "agenda.ver_completa": true,
    --   "agenda.ver_solo_propia": false,
    --   "agenda.crear_modificar_citas": true,
    --   "agenda.cancelar_citas": true,
    --   "agenda.ver_estado_pago": true,
    --   "agenda.marcar_asistencia": true,
    --   "crm.acceder": true,
    --   "crm.ver_todos_tratos": true,
    --   "crm.ver_solo_asignados": false,
    --   "crm.crear_editar_tratos": true,
    --   "crm.cambiar_etapa": true,
    --   "crm.marcar_ganado_perdido": true,
    --   "crm.crear_editar_tareas": true,
    --   "crm.exportar": true,
    --   "ficha_clinica.acceder": true,
    --   "ficha_clinica.ver_fichas": true,
    --   "ficha_clinica.ver_solo_sus_pacientes": false,
    --   "ficha_clinica.ver_solo_admin": false,
    --   "ficha_clinica.ver_datos_clinicos": true,
    --   "ficha_clinica.editar": true,
    --   "ficha_clinica.ver_notas_privadas": false,
    --   "ficha_clinica.subir_documentos": true,
    --   "ficha_clinica.descargar_documentos": true,
    --   "estadisticas.crear": true,
    --   "estadisticas.editar_propios": true,
    --   "estadisticas.editar_otros": false,
    --   "estadisticas.eliminar": false,
    --   "estadisticas.duplicar": true,
    --   "config.acceder": true,
    --   "config.gestionar_servicios": true,
    --   "config.gestionar_plantillas": true,
    --   "config.ver_usuarios": true,
    --   "config.crear_usuarios": true,
    --   "config.gestionar_integraciones": false,
    --   "automatizaciones.acceder": false,
    --   "automatizaciones.crear": false,
    --   "automatizaciones.editar": false,
    --   "automatizaciones.activar_desactivar": false,
    --   "automatizaciones.ver_historial": false
    -- }
    permisos JSONB NOT NULL DEFAULT '{}'::jsonb,

    es_sistema BOOLEAN DEFAULT false,
    -- Plantillas predefinidas por el sistema (Administrador General, Médico, etc.)
    -- No pueden ser eliminadas, solo modificadas

    creado_por UUID REFERENCES public.mpaci_usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_plantillas_permisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff ve plantillas permisos de su empresa"
    ON public.mpaci_plantillas_permisos FOR SELECT
    USING (empresa_id IS NOT NULL AND empresa_id = get_my_empresa_id());

-- Solo admin_general puede gestionar plantillas de permisos
CREATE POLICY "Admin general gestiona plantillas permisos"
    ON public.mpaci_plantillas_permisos FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol = 'admin_general'
        )
    );

COMMENT ON TABLE public.mpaci_plantillas_permisos IS
    'Plantillas de permisos base definidas por admin_general. Cada plantilla es un punto de partida
     que se puede personalizar por usuario. Doc Usuarios y Permisos V6 sección 6.';

-- ============================================================
-- 3. EXPANDIR mpaci_usuarios
-- ============================================================

ALTER TABLE public.mpaci_usuarios
    ADD COLUMN IF NOT EXISTS permisos JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS plantilla_permisos_id UUID REFERENCES public.mpaci_plantillas_permisos(id);

COMMENT ON COLUMN public.mpaci_usuarios.permisos IS
    'Permisos modulares personalizados del usuario. Estructura de casillas ticables.
     Si vacío, hereda de la plantilla_permisos_id. Doc V6 sección 5.';
COMMENT ON COLUMN public.mpaci_usuarios.plantilla_permisos_id IS
    'Plantilla de permisos base asignada al usuario. Los permisos individuales
     pueden overridear la plantilla. NULL = permisos manuales sin plantilla.';

-- ============================================================
-- 4. TABLA mpaci_auditoria_permisos
-- ============================================================
-- Requisito: doc V6 sección 3.3

CREATE TABLE IF NOT EXISTS public.mpaci_auditoria_permisos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),

    usuario_afectado UUID NOT NULL REFERENCES public.mpaci_usuarios(id),
    modificado_por UUID NOT NULL REFERENCES public.mpaci_usuarios(id),

    -- Detalle del cambio
    permiso_clave TEXT,
    -- Ej: 'agenda.ver_completa', 'crm.exportar'
    valor_anterior BOOLEAN,
    valor_nuevo BOOLEAN,

    -- Si cambió la plantilla completa
    plantilla_anterior_id UUID REFERENCES public.mpaci_plantillas_permisos(id),
    plantilla_nueva_id UUID REFERENCES public.mpaci_plantillas_permisos(id),

    -- Si cambió el rol
    rol_anterior TEXT,
    rol_nuevo TEXT,

    creado_en TIMESTAMPTZ DEFAULT now()
    -- INMUTABLE
);

ALTER TABLE public.mpaci_auditoria_permisos ENABLE ROW LEVEL SECURITY;

-- Solo admin_general puede ver la auditoría de permisos
CREATE POLICY "Admin general ve auditoria permisos"
    ON public.mpaci_auditoria_permisos FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol = 'admin_general'
        )
    );

CREATE POLICY "Admin general inserta auditoria permisos"
    ON public.mpaci_auditoria_permisos FOR INSERT
    WITH CHECK (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol = 'admin_general'
        )
    );

-- INMUTABILIDAD
CREATE POLICY "Auditoria permisos inmutable - no update"
    ON public.mpaci_auditoria_permisos FOR UPDATE USING (false);

CREATE POLICY "Auditoria permisos inmutable - no delete"
    ON public.mpaci_auditoria_permisos FOR DELETE USING (false);

CREATE INDEX IF NOT EXISTS idx_auditoria_permisos_usuario ON public.mpaci_auditoria_permisos(usuario_afectado);
CREATE INDEX IF NOT EXISTS idx_auditoria_permisos_fecha ON public.mpaci_auditoria_permisos(empresa_id, creado_en DESC);

COMMENT ON TABLE public.mpaci_auditoria_permisos IS
    'Auditoría de cambios de permisos. INMUTABLE. Visible solo para admin_general.
     Doc Usuarios y Permisos V6 sección 3.3.';

-- ============================================================
-- 5. FUNCIÓN HELPER: Verificar permisos en Server Actions
-- ============================================================
-- Esta función se usa en Server Actions para verificar permisos granulares
-- sin hacer la lógica de merge plantilla+override en cada Server Action

CREATE OR REPLACE FUNCTION public.check_permission(p_user_id UUID, p_permission_key TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_user_permisos JSONB;
    v_plantilla_permisos JSONB;
    v_user_rol app_role;
BEGIN
    -- Obtener datos del usuario
    SELECT permisos, rol INTO v_user_permisos, v_user_rol
    FROM public.mpaci_usuarios
    WHERE id = p_user_id;

    -- admin_general tiene todos los permisos
    IF v_user_rol = 'admin_general' THEN
        RETURN true;
    END IF;

    -- Si el permiso existe en los permisos individuales del usuario, usarlo
    IF v_user_permisos ? p_permission_key THEN
        RETURN (v_user_permisos ->> p_permission_key)::boolean;
    END IF;

    -- Si no, buscar en la plantilla asociada
    SELECT pp.permisos INTO v_plantilla_permisos
    FROM public.mpaci_usuarios u
    JOIN public.mpaci_plantillas_permisos pp ON pp.id = u.plantilla_permisos_id
    WHERE u.id = p_user_id;

    IF v_plantilla_permisos IS NOT NULL AND v_plantilla_permisos ? p_permission_key THEN
        RETURN (v_plantilla_permisos ->> p_permission_key)::boolean;
    END IF;

    -- Por defecto: sin permiso
    RETURN false;
END;
$$;

COMMENT ON FUNCTION public.check_permission(UUID, TEXT) IS
    'Verifica si un usuario tiene un permiso específico. Orden de prioridad:
     1. admin_general → siempre true
     2. Permisos individuales del usuario (override)
     3. Plantilla de permisos asociada
     4. Default: false';

-- ============================================================
-- Migración: 00048_permisos_usuario.sql
-- Descripción: Sistema de permisos modulares por usuario (ABAC)
--   - mpaci_permisos_usuario: permiso granular por usuario+módulo
--   - mpaci_asignaciones_medico: relación asistente ↔ médicos asignados
--   - tiene_permiso(): helper SECURITY DEFINER para RLS de otros módulos
--   - seed_permisos_por_rol(): siembra permisos según plantilla de rol
-- Ref: "Usuarios y Permisos V6" — permisos son 100% modulares
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLA DE PERMISOS POR USUARIO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mpaci_permisos_usuario (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id   UUID        NOT NULL REFERENCES public.mpaci_empresas(id) ON DELETE CASCADE,
    usuario_id   UUID        NOT NULL REFERENCES public.mpaci_usuarios(id) ON DELETE CASCADE,
    modulo       TEXT        NOT NULL,
    -- 'agenda' | 'crm' | 'ficha_clinica' | 'estadisticas' | 'configuracion' | 'integraciones'
    permiso      TEXT        NOT NULL,
    activo       BOOLEAN     NOT NULL DEFAULT true,
    otorgado_por UUID        REFERENCES public.mpaci_usuarios(id),
    otorgado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_permiso_usuario UNIQUE (usuario_id, modulo, permiso),
    CONSTRAINT chk_modulo CHECK (modulo IN (
        'agenda', 'crm', 'ficha_clinica', 'estadisticas', 'configuracion', 'integraciones'
    ))
);

CREATE INDEX IF NOT EXISTS idx_permisos_usuario
    ON public.mpaci_permisos_usuario(usuario_id, modulo, activo);

CREATE INDEX IF NOT EXISTS idx_permisos_empresa
    ON public.mpaci_permisos_usuario(empresa_id);

ALTER TABLE public.mpaci_permisos_usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin general gestiona permisos" ON public.mpaci_permisos_usuario;
DROP POLICY IF EXISTS "Usuario lee sus propios permisos" ON public.mpaci_permisos_usuario;

-- Solo admin_general puede gestionar permisos (regla dura del doc)
CREATE POLICY "Admin general gestiona permisos"
    ON public.mpaci_permisos_usuario FOR ALL
    USING (
        empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol = 'admin_general'
        )
    )
    WITH CHECK (
        empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol = 'admin_general'
        )
    );

-- Cada usuario puede leer sus propios permisos (para el PermissionProvider)
CREATE POLICY "Usuario lee sus propios permisos"
    ON public.mpaci_permisos_usuario FOR SELECT
    USING (usuario_id = auth.uid());

-- ------------------------------------------------------------
-- 2. TABLA DE ASIGNACIONES ASISTENTE ↔ MÉDICO (n:m)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mpaci_asignaciones_medico (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id   UUID        NOT NULL REFERENCES public.mpaci_empresas(id) ON DELETE CASCADE,
    asistente_id UUID        NOT NULL REFERENCES public.mpaci_usuarios(id) ON DELETE CASCADE,
    medico_id    UUID        NOT NULL REFERENCES public.mpaci_usuarios(id) ON DELETE CASCADE,
    activo       BOOLEAN     NOT NULL DEFAULT true,
    creado_por   UUID        REFERENCES public.mpaci_usuarios(id),
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_asignacion_medico UNIQUE (asistente_id, medico_id),
    CONSTRAINT chk_asignacion_distintos CHECK (asistente_id != medico_id)
);

CREATE INDEX IF NOT EXISTS idx_asignaciones_asistente
    ON public.mpaci_asignaciones_medico(asistente_id, activo);

CREATE INDEX IF NOT EXISTS idx_asignaciones_medico
    ON public.mpaci_asignaciones_medico(medico_id, activo);

ALTER TABLE public.mpaci_asignaciones_medico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff ve asignaciones de su empresa" ON public.mpaci_asignaciones_medico;
DROP POLICY IF EXISTS "Admin gestiona asignaciones" ON public.mpaci_asignaciones_medico;

CREATE POLICY "Staff ve asignaciones de su empresa"
    ON public.mpaci_asignaciones_medico FOR SELECT
    USING (empresa_id = get_my_empresa_id());

CREATE POLICY "Admin gestiona asignaciones"
    ON public.mpaci_asignaciones_medico FOR ALL
    USING (
        empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol::text IN ('admin_general', 'admin')
        )
    )
    WITH CHECK (
        empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol::text IN ('admin_general', 'admin')
        )
    );

-- ------------------------------------------------------------
-- 3. FUNCIÓN HELPER: tiene_permiso()
--    SECURITY DEFINER → bypasa RLS al ser llamada desde policies
--    de otras tablas (mpaci_citas, mpaci_fichas_clinicas, etc.)
--    admin_general siempre retorna true sin consultar la tabla.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tiene_permiso(
    p_usuario_id UUID,
    p_modulo     TEXT,
    p_permiso    TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        -- admin_general tiene acceso total siempre
        EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = p_usuario_id AND rol = 'admin_general'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.mpaci_permisos_usuario
            WHERE usuario_id = p_usuario_id
              AND modulo      = p_modulo
              AND permiso     = p_permiso
              AND activo      = true
        );
$$;

-- ------------------------------------------------------------
-- 4. FUNCIÓN: seed_permisos_por_rol()
--    Inserta los permisos base según la plantilla del rol.
--    Se llama al aceptar una invitación o al crear un usuario.
--    Usa ON CONFLICT DO NOTHING — no pisa customizaciones previas.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_permisos_por_rol(
    p_usuario_id  UUID,
    p_empresa_id  UUID,
    p_rol         app_role,
    p_otorgado_por UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    permisos TEXT[][] := ARRAY[]::TEXT[][];
    par      TEXT[];
BEGIN
    -- Determinar plantilla según rol
    CASE p_rol::text

        WHEN 'admin_general' THEN
            -- admin_general: tiene_permiso() siempre retorna true por rol.
            -- Insertamos sus permisos explícitos igual para auditoría.
            permisos := ARRAY[
                ARRAY['agenda',        'acceder'],
                ARRAY['agenda',        'ver_completa'],
                ARRAY['agenda',        'crear_modificar_citas'],
                ARRAY['agenda',        'cancelar_citas'],
                ARRAY['agenda',        'ver_estado_pago'],
                ARRAY['agenda',        'marcar_asistencia'],
                ARRAY['crm',           'acceder'],
                ARRAY['crm',           'ver_todos'],
                ARRAY['crm',           'crear_editar'],
                ARRAY['crm',           'cambiar_etapa'],
                ARRAY['crm',           'marcar_ganado_perdido'],
                ARRAY['crm',           'crear_editar_tareas'],
                ARRAY['crm',           'exportar'],
                ARRAY['ficha_clinica', 'acceder'],
                ARRAY['ficha_clinica', 'ver_fichas'],
                ARRAY['ficha_clinica', 'ver_datos_admin'],
                ARRAY['ficha_clinica', 'ver_datos_clinicos'],
                ARRAY['ficha_clinica', 'editar'],
                ARRAY['ficha_clinica', 'ver_notas_privadas'],
                ARRAY['ficha_clinica', 'subir_documentos'],
                ARRAY['ficha_clinica', 'descargar_imprimir'],
                ARRAY['estadisticas',  'acceder'],
                ARRAY['estadisticas',  'crear_tableros'],
                ARRAY['estadisticas',  'editar_propios'],
                ARRAY['estadisticas',  'editar_ajenos'],
                ARRAY['estadisticas',  'eliminar'],
                ARRAY['estadisticas',  'duplicar'],
                ARRAY['configuracion', 'acceder'],
                ARRAY['configuracion', 'gestionar_servicios'],
                ARRAY['configuracion', 'gestionar_plantillas'],
                ARRAY['configuracion', 'ver_usuarios'],
                ARRAY['configuracion', 'crear_usuarios'],
                ARRAY['configuracion', 'gestionar_integraciones'],
                ARRAY['integraciones', 'acceder'],
                ARRAY['integraciones', 'configurar']
            ];

        WHEN 'admin' THEN
            permisos := ARRAY[
                ARRAY['agenda',        'acceder'],
                ARRAY['agenda',        'ver_completa'],
                ARRAY['agenda',        'crear_modificar_citas'],
                ARRAY['agenda',        'cancelar_citas'],
                ARRAY['agenda',        'ver_estado_pago'],
                ARRAY['agenda',        'marcar_asistencia'],
                ARRAY['crm',           'acceder'],
                ARRAY['crm',           'ver_todos'],
                ARRAY['crm',           'crear_editar'],
                ARRAY['crm',           'cambiar_etapa'],
                ARRAY['crm',           'marcar_ganado_perdido'],
                ARRAY['crm',           'crear_editar_tareas'],
                ARRAY['crm',           'exportar'],
                ARRAY['ficha_clinica', 'acceder'],
                ARRAY['ficha_clinica', 'ver_fichas'],
                ARRAY['ficha_clinica', 'ver_datos_admin'],
                ARRAY['ficha_clinica', 'ver_datos_clinicos'],
                ARRAY['ficha_clinica', 'editar'],
                ARRAY['ficha_clinica', 'subir_documentos'],
                ARRAY['ficha_clinica', 'descargar_imprimir'],
                ARRAY['estadisticas',  'acceder'],
                ARRAY['estadisticas',  'crear_tableros'],
                ARRAY['estadisticas',  'editar_propios'],
                ARRAY['estadisticas',  'duplicar'],
                ARRAY['configuracion', 'acceder'],
                ARRAY['configuracion', 'gestionar_servicios'],
                ARRAY['configuracion', 'gestionar_plantillas'],
                ARRAY['configuracion', 'ver_usuarios'],
                ARRAY['configuracion', 'crear_usuarios']
            ];

        WHEN 'medico' THEN
            permisos := ARRAY[
                ARRAY['agenda',        'acceder'],
                ARRAY['agenda',        'ver_solo_propia'],
                ARRAY['agenda',        'crear_modificar_citas'],
                ARRAY['agenda',        'cancelar_citas'],
                ARRAY['agenda',        'marcar_asistencia'],
                ARRAY['crm',           'acceder'],
                ARRAY['crm',           'ver_solo_asignados'],
                ARRAY['crm',           'crear_editar_tareas'],
                ARRAY['ficha_clinica', 'acceder'],
                ARRAY['ficha_clinica', 'ver_fichas'],
                ARRAY['ficha_clinica', 'ver_solo_propias'],
                ARRAY['ficha_clinica', 'ver_datos_clinicos'],
                ARRAY['ficha_clinica', 'editar'],
                ARRAY['ficha_clinica', 'ver_notas_privadas'],
                ARRAY['ficha_clinica', 'subir_documentos'],
                ARRAY['ficha_clinica', 'descargar_imprimir'],
                ARRAY['estadisticas',  'acceder']
            ];

        WHEN 'asistente' THEN
            permisos := ARRAY[
                ARRAY['agenda',        'acceder'],
                ARRAY['agenda',        'ver_agenda_asignada'],
                ARRAY['agenda',        'crear_modificar_citas'],
                ARRAY['agenda',        'cancelar_citas'],
                ARRAY['agenda',        'ver_estado_pago'],
                ARRAY['agenda',        'marcar_asistencia'],
                ARRAY['crm',           'acceder'],
                ARRAY['crm',           'ver_todos'],
                ARRAY['crm',           'crear_editar'],
                ARRAY['crm',           'cambiar_etapa'],
                ARRAY['crm',           'marcar_ganado_perdido'],
                ARRAY['crm',           'crear_editar_tareas'],
                ARRAY['ficha_clinica', 'acceder'],
                ARRAY['ficha_clinica', 'ver_fichas'],
                ARRAY['ficha_clinica', 'ver_datos_admin'],
                ARRAY['ficha_clinica', 'subir_documentos'],
                ARRAY['estadisticas',  'acceder']
            ];

        WHEN 'enfermera_tens' THEN
            permisos := ARRAY[
                ARRAY['agenda',        'acceder'],
                ARRAY['agenda',        'ver_agenda_asignada'],
                ARRAY['agenda',        'marcar_asistencia'],
                ARRAY['ficha_clinica', 'acceder'],
                ARRAY['ficha_clinica', 'ver_fichas'],
                ARRAY['ficha_clinica', 'ver_datos_clinicos'],
                ARRAY['ficha_clinica', 'subir_documentos']
            ];

        WHEN 'externo' THEN
            permisos := ARRAY[
                ARRAY['estadisticas',  'acceder']
            ];

        ELSE
            -- rol desconocido: sin permisos
            RETURN;
    END CASE;

    -- Insertar cada par módulo/permiso
    FOREACH par SLICE 1 IN ARRAY permisos LOOP
        INSERT INTO public.mpaci_permisos_usuario
            (empresa_id, usuario_id, modulo, permiso, otorgado_por)
        VALUES
            (p_empresa_id, p_usuario_id, par[1], par[2], p_otorgado_por)
        ON CONFLICT (usuario_id, modulo, permiso) DO NOTHING;
    END LOOP;
END;
$$;

-- ------------------------------------------------------------
-- 5. BACKFILL: siembra permisos para usuarios ya existentes
-- ------------------------------------------------------------
DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN
        SELECT id, empresa_id, rol FROM public.mpaci_usuarios
        WHERE empresa_id IS NOT NULL
    LOOP
        PERFORM public.seed_permisos_por_rol(u.id, u.empresa_id, u.rol::app_role, NULL);
    END LOOP;
END;
$$;

-- ------------------------------------------------------------
-- COMENTARIOS
-- ------------------------------------------------------------
COMMENT ON TABLE public.mpaci_permisos_usuario IS
    'Permisos granulares por usuario y módulo. Ref: "Usuarios y Permisos V6".
     Solo el admin_general puede modificar. Plantillas por rol en seed_permisos_por_rol().';

COMMENT ON TABLE public.mpaci_asignaciones_medico IS
    'Relación n:m asistente ↔ médico. Define qué médicos ve un asistente
     cuando tiene el permiso agenda.ver_agenda_asignada.';

COMMENT ON FUNCTION public.tiene_permiso IS
    'Helper SECURITY DEFINER para RLS de otros módulos. admin_general siempre true.';

COMMENT ON FUNCTION public.seed_permisos_por_rol IS
    'Siembra permisos base según plantilla de rol. Llamar al crear/invitar usuario.';

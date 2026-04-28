-- ============================================================
-- Migración: 00042_deprecate_gerente.sql
-- Descripción: Deprecate definitivo del rol 'gerente'. Doc V6
--   no lo incluye. Se mapean usuarios existentes a 'admin'
--   (comportamiento equivalente en RLS) y se actualizan las
--   políticas 00011 y 00027 para no mencionar gerente.
-- Nota: PostgreSQL no soporta DROP VALUE en ENUM, así que
--   dejamos el valor pero sin referencias en policies.
-- Módulo: Usuarios y Permisos
-- Sprint: Ola C — Saneamiento
-- ============================================================

-- ============================================================
-- 1. Backfill: migrar usuarios con rol 'gerente' a 'admin'
-- ============================================================
UPDATE public.mpaci_usuarios
SET rol = 'admin'
WHERE rol::text = 'gerente';

-- ============================================================
-- 2. Actualizar policies que aún mencionan 'gerente'
-- ============================================================

-- mpaci_citas (00001)
DROP POLICY IF EXISTS "Medicos ven sus propias citas" ON public.mpaci_citas;
CREATE POLICY "Medicos ven sus propias citas"
    ON public.mpaci_citas FOR SELECT
    USING (
        auth.uid() = medico_id
        OR EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente')
        )
    );

-- mpaci_contactos (00011) — quitar gerente
DROP POLICY IF EXISTS "Staff gestiona contactos de su empresa" ON public.mpaci_contactos;
CREATE POLICY "Staff gestiona contactos de su empresa"
    ON public.mpaci_contactos FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'sistema')
        )
    );

-- mpaci_prospectos
DROP POLICY IF EXISTS "Staff ve prospectos de su empresa" ON public.mpaci_prospectos;
CREATE POLICY "Staff ve prospectos de su empresa"
    ON public.mpaci_prospectos FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'externo')
        )
    );

DROP POLICY IF EXISTS "Staff gestiona prospectos de su empresa" ON public.mpaci_prospectos;
CREATE POLICY "Staff gestiona prospectos de su empresa"
    ON public.mpaci_prospectos FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente')
        )
    );

-- mpaci_actividades
DROP POLICY IF EXISTS "Staff ve actividades de su empresa" ON public.mpaci_actividades;
CREATE POLICY "Staff ve actividades de su empresa"
    ON public.mpaci_actividades FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'medico', 'enfermera_tens')
        )
    );

DROP POLICY IF EXISTS "Staff gestiona actividades de su empresa" ON public.mpaci_actividades;
CREATE POLICY "Staff gestiona actividades de su empresa"
    ON public.mpaci_actividades FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'medico', 'enfermera_tens')
        )
    );

-- mpaci_bitacora
DROP POLICY IF EXISTS "Staff ve bitacora de su empresa" ON public.mpaci_bitacora;
CREATE POLICY "Staff ve bitacora de su empresa"
    ON public.mpaci_bitacora FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'medico', 'enfermera_tens')
        )
    );

DROP POLICY IF EXISTS "Staff inserta en bitacora de su empresa" ON public.mpaci_bitacora;
CREATE POLICY "Staff inserta en bitacora de su empresa"
    ON public.mpaci_bitacora FOR INSERT
    WITH CHECK (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'sistema')
        )
    );

-- mpaci_bloques_horarios
DROP POLICY IF EXISTS "Staff gestiona agenda de su empresa" ON public.mpaci_bloques_horarios;
CREATE POLICY "Staff gestiona agenda de su empresa"
    ON public.mpaci_bloques_horarios FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente')
        )
    );

-- mpaci_fichas_clinicas (00002)
DROP POLICY IF EXISTS "Ver fichas clinicas" ON public.mpaci_fichas_clinicas;
CREATE POLICY "Ver fichas clinicas"
    ON public.mpaci_fichas_clinicas FOR SELECT
    USING (
        auth.uid() = medico_id
        OR EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin')
        )
    );

DROP POLICY IF EXISTS "Ver anotaciones" ON public.mpaci_anotaciones_clinicas;
CREATE POLICY "Ver anotaciones"
    ON public.mpaci_anotaciones_clinicas FOR SELECT
    USING (
        auth.uid() = medico_id
        OR EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin')
        )
    );

COMMENT ON TYPE app_role IS
    'Roles base Mi-Paciente. Valores VIGENTES: admin_general, admin, medico,
     asistente, enfermera_tens, externo, sistema.
     DEPRECATED (no usar, sin referencias en RLS desde 00042): gerente.
     PostgreSQL no soporta DROP VALUE en ENUM, por eso se mantiene el valor
     pero sin uso.';

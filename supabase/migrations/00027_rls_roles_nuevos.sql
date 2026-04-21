-- ============================================================
-- Migración: 00027_rls_roles_nuevos.sql
-- Descripción: Actualiza políticas RLS legacy para incluir
--   los roles nuevos (enfermera_tens, externo) donde corresponda.
--   Alinea el acceso según doc Usuarios y Permisos V6.
--
-- Principio: RLS abre la puerta (SELECT), Server Actions
--   con check_permission() controlan la granularidad fina.
-- ============================================================

-- ============================================================
-- MAPA DE ACCESO POR ROL (según doc V6)
-- ============================================================
-- admin_general : TODO
-- admin         : TODO excepto permisos
-- medico        : Agenda propia, Ficha Clínica, Contactos (lectura)
-- asistente     : CRM, Agenda completa, Contactos, Tareas
-- enfermera_tens: Contactos (lectura), Ficha (lectura), Agenda (lectura)
-- externo       : CRM (lectura), Contactos (lectura básica)
-- sistema       : Bitácora, Timeline, Mensajes
-- ============================================================

-- ============================================================
-- 1. mpaci_contactos — Todos los roles necesitan ver contactos
-- ============================================================
-- La política actual (00011) solo permite: admin, asistente, gerente, sistema
-- Necesitamos agregar: medico, enfermera_tens, externo, admin_general

DROP POLICY IF EXISTS "Staff accede contactos de su empresa" ON public.mpaci_contactos;

-- SELECT: todos los roles ven contactos de su empresa
CREATE POLICY "Staff ve contactos de su empresa"
    ON public.mpaci_contactos FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
    );

-- INSERT/UPDATE/DELETE: roles operativos + admin
CREATE POLICY "Staff gestiona contactos de su empresa"
    ON public.mpaci_contactos FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'gerente', 'sistema')
        )
    );

-- ============================================================
-- 2. mpaci_prospectos — CRM: comerciales + externo (lectura)
-- ============================================================
DROP POLICY IF EXISTS "Staff ve prospectos de su empresa" ON public.mpaci_prospectos;

-- SELECT: comerciales + externo pueden ver
CREATE POLICY "Staff ve prospectos de su empresa"
    ON public.mpaci_prospectos FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'gerente', 'externo')
        )
    );

-- INSERT/UPDATE/DELETE: solo roles comerciales operativos
CREATE POLICY "Staff gestiona prospectos de su empresa"
    ON public.mpaci_prospectos FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'gerente')
        )
    );

-- ============================================================
-- 3. mpaci_actividades — Tareas: agregar enfermera + contacto_id
-- ============================================================
DROP POLICY IF EXISTS "Staff ve actividades de su empresa" ON public.mpaci_actividades;
DROP POLICY IF EXISTS "Staff gestiona actividades de su empresa" ON public.mpaci_actividades;

-- SELECT: comerciales + clínicos (enfermera puede tener tareas clínicas asignadas)
CREATE POLICY "Staff ve actividades de su empresa"
    ON public.mpaci_actividades FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'gerente', 'medico', 'enfermera_tens')
        )
    );

-- INSERT/UPDATE/DELETE: quienes crean y gestionan tareas
CREATE POLICY "Staff gestiona actividades de su empresa"
    ON public.mpaci_actividades FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'gerente', 'medico', 'enfermera_tens')
        )
    );

-- ============================================================
-- 4. mpaci_bitacora — Agregar nuevos roles a lectura
-- ============================================================
DROP POLICY IF EXISTS "Staff ve bitacora de su empresa" ON public.mpaci_bitacora;
DROP POLICY IF EXISTS "Insertar en bitacora de su empresa" ON public.mpaci_bitacora;

CREATE POLICY "Staff ve bitacora de su empresa"
    ON public.mpaci_bitacora FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'gerente', 'medico', 'enfermera_tens')
        )
    );

CREATE POLICY "Staff inserta en bitacora de su empresa"
    ON public.mpaci_bitacora FOR INSERT
    WITH CHECK (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'gerente', 'sistema')
        )
    );

-- ============================================================
-- 5. mpaci_citas — Agregar enfermera_tens a visibilidad
-- ============================================================
-- La política actual (00011) ya es abierta por empresa_id para SELECT.
-- Pero no tiene política de INSERT/UPDATE que incluya enfermera_tens.
-- Enfermera puede necesitar marcar asistencia, etc.
-- Eso se controla con check_permission() en Server Actions.
-- RLS solo necesita dejarla pasar.

-- La política de SELECT ya está abierta (solo empresa_id), OK.
-- No modificamos citas — el control fino está en Server Actions.

-- ============================================================
-- 6. mpaci_fichas_clinicas — Enfermera ve fichas
-- ============================================================
-- La política de SELECT ya está abierta (solo empresa_id) desde 00011.
-- INSERT sigue restringido a medico_id match — correcto.
-- Enfermera no crea fichas, solo las ve. OK sin cambios.

-- ============================================================
-- 7. mpaci_bloques_horarios — Agregar roles nuevos
-- ============================================================
DROP POLICY IF EXISTS "Staff ve bloques de su empresa" ON public.mpaci_bloques_horarios;
DROP POLICY IF EXISTS "Staff gestiona agenda de su empresa" ON public.mpaci_bloques_horarios;
DROP POLICY IF EXISTS "Medicos gestionan sus bloques" ON public.mpaci_bloques_horarios;

-- SELECT: todos en la empresa ven los bloques
CREATE POLICY "Staff ve bloques de su empresa"
    ON public.mpaci_bloques_horarios FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
    );

-- Gestión de agenda: roles operativos
CREATE POLICY "Staff gestiona agenda de su empresa"
    ON public.mpaci_bloques_horarios FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin', 'asistente', 'gerente')
        )
    );

-- Médicos gestionan sus propios bloques
CREATE POLICY "Medicos gestionan sus bloques"
    ON public.mpaci_bloques_horarios FOR ALL
    USING (auth.uid() = medico_id);

-- ============================================================
-- 8. mpaci_servicios — Agregar admin_general
-- ============================================================
DROP POLICY IF EXISTS "Admin gestiona servicios de su empresa" ON public.mpaci_servicios;

CREATE POLICY "Admin gestiona servicios de su empresa"
    ON public.mpaci_servicios FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol IN ('admin_general', 'admin')
        )
    );

-- ============================================================
-- 9. mpaci_usuarios — Agregar admin_general a gestión
-- ============================================================
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "Staff ve perfiles de su empresa" ON public.mpaci_usuarios;

-- Todos ven perfiles de su empresa (necesario para mostrar nombres en UI)
CREATE POLICY "Staff ve perfiles de su empresa"
    ON public.mpaci_usuarios FOR SELECT
    USING (
        -- Ver su propio perfil siempre
        auth.uid() = id
        OR (
            empresa_id IS NOT NULL
            AND empresa_id = get_my_empresa_id()
        )
    );

-- Solo admin_general y admin pueden modificar usuarios
CREATE POLICY "Admin gestiona usuarios de su empresa"
    ON public.mpaci_usuarios FOR ALL
    USING (
        -- Puede editar su propio perfil
        auth.uid() = id
        OR (
            empresa_id IS NOT NULL
            AND empresa_id = get_my_empresa_id()
            AND EXISTS (
                SELECT 1 FROM public.mpaci_usuarios
                WHERE id = auth.uid()
                AND rol IN ('admin_general', 'admin')
            )
        )
    );

-- ============================================================
-- RESUMEN DE ACCESO RESULTANTE
-- ============================================================
-- ┌──────────────────┬────────┬───────┬────────┬──────────┬──────────────┬─────────┬─────────┐
-- │ Tabla            │ a_gen  │ admin │ medico │ asistente│ enfermera_t  │ externo │ sistema │
-- ├──────────────────┼────────┼───────┼────────┼──────────┼──────────────┼─────────┼─────────┤
-- │ contactos (R)    │   ✅   │  ✅   │  ✅    │   ✅     │     ✅       │   ✅    │   ✅    │
-- │ contactos (W)    │   ✅   │  ✅   │  ❌    │   ✅     │     ❌       │   ❌    │   ✅    │
-- │ prospectos (R)   │   ✅   │  ✅   │  ❌    │   ✅     │     ❌       │   ✅    │   ❌    │
-- │ prospectos (W)   │   ✅   │  ✅   │  ❌    │   ✅     │     ❌       │   ❌    │   ❌    │
-- │ actividades (RW) │   ✅   │  ✅   │  ✅    │   ✅     │     ✅       │   ❌    │   ❌    │
-- │ citas (R)        │   ✅   │  ✅   │  ✅    │   ✅     │     ✅       │   ✅    │   ✅    │
-- │ fichas (R)       │   ✅   │  ✅   │  ✅    │   ✅     │     ✅       │   ✅    │   ✅    │
-- │ fichas (W)       │   ❌   │  ❌   │  ✅*   │   ❌     │     ❌       │   ❌    │   ❌    │
-- │ bloques (R)      │   ✅   │  ✅   │  ✅    │   ✅     │     ✅       │   ✅    │   ✅    │
-- │ bloques (W)      │   ✅   │  ✅   │  ✅**  │   ✅     │     ❌       │   ❌    │   ❌    │
-- │ bitacora (R)     │   ✅   │  ✅   │  ✅    │   ✅     │     ✅       │   ❌    │   ❌    │
-- │ servicios (W)    │   ✅   │  ✅   │  ❌    │   ❌     │     ❌       │   ❌    │   ❌    │
-- └──────────────────┴────────┴───────┴────────┴──────────┴──────────────┴─────────┴─────────┘
-- * medico: solo SUS fichas, con lock 24h
-- ** medico: solo SUS bloques
-- Tablas nuevas (00023-00024): ya tienen SELECT abierto por empresa_id

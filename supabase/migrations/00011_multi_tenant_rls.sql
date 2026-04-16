-- Migración: 00011_multi_tenant_rls.sql
-- Descripción: Actualización de políticas RLS para soporte multi-tenant.
-- Objetivo: Asegurar que los usuarios solo accedan a datos de su propia empresa.

-- 1. Contactos
DROP POLICY IF EXISTS "Accesos a contactos para staff" ON public.mpaci_contactos;
CREATE POLICY "Staff accede contactos de su empresa" ON public.mpaci_contactos FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente', 'sistema')
        )
    );

-- 2. Servicios
DROP POLICY IF EXISTS "Staff lee servicios" ON public.mpaci_servicios;
CREATE POLICY "Staff lee servicios de su empresa" ON public.mpaci_servicios FOR SELECT
    USING (
        empresa_id IS NOT NULL 
        AND empresa_id = get_my_empresa_id()
    );

DROP POLICY IF EXISTS "Admin gestiona servicios" ON public.mpaci_servicios;
CREATE POLICY "Admin gestiona servicios de su empresa" ON public.mpaci_servicios FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- 3. Citas
DROP POLICY IF EXISTS "Medicos ven sus propias citas" ON public.mpaci_citas;
CREATE POLICY "Staff ve citas de su empresa" ON public.mpaci_citas FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
    );

-- 4. Prospectos
DROP POLICY IF EXISTS "Accesos a prospectos para comerciales" ON public.mpaci_prospectos;
CREATE POLICY "Staff ve prospectos de su empresa" ON public.mpaci_prospectos FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')
        )
    );

-- 5. Usuarios (Perfiles)
-- Los usuarios ya tienen su propia política por ID, pero añadimos filtro de empresa para otros staff
DROP POLICY IF EXISTS "Admins ven todos los perfiles" ON public.mpaci_usuarios;
CREATE POLICY "Staff ve perfiles de su empresa" ON public.mpaci_usuarios FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
    );

-- 6. Fichas Clínicas
DROP POLICY IF EXISTS "Ver fichas clinicas" ON public.mpaci_fichas_clinicas;
CREATE POLICY "Staff ve fichas de su empresa" ON public.mpaci_fichas_clinicas FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
    );

DROP POLICY IF EXISTS "Medicos crean ficha" ON public.mpaci_fichas_clinicas;
CREATE POLICY "Medicos crean ficha en su empresa" ON public.mpaci_fichas_clinicas FOR INSERT
    WITH CHECK (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND auth.uid() = medico_id
    );

-- 7. Bloques Horarios
DROP POLICY IF EXISTS "Visibilidad bloques horarios" ON public.mpaci_bloques_horarios;
CREATE POLICY "Staff ve bloques de su empresa" ON public.mpaci_bloques_horarios FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
    );

DROP POLICY IF EXISTS "Staff gestiona agenda" ON public.mpaci_bloques_horarios;
CREATE POLICY "Staff gestiona agenda de su empresa" ON public.mpaci_bloques_horarios FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')
        )
    );

-- 8. Empresas
DROP POLICY IF EXISTS "Usuarios ven su propia empresa" ON public.mpaci_empresas;
CREATE POLICY "Usuarios ven su propia empresa" ON public.mpaci_empresas FOR SELECT
    USING (
        id = get_my_empresa_id()
    );

-- 9. Sucursales
DROP POLICY IF EXISTS "Usuarios ven sucursales de su empresa" ON public.mpaci_sucursales;
CREATE POLICY "Usuarios ven sucursales de su empresa" ON public.mpaci_sucursales FOR SELECT
    USING (
        empresa_id IS NOT NULL 
        AND empresa_id = get_my_empresa_id()
    );

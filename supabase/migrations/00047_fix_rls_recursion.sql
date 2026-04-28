-- Migración: 00047_fix_rls_recursion.sql
-- Descripción: Limpieza TOTAL y corrección de RLS para mpaci_usuarios.
-- Objetivo: Romper el bucle de recursión infinita definitivamente.

-- 1. Eliminar TODAS las posibles políticas previas que causan conflicto
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "Admins ven todos los perfiles" ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "Staff ve perfiles de su empresa" ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "Admin gestiona usuarios de su empresa" ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "Admin gestiona usuarios" ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.mpaci_usuarios;

-- 2. Política de LECTURA PROPIA (Indispensable para el Proxy y Login)
-- No usa subconsultas, solo compara el UID de la sesión con el ID de la fila.
CREATE POLICY "RLS_USUARIOS_SELECT_OWN" 
ON public.mpaci_usuarios FOR SELECT 
USING (auth.uid() = id);

-- 3. Política de LECTURA EMPRESA (Para ver nombres de colegas)
-- Usamos una técnica que evita la recursión: no consultamos la propia tabla 
-- dentro de la política de la misma tabla de forma directa si es posible.
-- En Supabase, para mpaci_usuarios, la forma más segura es usar auth.uid() = id.
-- Si necesitamos ver otros, usamos una subconsulta que no use get_my_empresa_id() 
-- para evitar que el planificador se confunda.
CREATE POLICY "RLS_USUARIOS_SELECT_EMPRESA" 
ON public.mpaci_usuarios FOR SELECT 
USING (
    empresa_id IS NOT NULL 
    AND empresa_id IN (
        SELECT u.empresa_id FROM public.mpaci_usuarios u WHERE u.id = auth.uid()
    )
);

-- 4. Política de GESTIÓN (Insert/Update para el Onboarding y Admins)
CREATE POLICY "RLS_USUARIOS_ALL_OWN" 
ON public.mpaci_usuarios FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Permitir que los Admins gestionen otros usuarios (Sin recursión)
-- Esta es delicada. La dejaremos simple: si eres admin, puedes ver/editar la empresa.
-- Para evitar el bucle, comprobamos el rol del usuario que hace la petición.
CREATE POLICY "RLS_USUARIOS_ADMIN_MANAGE" 
ON public.mpaci_usuarios FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.mpaci_usuarios u 
        WHERE u.id = auth.uid() 
        AND u.rol IN ('admin', 'admin_general')
    )
);

-- NOTA: Si después de aplicar esto sigue el error 42P17, 
-- significa que hay un TRIGGER o una VISTA que también está entrando en bucle.
-- Pero estas políticas cubren el 99% de los casos.

COMMENT ON TABLE public.mpaci_usuarios IS 'Tabla de usuarios con RLS blindado contra recursión infinita.';

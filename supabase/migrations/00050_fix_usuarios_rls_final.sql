-- Migración: 00050_fix_usuarios_rls_final.sql
-- Descripción: Fix definitivo de RLS en mpaci_usuarios.
-- Problema: Las policies de 00047 usaban subqueries directas a mpaci_usuarios,
--           causando recursión infinita en PostgreSQL. Resultado: las queries
--           a otros usuarios devolvían 0 filas silenciosamente.
-- Solución: Usar get_my_empresa_id() (SECURITY DEFINER, de 00010) que bypasea RLS
--           para obtener la empresa del usuario actual, y get_my_rol() nueva.

-- ─── 1. Helper: obtener rol del usuario actual (SECURITY DEFINER) ────
CREATE OR REPLACE FUNCTION public.get_my_rol()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT rol::text FROM public.mpaci_usuarios WHERE id = auth.uid();
$$;

-- ─── 2. Borrar todas las policies previas de mpaci_usuarios ──────────
DROP POLICY IF EXISTS "RLS_USUARIOS_SELECT_OWN"      ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "RLS_USUARIOS_SELECT_EMPRESA"   ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "RLS_USUARIOS_ALL_OWN"          ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "RLS_USUARIOS_ADMIN_MANAGE"     ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "Admins ven todos los perfiles" ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "Staff ve perfiles de su empresa" ON public.mpaci_usuarios;

-- ─── 2b. Borrar también los nombres que esta migración crea ──────────
DROP POLICY IF EXISTS "usuarios_select_own"      ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "usuarios_select_empresa"  ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "usuarios_update_own"      ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "usuarios_admin_manage"    ON public.mpaci_usuarios;
DROP POLICY IF EXISTS "usuarios_insert_self"     ON public.mpaci_usuarios;

-- ─── 3. Nuevas policies SIN recursión ────────────────────────────────

-- 3a. Lectura propia (base case — sin subqueries)
CREATE POLICY "usuarios_select_own"
ON public.mpaci_usuarios FOR SELECT
USING (auth.uid() = id);

-- 3b. Lectura de colegas de la misma empresa (usa SECURITY DEFINER)
CREATE POLICY "usuarios_select_empresa"
ON public.mpaci_usuarios FOR SELECT
USING (
    empresa_id IS NOT NULL
    AND empresa_id = get_my_empresa_id()
);

-- 3c. Cada usuario puede editar su propio perfil (onboarding, avatar, etc.)
CREATE POLICY "usuarios_update_own"
ON public.mpaci_usuarios FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3d. Admins pueden gestionar todos los usuarios de su empresa
CREATE POLICY "usuarios_admin_manage"
ON public.mpaci_usuarios FOR ALL
USING (
    get_my_rol() IN ('admin', 'admin_general')
    AND empresa_id = get_my_empresa_id()
)
WITH CHECK (
    get_my_rol() IN ('admin', 'admin_general')
    AND empresa_id = get_my_empresa_id()
);

-- 3e. El trigger handle_new_user necesita INSERT sin restricción de empresa
--     (el usuario aún no tiene empresa_id al crearse)
CREATE POLICY "usuarios_insert_self"
ON public.mpaci_usuarios FOR INSERT
WITH CHECK (auth.uid() = id);

COMMENT ON TABLE public.mpaci_usuarios IS
  'Tabla de usuarios. RLS v3 (00050): usa get_my_empresa_id() y get_my_rol() SECURITY DEFINER para evitar recursión.';

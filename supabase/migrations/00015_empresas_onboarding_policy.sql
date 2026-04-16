-- Migración: 00015_empresas_onboarding_policy.sql
-- Descripción: Corrige el RLS de mpaci_empresas para que el wizard de onboarding
--              pueda listar las clínicas disponibles.
-- Problema: La política anterior solo permitía ver la empresa del usuario (id = get_my_empresa_id()).
--           Un usuario nuevo tiene empresa_id = NULL, por lo que get_my_empresa_id() devuelve NULL,
--           y la condición id = NULL es NULL (no TRUE). La lista de clínicas aparecía vacía.

-- ============================================================
-- REEMPLAZAR política de SELECT en mpaci_empresas
-- ============================================================

DROP POLICY IF EXISTS "Usuarios ven su propia empresa" ON public.mpaci_empresas;
DROP POLICY IF EXISTS "Usuarios ven su empresa asignada" ON public.mpaci_empresas;
DROP POLICY IF EXISTS "Onboarding puede listar empresas" ON public.mpaci_empresas;

-- Política 1: usuario con empresa asignada ve SOLO su empresa
CREATE POLICY "Usuarios ven su empresa asignada" ON public.mpaci_empresas FOR SELECT
    USING (
        get_my_empresa_id() IS NOT NULL
        AND id = get_my_empresa_id()
    );

-- Política 2: usuario autenticado SIN empresa (onboarding) ve lista de empresas activas
-- Solo expone empresas activas. El usuario puede ver nombre y slug para elegir.
-- No expone plan_suscripcion ni datos financieros.
CREATE POLICY "Onboarding lista empresas activas" ON public.mpaci_empresas FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND get_my_empresa_id() IS NULL
        AND activo = true
    );

COMMENT ON POLICY "Onboarding lista empresas activas" ON public.mpaci_empresas IS
    'Permite a usuarios en proceso de onboarding (empresa_id = NULL) ver la lista de clínicas
     activas para completar el wizard. Solo aplica a usuarios autenticados sin empresa asignada.';

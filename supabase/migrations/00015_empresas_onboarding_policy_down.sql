-- Rollback: 00015_empresas_onboarding_policy_down.sql

DROP POLICY IF EXISTS "Usuarios ven su empresa asignada" ON public.mpaci_empresas;
DROP POLICY IF EXISTS "Onboarding lista empresas activas" ON public.mpaci_empresas;

-- Restaurar política original de 00011
DROP POLICY IF EXISTS "Usuarios ven su propia empresa" ON public.mpaci_empresas;
CREATE POLICY "Usuarios ven su propia empresa" ON public.mpaci_empresas FOR SELECT
    USING (id = get_my_empresa_id());

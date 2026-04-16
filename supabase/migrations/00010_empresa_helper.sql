-- Migración: 00010_empresa_helper.sql
-- Descripción: Función auxiliar para obtener la empresa del usuario actual.
-- Objetivo: Simplificar las políticas RLS y mejorar el rendimiento.

CREATE OR REPLACE FUNCTION public.get_my_empresa_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT empresa_id FROM public.mpaci_usuarios WHERE id = auth.uid();
$$;

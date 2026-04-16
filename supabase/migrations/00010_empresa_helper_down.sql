-- Migración: 00010_empresa_helper_down.sql
-- Descripción: Eliminar la función auxiliar get_my_empresa_id.

DROP FUNCTION IF EXISTS public.get_my_empresa_id();

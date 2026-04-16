-- Migración: 00011_multi_tenant_rls_down.sql
-- Descripción: Revertir las políticas RLS al estado de Sprint 1.

-- Nota: Este script debe ser ajustado manualmente si las políticas exactas de Sprint 1 cambiaron.
-- Se recomienda revisar 00001_cimientos_base.sql para los Using originales.

DROP POLICY IF EXISTS "Staff accede contactos de su empresa" ON public.mpaci_contactos;
DROP POLICY IF EXISTS "Staff lee servicios de su empresa" ON public.mpaci_servicios;
DROP POLICY IF EXISTS "Admin gestiona servicios de su empresa" ON public.mpaci_servicios;
DROP POLICY IF EXISTS "Staff ve citas de su empresa" ON public.mpaci_citas;
DROP POLICY IF EXISTS "Staff ve prospectos de su empresa" ON public.mpaci_prospectos;
DROP POLICY IF EXISTS "Staff ve perfiles de su empresa" ON public.mpaci_usuarios;

-- (Opcional: Re-crear las políticas de 00001 aquí si es necesario un retroceso total)

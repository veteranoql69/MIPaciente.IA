-- Migración: 00007_empresas_down.sql
-- Descripción: Revertir la creación de la tabla de empresas.

DROP TABLE IF EXISTS public.mpaci_empresas CASCADE;

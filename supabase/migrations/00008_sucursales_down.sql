-- Migración: 00008_sucursales_down.sql
-- Descripción: Revertir la creación de la tabla de sucursales.

DROP TABLE IF EXISTS public.mpaci_sucursales CASCADE;

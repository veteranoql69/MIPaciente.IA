-- Migración: 00019_slug_lowercase.sql
-- Descripción: Fuerza que el slug de empresa sea siempre lowercase.
-- Problema: seed.sql tenía slug = 'Urbamed' (con mayúscula). Las URLs son lowercase
--           (ej: /urbamed/agenda), por lo que el lookup en middleware falla.

-- ============================================================
-- 1. BACKFILL: normalizar slugs existentes a lowercase
-- ============================================================

UPDATE public.mpaci_empresas
SET slug = lower(slug)
WHERE slug != lower(slug);

-- ============================================================
-- 2. CONSTRAINT: prevenir slugs con mayúsculas en el futuro
-- ============================================================

ALTER TABLE public.mpaci_empresas
    ADD CONSTRAINT mpaci_empresas_slug_lowercase
        CHECK (slug = lower(slug));

-- ============================================================
-- 3. CONSTRAINT: prevenir slugs con espacios o caracteres especiales
--    Solo permitir: letras minúsculas, números, guiones
-- ============================================================

ALTER TABLE public.mpaci_empresas
    ADD CONSTRAINT mpaci_empresas_slug_format
        CHECK (slug ~ '^[a-z0-9][a-z0-9\-]*[a-z0-9]$' OR slug ~ '^[a-z0-9]$');

COMMENT ON COLUMN public.mpaci_empresas.slug IS
    'Identificador único de la empresa en la URL. Solo minúsculas, números y guiones.
     Ejemplo: "urbamed", "clinica-norte", "manmec". Configurado manualmente por el equipo Mi-Paciente.';

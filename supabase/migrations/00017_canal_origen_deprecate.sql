-- 00017: limpiar ambigüedad canal_origen vs canal_contacto
UPDATE public.mpaci_contactos
SET canal_contacto = canal_origen
WHERE canal_contacto IS NULL AND canal_origen IS NOT NULL;
COMMENT ON COLUMN public.mpaci_contactos.canal_origen IS
    'DEPRECATED desde Sprint 5. Usar canal_contacto. Mantener hasta eliminar referencias en código.';

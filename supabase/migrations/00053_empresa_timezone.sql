-- ============================================================
-- Migración: timezone por empresa
-- Permite que cada empresa opere en su propia zona horaria.
-- Esencial para SaaS multi-país.
-- ============================================================

ALTER TABLE mpaci_empresas
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Santiago';

COMMENT ON COLUMN mpaci_empresas.timezone IS
  'Zona horaria IANA de la empresa (ej: America/Santiago, America/Bogota, Europe/Madrid). '
  'Usada para todos los cálculos de agenda y presentación de fechas.';

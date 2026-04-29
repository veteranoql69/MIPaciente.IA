-- ============================================================
-- Migración: 00049_gcal_tokens.sql
-- Descripción: Agrega columnas para persistir tokens de Google Calendar
--   en mpaci_usuarios. El auth callback las actualiza en cada login.
--   El agente IA las lee para crear/mover/eliminar eventos server-side.
-- ============================================================

ALTER TABLE public.mpaci_usuarios
  ADD COLUMN IF NOT EXISTS gcal_access_token  TEXT,
  ADD COLUMN IF NOT EXISTS gcal_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS gcal_token_expiry  TIMESTAMPTZ;

COMMENT ON COLUMN public.mpaci_usuarios.gcal_access_token  IS 'Token de acceso Google Calendar (corta duración ~1h).';
COMMENT ON COLUMN public.mpaci_usuarios.gcal_refresh_token IS 'Refresh token Google Calendar. Permite renovar access_token server-side sin sesión activa.';
COMMENT ON COLUMN public.mpaci_usuarios.gcal_token_expiry  IS 'Expiración del access_token actual. Renovar cuando now() > gcal_token_expiry.';

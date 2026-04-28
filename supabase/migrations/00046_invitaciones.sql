-- ============================================================
-- Migración: 00046_invitaciones.sql
-- Descripción: Sistema de invitaciones de equipo para onboarding
--   - Tabla mpaci_invitaciones con código de validación 6 dígitos
--   - Código válido 48 horas, single-use
--   - RLS: usuario ve su propia invitación; admin_general crea/lee todas
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mpaci_invitaciones (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id   UUID        NOT NULL REFERENCES public.mpaci_empresas(id) ON DELETE CASCADE,
    email        TEXT        NOT NULL,
    rol          app_role    NOT NULL,
    codigo       TEXT        NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours'),
    usado        BOOLEAN     NOT NULL DEFAULT false,
    usado_en     TIMESTAMPTZ,
    usado_por    UUID        REFERENCES public.mpaci_usuarios(id),
    created_by   UUID        REFERENCES public.mpaci_usuarios(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mpaci_invitaciones ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_invitaciones_email
    ON public.mpaci_invitaciones(email);

CREATE INDEX IF NOT EXISTS idx_invitaciones_empresa
    ON public.mpaci_invitaciones(empresa_id);

CREATE INDEX IF NOT EXISTS idx_invitaciones_activas
    ON public.mpaci_invitaciones(email, usado, expires_at)
    WHERE usado = false;

-- El usuario autenticado puede ver invitaciones enviadas a su email
CREATE POLICY "Usuario ve su propia invitacion"
    ON public.mpaci_invitaciones FOR SELECT
    USING (email = auth.email());

-- Admin puede ver todas las invitaciones de su empresa
CREATE POLICY "Admin ve invitaciones de su empresa"
    ON public.mpaci_invitaciones FOR SELECT
    USING (
        empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol::text IN ('admin_general', 'admin')
        )
    );

-- Admin crea invitaciones (también se usa con service_role en onboarding inicial)
CREATE POLICY "Admin crea invitaciones"
    ON public.mpaci_invitaciones FOR INSERT
    WITH CHECK (
        empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid()
            AND rol::text IN ('admin_general', 'admin')
        )
    );

-- Inmutabilidad: no se eliminan, se marcan como usadas
CREATE POLICY "Invitaciones no eliminables"
    ON public.mpaci_invitaciones FOR DELETE USING (false);

COMMENT ON TABLE public.mpaci_invitaciones IS
    'Invitaciones por email para incorporar equipo a una clínica.
     Código numérico de 6 dígitos, válido 48 horas, single-use.
     Al aceptar: se asigna empresa_id y rol al usuario invitado.';

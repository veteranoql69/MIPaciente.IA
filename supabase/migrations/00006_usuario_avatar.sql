-- Migración: Agrega avatar_url y ultima_sesion a mpaci_usuarios
-- Objetivo: Almacenar foto de perfil (OAuth) y timestamp del último login.

ALTER TABLE public.mpaci_usuarios
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS ultima_sesion TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.mpaci_usuarios.avatar_url IS
    'URL de la foto de perfil del usuario, obtenida del proveedor OAuth (Google).
     Se actualiza automáticamente en cada login via trigger.';

COMMENT ON COLUMN public.mpaci_usuarios.ultima_sesion IS
    'Timestamp del último login exitoso. Sincronizado desde auth.users.last_sign_in_at via trigger.';

-- Actualizar función trigger para incluir avatar_url al crear nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.mpaci_usuarios (id, email, nombre_completo, rol, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        'asistente',
        COALESCE(
            NEW.raw_user_meta_data->>'picture',
            NEW.raw_user_meta_data->>'avatar_url'
        )
    );
    RETURN NEW;
END;
$$;

-- Trigger para actualizar ultima_sesion y avatar_url en cada login
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Solo actúa si last_sign_in_at cambió (es decir, hubo un nuevo login)
    IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
        UPDATE public.mpaci_usuarios
        SET
            ultima_sesion = NEW.last_sign_in_at,
            avatar_url = COALESCE(
                NEW.raw_user_meta_data->>'picture',
                NEW.raw_user_meta_data->>'avatar_url',
                avatar_url  -- mantiene el valor existente si Google no lo devuelve
            )
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_login();

COMMENT ON FUNCTION public.handle_user_login() IS
    'Trigger: actualiza ultima_sesion y avatar_url en mpaci_usuarios cuando GoTrue registra un nuevo login.';

-- Backfill avatar_url y ultima_sesion para usuarios existentes
UPDATE public.mpaci_usuarios mu
SET
    avatar_url = COALESCE(
        au.raw_user_meta_data->>'picture',
        au.raw_user_meta_data->>'avatar_url'
    ),
    ultima_sesion = au.last_sign_in_at
FROM auth.users au
WHERE mu.id = au.id;

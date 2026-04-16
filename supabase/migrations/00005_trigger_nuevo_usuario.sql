-- Migración: Trigger Auto-Creación de Perfil en mpaci_usuarios
-- Objetivo: Cuando GoTrue crea un usuario en auth.users (OAuth, email, etc.),
--           automáticamente crear el perfil operativo en mpaci_usuarios.
-- Convención: Todas las tablas usan prefijo mpaci_

-- 1. FUNCIÓN TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.mpaci_usuarios (id, email, nombre_completo, rol)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        'asistente'
    );
    RETURN NEW;
END;
$$;

-- 2. TRIGGER EN auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. BACKFILL: Crear perfiles para usuarios que ya existen en auth.users
--    pero NO tienen registro en mpaci_usuarios (como tu cuenta carlos@sditecnologia.cl)
INSERT INTO public.mpaci_usuarios (id, email, nombre_completo, rol)
SELECT
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        split_part(au.email, '@', 1)
    ),
    'admin'  -- El primer usuario existente se crea como admin
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.mpaci_usuarios mu WHERE mu.id = au.id
);

-- 4. POLÍTICA: Permitir INSERT desde el trigger (SECURITY DEFINER lo ejecuta como owner)
--    El trigger usa SECURITY DEFINER, por lo que bypasea RLS.
--    No se necesita política adicional.

COMMENT ON FUNCTION public.handle_new_user() IS
    'Trigger: crea perfil en mpaci_usuarios cuando un usuario se registra via GoTrue.
     Extrae nombre de Google OAuth metadata. Rol por defecto: asistente.';

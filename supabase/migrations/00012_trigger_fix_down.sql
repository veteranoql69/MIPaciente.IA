-- Migración: 00012_trigger_fix_down.sql
-- Descripción: Revertir handle_new_user a la versión de Sprint 1.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.mpaci_usuarios (id, email, nombre_completo, rol)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'asistente'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

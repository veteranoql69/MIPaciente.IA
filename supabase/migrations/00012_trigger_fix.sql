-- Migración: 00012_trigger_fix.sql
-- Descripción: Corrección del trigger de nuevo usuario para soportar email nulo y onboarding.
-- Objetivo: Evitar fallos en el login si Google no entrega email y forzar estado de onboarding.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Guard: Google puede omitir email scope en raras ocasiones
    IF NEW.email IS NULL THEN 
        RETURN NEW; 
    END IF;

    INSERT INTO public.mpaci_usuarios (
        id, 
        email, 
        nombre_completo, 
        rol, 
        avatar_url, 
        onboarding_completado
    )
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'asistente',
        COALESCE(NEW.raw_user_meta_data->>'picture', NEW.raw_user_meta_data->>'avatar_url'),
        false
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        nombre_completo = COALESCE(EXCLUDED.nombre_completo, public.mpaci_usuarios.nombre_completo),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.mpaci_usuarios.avatar_url);
    
    RETURN NEW;
END;
$$;

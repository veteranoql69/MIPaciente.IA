-- ============================================================
-- Seed: 00028_seed_usuarios_prueba.sql
-- Descripción: Crea 6 usuarios de prueba en auth.users + les
--   asigna roles y empresa en mpaci_usuarios.
--   Usa Supabase Auth email/password (NO Google OAuth).
--
-- ⚠️ SOLO PARA DESARROLLO. No ejecutar en producción.
--
-- Prerequisito: Ya debe existir al menos 1 empresa en
--   mpaci_empresas (la del onboarding de carlos@).
-- ============================================================

-- ============================================================
-- PASO 1: Obtener empresa_id de la empresa existente
-- ============================================================
-- Usamos la empresa de carlos@ como referencia.
-- Si hay varias empresas, ajustar el WHERE.

DO $$
DECLARE
    v_empresa_id UUID;
    v_user_id UUID;
BEGIN
    -- Obtener la empresa existente
    SELECT id INTO v_empresa_id
    FROM public.mpaci_empresas
    LIMIT 1;

    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'No hay empresas en mpaci_empresas. Ejecuta el onboarding primero.';
    END IF;

    RAISE NOTICE 'Usando empresa_id: %', v_empresa_id;

    -- ============================================================
    -- PASO 2: Crear usuarios en auth.users
    -- ============================================================
    -- Supabase auth.users requiere ciertos campos mínimos.
    -- En Self-Hosted, podemos insertar directamente.
    -- La password se hashea con crypt().

    -- Usuario 2: Admin (no general)
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, role, aud,
        raw_user_meta_data, created_at, updated_at
    ) VALUES (
        uuid_generate_v4(),
        '00000000-0000-0000-0000-000000000000',
        'admin.test@sditecnologia.cl',
        crypt('Test1234!', gen_salt('bf')),
        now(), 'authenticated', 'authenticated',
        '{"full_name": "Admin Test"}'::jsonb,
        now(), now()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_user_id;

    IF v_user_id IS NOT NULL THEN
        UPDATE public.mpaci_usuarios
        SET rol = 'admin', empresa_id = v_empresa_id, onboarding_completado = true
        WHERE id = v_user_id;
        RAISE NOTICE 'Creado: admin.test@ → rol admin → %', v_user_id;
    END IF;

    -- Usuario 3: Médico
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, role, aud,
        raw_user_meta_data, created_at, updated_at
    ) VALUES (
        uuid_generate_v4(),
        '00000000-0000-0000-0000-000000000000',
        'medico.test@sditecnologia.cl',
        crypt('Test1234!', gen_salt('bf')),
        now(), 'authenticated', 'authenticated',
        '{"full_name": "Dr. Médico Test"}'::jsonb,
        now(), now()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_user_id;

    IF v_user_id IS NOT NULL THEN
        UPDATE public.mpaci_usuarios
        SET rol = 'medico', empresa_id = v_empresa_id, onboarding_completado = true
        WHERE id = v_user_id;
        RAISE NOTICE 'Creado: medico.test@ → rol medico → %', v_user_id;
    END IF;

    -- Usuario 4: Asistente
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, role, aud,
        raw_user_meta_data, created_at, updated_at
    ) VALUES (
        uuid_generate_v4(),
        '00000000-0000-0000-0000-000000000000',
        'asistente.test@sditecnologia.cl',
        crypt('Test1234!', gen_salt('bf')),
        now(), 'authenticated', 'authenticated',
        '{"full_name": "Asistente Test"}'::jsonb,
        now(), now()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_user_id;

    IF v_user_id IS NOT NULL THEN
        UPDATE public.mpaci_usuarios
        SET rol = 'asistente', empresa_id = v_empresa_id, onboarding_completado = true
        WHERE id = v_user_id;
        RAISE NOTICE 'Creado: asistente.test@ → rol asistente → %', v_user_id;
    END IF;

    -- Usuario 5: Enfermera/TENS
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, role, aud,
        raw_user_meta_data, created_at, updated_at
    ) VALUES (
        uuid_generate_v4(),
        '00000000-0000-0000-0000-000000000000',
        'enfermera.test@sditecnologia.cl',
        crypt('Test1234!', gen_salt('bf')),
        now(), 'authenticated', 'authenticated',
        '{"full_name": "Enfermera Test"}'::jsonb,
        now(), now()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_user_id;

    IF v_user_id IS NOT NULL THEN
        UPDATE public.mpaci_usuarios
        SET rol = 'enfermera_tens', empresa_id = v_empresa_id, onboarding_completado = true
        WHERE id = v_user_id;
        RAISE NOTICE 'Creado: enfermera.test@ → rol enfermera_tens → %', v_user_id;
    END IF;

    -- Usuario 6: Externo
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, role, aud,
        raw_user_meta_data, created_at, updated_at
    ) VALUES (
        uuid_generate_v4(),
        '00000000-0000-0000-0000-000000000000',
        'externo.test@sditecnologia.cl',
        crypt('Test1234!', gen_salt('bf')),
        now(), 'authenticated', 'authenticated',
        '{"full_name": "Externo Test"}'::jsonb,
        now(), now()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_user_id;

    IF v_user_id IS NOT NULL THEN
        UPDATE public.mpaci_usuarios
        SET rol = 'externo', empresa_id = v_empresa_id, onboarding_completado = true
        WHERE id = v_user_id;
        RAISE NOTICE 'Creado: externo.test@ → rol externo → %', v_user_id;
    END IF;

    -- Usuario 7: Nuevo (sin permisos, simula primer login)
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, role, aud,
        raw_user_meta_data, created_at, updated_at
    ) VALUES (
        uuid_generate_v4(),
        '00000000-0000-0000-0000-000000000000',
        'nuevo.test@sditecnologia.cl',
        crypt('Test1234!', gen_salt('bf')),
        now(), 'authenticated', 'authenticated',
        '{"full_name": "Usuario Nuevo"}'::jsonb,
        now(), now()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_user_id;

    IF v_user_id IS NOT NULL THEN
        -- El trigger handle_new_user() ya le asignó rol 'asistente'.
        -- Lo dejamos SIN empresa_id para simular onboarding pendiente.
        UPDATE public.mpaci_usuarios
        SET onboarding_completado = false
        WHERE id = v_user_id;
        RAISE NOTICE 'Creado: nuevo.test@ → sin empresa (onboarding pendiente) → %', v_user_id;
    END IF;

    -- ============================================================
    -- PASO 3: Elevar carlos@ a admin_general
    -- ============================================================
    UPDATE public.mpaci_usuarios
    SET rol = 'admin_general'
    WHERE email = 'carlos@sditecnologia.cl';

    RAISE NOTICE 'carlos@sditecnologia.cl elevado a admin_general';

END $$;

-- ============================================================
-- VERIFICACIÓN: Listar todos los usuarios de prueba
-- ============================================================
-- Ejecutar después para confirmar:
-- SELECT u.email, u.rol, u.empresa_id, u.onboarding_completado
-- FROM public.mpaci_usuarios u
-- ORDER BY u.rol;

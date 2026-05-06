-- ============================================================
-- RESET COMPLETO + RECARGA STAGING — Clínica Urología Demo
-- ============================================================
-- Qué hace este script:
--   1. Borra todos los datos de negocio
--   2. Recrea empresa "Clínica Urología Demo" con UUIDs fijos
--   3. Eleva usuarios REALES (Google OAuth) por email
--   4. Carga usuarios de staging ficticios
--   5. Carga servicios reales de urología (inspirados en Urbamed)
--   6. Carga 12 pacientes con historias clínicas ricas
--   7. Carga 35+ citas en distintos estados
--   8. Carga fichas clínicas, anotaciones, documentos, pagos
--
-- ⚠️  REQUISITO: Todos los correos reales listados en PASO 0
--     deben haber iniciado sesión con Google al menos una vez.
--
-- Uso: ejecutar completo en SQL Editor de Supabase (service_role)
-- ============================================================

-- ============================================================
-- PASO 0 — Verificar usuario admin principal
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'carlos@sditecnologia.cl'
    ) THEN
        RAISE EXCEPTION 'Usuario carlos@sditecnologia.cl no encontrado en auth.users. Inicia sesión con Google primero.';
    END IF;
    RAISE NOTICE '✓ Admin principal verificado';
END $$;

-- ============================================================
-- PASO 1 — HARD RESET
-- ============================================================
DO $$
DECLARE
    v_tables TEXT[];
    v_existing TEXT;
BEGIN
    v_tables := ARRAY[
        'mpaci_auditoria_citas', 'mpaci_pagos_cita', 'mpaci_equipo_cita',
        'mpaci_cita_pacientes', 'mpaci_cita_procedimientos',
        'mpaci_anotaciones_clinicas', 'mpaci_registros_clinicos', 'mpaci_documentos',
        'mpaci_bitacora', 'mpaci_reasignaciones', 'mpaci_tableros_reportes',
        'mpaci_servicios_config_recursos', 'mpaci_auditoria_permisos',
        'mpaci_citas', 'mpaci_fichas_clinicas', 'mpaci_actividades',
        'mpaci_timeline_eventos', 'mpaci_mensajes_entrantes',
        'mpaci_diagnosticos', 'mpaci_medicamentos_paciente',
        'mpaci_alergias', 'mpaci_cirugias_externas',
        'mpaci_reportes', 'mpaci_tableros', 'mpaci_permisos_tablero',
        'mpaci_prospectos', 'mpaci_campanas', 'mpaci_fuentes_lead',
        'mpaci_permisos_usuario', 'mpaci_asignaciones_medico',
        'mpaci_servicios_config', 'mpaci_servicios_precios', 'mpaci_servicios',
        'mpaci_horarios_excepciones', 'mpaci_horarios_pausas', 'mpaci_horarios_prestador',
        'mpaci_honorarios_bloque', 'mpaci_bloques_horarios', 'mpaci_notas_agenda',
        'mpaci_insumos', 'mpaci_equipamiento', 'mpaci_salas',
        'mpaci_frases_rapidas',
        'mpaci_plantillas_clinicas_versiones', 'mpaci_plantillas_clinicas',
        'mpaci_plantillas_permisos', 'mpaci_invitaciones',
        'mpaci_sucursales', 'mpaci_contactos', 'mpaci_usuarios',
        'mpaci_catalogo_cie10', 'mpaci_catalogo_medicamentos', 'mpaci_empresas'
    ];

    SELECT string_agg('public.' || quote_ident(t), ', ')
    INTO v_existing
    FROM unnest(v_tables) AS t
    WHERE EXISTS (
        SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
    );

    IF v_existing IS NOT NULL THEN
        EXECUTE 'TRUNCATE TABLE ' || v_existing || ' CASCADE';
    END IF;
    RAISE NOTICE '✓ Hard reset completado';
END $$;

-- ============================================================
-- PASO 2 — Empresa + Sucursal
-- ============================================================
INSERT INTO public.mpaci_empresas (id, slug, nombre, plan_suscripcion, activo)
VALUES (
    'd837f400-60b5-4b53-b0df-2b9a71b12345',
    'clinica-urologia-demo',
    'Clínica Urología Demo',
    'pro',
    true
);

INSERT INTO public.mpaci_sucursales (id, empresa_id, nombre, direccion, activo)
VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'd837f400-60b5-4b53-b0df-2b9a71b12345',
    'Sede Las Condes',
    'Av. Las Condes 7700, Of. 307-308A, Las Condes',
    true
);

-- ============================================================
-- PASO 3 — Elevar usuarios REALES (Google OAuth)
--          Se saltea silenciosamente si el usuario no existe aún
-- ============================================================
DO $$
DECLARE
    v_roles TEXT[][] := ARRAY[
        ARRAY['carlos@sditecnologia.cl',        'Carlos Schatloff',       'admin_general'],
        ARRAY['dr.schatloff@urbamed.cl',         'Dr. Schatloff',          'medico'],
        ARRAY['caltamirano@manmec.cl',           'Dr. Cristóbal Altamirano','medico'],
        ARRAY['sditecnologiachile@gmail.com',    'Rosa Vega',              'asistente'],
        ARRAY['tattynailsbeauty@gmail.com',      'María Rojas',            'enfermera_tens']
    ];
    v_entry TEXT[];
    v_user_id UUID;
    v_nombre TEXT;
BEGIN
    FOREACH v_entry SLICE 1 IN ARRAY v_roles LOOP
        SELECT id, COALESCE(
            raw_user_meta_data->>'full_name',
            raw_user_meta_data->>'name',
            v_entry[2]
        )
        INTO v_user_id, v_nombre
        FROM auth.users WHERE email = v_entry[1] LIMIT 1;

        IF v_user_id IS NULL THEN
            RAISE NOTICE '⚠  Usuario % no encontrado — debe iniciar sesión con Google primero', v_entry[1];
            CONTINUE;
        END IF;

        INSERT INTO public.mpaci_usuarios
            (id, email, nombre_completo, empresa_id, rol, onboarding_completado)
        VALUES
            (v_user_id, v_entry[1], v_nombre,
             'd837f400-60b5-4b53-b0df-2b9a71b12345',
             v_entry[3]::app_role, true)
        ON CONFLICT (id) DO UPDATE SET
            nombre_completo       = EXCLUDED.nombre_completo,
            empresa_id            = EXCLUDED.empresa_id,
            rol                   = EXCLUDED.rol::app_role,
            onboarding_completado = EXCLUDED.onboarding_completado;

        PERFORM public.seed_permisos_por_rol(
            v_user_id,
            'd837f400-60b5-4b53-b0df-2b9a71b12345',
            v_entry[3]::app_role,
            NULL
        );
        RAISE NOTICE '✓ Usuario real elevado: % → %', v_nombre, v_entry[3];
    END LOOP;
END $$;

-- ============================================================
-- PASO 4 — Usuarios de staging en auth.users (idempotente)
--          Médico adicional + arsenalera ficticios
-- ============================================================
INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at
)
VALUES
    ('b2000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'dra.miranda@staging.test', now(),
     '{"full_name":"Dra. Carmen Miranda"}', now(), now()),

    ('b2000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'arsenalera.staging@staging.test', now(),
     '{"full_name":"Ana Valentina Ríos"}', now(), now()),

    ('b2000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'tens.staging@staging.test', now(),
     '{"full_name":"Patricia Riquelme TENS"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PASO 5 — Perfiles staging en mpaci_usuarios
-- ============================================================
INSERT INTO public.mpaci_usuarios
    (id, email, nombre_completo, empresa_id, rol, onboarding_completado)
VALUES
    ('b2000000-0000-0000-0000-000000000001', 'dra.miranda@staging.test',
     'Dra. Carmen Miranda', 'd837f400-60b5-4b53-b0df-2b9a71b12345', 'medico', true),

    -- Staging: evitar colisión con Rosa Vega real (sditecnologiachile@gmail.com)
    ('b2000000-0000-0000-0000-000000000002', 'arsenalera.staging@staging.test',
     'Ana Valentina Ríos', 'd837f400-60b5-4b53-b0df-2b9a71b12345', 'enfermera_tens', true),

    -- Staging: evitar colisión con María Rojas real (tattynailsbeauty@gmail.com)
    ('b2000000-0000-0000-0000-000000000003', 'tens.staging@staging.test',
     'Patricia Riquelme TENS', 'd837f400-60b5-4b53-b0df-2b9a71b12345', 'enfermera_tens', true)
ON CONFLICT (id) DO UPDATE SET
    nombre_completo       = EXCLUDED.nombre_completo,
    empresa_id            = EXCLUDED.empresa_id,
    rol                   = EXCLUDED.rol,
    onboarding_completado = EXCLUDED.onboarding_completado;

SELECT public.seed_permisos_por_rol(id, empresa_id, rol::app_role, NULL)
FROM public.mpaci_usuarios
WHERE empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345';

-- ============================================================
-- PASO 6 — Asignaciones asistente ↔ médico
-- ============================================================
DO $$
DECLARE
    v_asistente UUID;
    v_med1 UUID;
    v_med2 UUID;
BEGIN
    SELECT id INTO v_asistente FROM public.mpaci_usuarios
    WHERE email = 'sditecnologiachile@gmail.com' AND empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345' LIMIT 1;

    SELECT id INTO v_med1 FROM public.mpaci_usuarios
    WHERE email = 'dr.schatloff@urbamed.cl' AND empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345' LIMIT 1;

    SELECT id INTO v_med2 FROM public.mpaci_usuarios
    WHERE email = 'caltamirano@manmec.cl' AND empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345' LIMIT 1;

    -- Asistente real → ambos médicos reales (si existen)
    IF v_asistente IS NOT NULL AND v_med1 IS NOT NULL THEN
        INSERT INTO public.mpaci_asignaciones_medico (empresa_id, asistente_id, medico_id, activo)
        VALUES ('d837f400-60b5-4b53-b0df-2b9a71b12345', v_asistente, v_med1, true)
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_asistente IS NOT NULL AND v_med2 IS NOT NULL THEN
        INSERT INTO public.mpaci_asignaciones_medico (empresa_id, asistente_id, medico_id, activo)
        VALUES ('d837f400-60b5-4b53-b0df-2b9a71b12345', v_asistente, v_med2, true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Asistente staging → médico staging
INSERT INTO public.mpaci_asignaciones_medico (empresa_id, asistente_id, medico_id, activo)
VALUES
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     'b2000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000001', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PASO 7 — Salas
-- ============================================================
INSERT INTO public.mpaci_salas (id, empresa_id, sucursal_id, nombre, descripcion, activo)
VALUES
    ('a1000000-0000-0000-0000-000000000001',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Pabellón 1', 'Pabellón principal de cirugía ambulatoria', true),

    ('a1000000-0000-0000-0000-000000000002',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Box Consulta 1', 'Consulta urológica general — Dr. Schatloff', true),

    ('a1000000-0000-0000-0000-000000000003',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Box Consulta 2', 'Consulta urológica — Dr. Altamirano', true),

    ('a1000000-0000-0000-0000-000000000004',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Sala de Procedimientos', 'Cistoscopia, biopsias, LEOC', true);

-- ============================================================
-- PASO 8 — Servicios de Urología (inspirados en Urbamed)
-- ============================================================
INSERT INTO public.mpaci_servicios
    (id, nombre, categoria, es_cirugia, duracion_minutos, precio_base,
     activo, empresa_id, roles_sugeridos)
VALUES
    -- CONSULTAS
    ('c3000000-0000-0000-0000-000000000001',
     'Consulta Urológica General', 'consulta', false, 20, 55000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"medico":1}'),

    ('c3000000-0000-0000-0000-000000000010',
     'Control Post-Operatorio', 'control', false, 15, 30000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"medico":1}'),

    ('c3000000-0000-0000-0000-000000000011',
     'Segunda Opinión Urológica', 'consulta', false, 30, 70000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"medico":1}'),

    -- CIRUGÍAS AMBULATORIAS
    ('c3000000-0000-0000-0000-000000000002',
     'Vasectomía sin Bisturí', 'cirugia', true, 25, 490000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"cirujano":1,"tens":1}'),

    ('c3000000-0000-0000-0000-000000000003',
     'Circuncisión Adulto ZSR (sin suturas)', 'cirugia', true, 25, 590000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"cirujano":1,"tens":1}'),

    ('c3000000-0000-0000-0000-000000000004',
     'Circuncisión Adulto con Suturas', 'cirugia', true, 45, 490000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"cirujano":1,"arsenalera":1}'),

    ('c3000000-0000-0000-0000-000000000012',
     'Orquidopexia', 'cirugia', true, 50, 580000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"cirujano":1,"arsenalera":1,"anestesista":1}'),

    ('c3000000-0000-0000-0000-000000000013',
     'Extracción Quiste Epididimario', 'cirugia', true, 45, 520000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"cirujano":1,"arsenalera":1}'),

    ('c3000000-0000-0000-0000-000000000014',
     'Uretroplastia', 'cirugia', true, 90, 1500000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"cirujano":1,"ayudante":1,"arsenalera":1,"anestesista":1}'),

    -- PROCEDIMIENTOS
    ('c3000000-0000-0000-0000-000000000005',
     'Próstata Rezum (Vapor de Agua)', 'procedimiento', false, 60, 1800000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"medico":1,"tens":1}'),

    ('c3000000-0000-0000-0000-000000000006',
     'Biopsia Próstata por Fusión', 'procedimiento', false, 45, 890000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"medico":1,"tens":1}'),

    ('c3000000-0000-0000-0000-000000000007',
     'Cistoscopia Diagnóstica', 'procedimiento', false, 30, 180000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"medico":1,"tens":1}'),

    ('c3000000-0000-0000-0000-000000000015',
     'Litotricia Extracorpórea (LEOC)', 'procedimiento', false, 45, 350000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"medico":1,"tens":1}'),

    -- CIRUGÍAS MAYORES
    ('c3000000-0000-0000-0000-000000000008',
     'Nefrolitotomía Percutánea', 'cirugia', true, 120, 2500000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"cirujano":1,"ayudante":1,"anestesista":1,"arsenalera":1}'),

    ('c3000000-0000-0000-0000-000000000009',
     'HoLEP — Enucleación Láser Próstata', 'cirugia', true, 90, 2200000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"cirujano":1,"ayudante":1,"anestesista":1,"arsenalera":1}'),

    ('c3000000-0000-0000-0000-000000000016',
     'Ureteroscopia Rígida (URS)', 'cirugia', true, 60, 900000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"cirujano":1,"arsenalera":1,"anestesista":1}');

-- ============================================================
-- PASO 9 — Tarifas por cobertura (servicios de alto volumen)
-- ============================================================
INSERT INTO public.mpaci_servicios_precios (empresa_id, servicio_id, cobertura, precio, activo)
VALUES
    -- Vasectomía
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'c3000000-0000-0000-0000-000000000002', 'fonasa',              390000, true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'c3000000-0000-0000-0000-000000000002', 'isapre_particular',   450000, true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'c3000000-0000-0000-0000-000000000002', 'pad_2026',            350000, true),
    -- Circuncisión ZSR
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'c3000000-0000-0000-0000-000000000003', 'fonasa',              490000, true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'c3000000-0000-0000-0000-000000000003', 'isapre_particular',   540000, true),
    -- Rezum
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'c3000000-0000-0000-0000-000000000005', 'fonasa',             1600000, true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'c3000000-0000-0000-0000-000000000005', 'isapre_particular',  1750000, true),
    -- Biopsia Fusión
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'c3000000-0000-0000-0000-000000000006', 'fonasa',              750000, true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'c3000000-0000-0000-0000-000000000006', 'isapre_particular',   820000, true),
    -- Consulta general
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'c3000000-0000-0000-0000-000000000001', 'fonasa',               40000, true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'c3000000-0000-0000-0000-000000000001', 'isapre_particular',    50000, true);

-- ============================================================
-- PASO 10 — Horarios prestadores
-- ============================================================
DO $$
DECLARE
    v_med1 UUID;
    v_med2 UUID;
    v_med3 UUID := 'b2000000-0000-0000-0000-000000000001'; -- Dra. Miranda (staging)
    v_emp  UUID := 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    v_suc  UUID := 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
BEGIN
    SELECT id INTO v_med1 FROM public.mpaci_usuarios
    WHERE email = 'dr.schatloff@urbamed.cl' AND empresa_id = v_emp LIMIT 1;

    SELECT id INTO v_med2 FROM public.mpaci_usuarios
    WHERE email = 'caltamirano@manmec.cl' AND empresa_id = v_emp LIMIT 1;

    -- Dr. Schatloff: Lun/Mié/Vie mañana + Mar/Jue tarde
    IF v_med1 IS NOT NULL THEN
        INSERT INTO public.mpaci_horarios_prestador
            (empresa_id, medico_id, sucursal_id, dia_semana, hora_inicio, hora_fin, activo)
        VALUES
            (v_emp, v_med1, v_suc, 1, '08:00', '13:00', true),
            (v_emp, v_med1, v_suc, 3, '08:00', '13:00', true),
            (v_emp, v_med1, v_suc, 5, '08:00', '13:00', true),
            (v_emp, v_med1, v_suc, 2, '14:00', '18:00', true),
            (v_emp, v_med1, v_suc, 4, '14:00', '18:00', true);
    END IF;

    -- Dr. Altamirano: Mar/Jue/Sáb mañana
    IF v_med2 IS NOT NULL THEN
        INSERT INTO public.mpaci_horarios_prestador
            (empresa_id, medico_id, sucursal_id, dia_semana, hora_inicio, hora_fin, activo)
        VALUES
            (v_emp, v_med2, v_suc, 2, '08:00', '14:00', true),
            (v_emp, v_med2, v_suc, 4, '08:00', '14:00', true),
            (v_emp, v_med2, v_suc, 6, '08:00', '12:00', true);
    END IF;

    -- Dra. Miranda (staging): Lun-Vie completo
    INSERT INTO public.mpaci_horarios_prestador
        (empresa_id, medico_id, sucursal_id, dia_semana, hora_inicio, hora_fin, activo)
    VALUES
        (v_emp, v_med3, v_suc, 1, '09:00', '17:00', true),
        (v_emp, v_med3, v_suc, 2, '09:00', '17:00', true),
        (v_emp, v_med3, v_suc, 3, '09:00', '17:00', true),
        (v_emp, v_med3, v_suc, 4, '09:00', '17:00', true),
        (v_emp, v_med3, v_suc, 5, '09:00', '17:00', true);

    -- Pausas colación Dra. Miranda
    INSERT INTO public.mpaci_horarios_pausas (horario_id, hora_inicio, hora_fin, motivo)
    SELECT hp.id, '13:00', '14:00', 'Colación'
    FROM public.mpaci_horarios_prestador hp
    WHERE hp.medico_id = v_med3 AND hp.dia_semana IN (1,2,3,4,5);
END $$;

-- ============================================================
-- PASO 11 — Equipamiento e Insumos
-- ============================================================
INSERT INTO public.mpaci_equipamiento
    (id, empresa_id, sucursal_id, nombre, descripcion, activo)
VALUES
    ('f6000000-0000-0000-0000-000000000001',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Cistoscopio Flexible Olympus CYF-VH', 'Videocistoscopio flexible HD 4K', true),
    ('f6000000-0000-0000-0000-000000000002',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Sistema Rezum Boston Scientific', 'Terapia de Vapor de Agua para próstata', true),
    ('f6000000-0000-0000-0000-000000000003',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Ecógrafo Fusion BK Medical', 'Ecografía por fusión para biopsia de próstata', true),
    ('f6000000-0000-0000-0000-000000000004',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Litotritor Dornier Delta II', 'Litotricia extracorpórea por ondas de choque', true),
    ('f6000000-0000-0000-0000-000000000005',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Láser Holmium Quanta System', 'HoLEP y litotripsia intracorpórea', true);

INSERT INTO public.mpaci_insumos
    (id, empresa_id, sucursal_id, nombre, unidad, stock_actual, stock_minimo, activo)
VALUES
    ('f6000000-0000-0000-0000-000000000010',
     'd837f400-60b5-4b53-b0df-2b9a71b12345', 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Sonda Foley 16Fr', 'unidad', 80, 15, true),
    ('f6000000-0000-0000-0000-000000000011',
     'd837f400-60b5-4b53-b0df-2b9a71b12345', 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Sutura Vicryl 3-0', 'unidad', 40, 8, true),
    ('f6000000-0000-0000-0000-000000000012',
     'd837f400-60b5-4b53-b0df-2b9a71b12345', 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Lidocaína Gel 2%', 'ml', 800, 150, true),
    ('f6000000-0000-0000-0000-000000000013',
     'd837f400-60b5-4b53-b0df-2b9a71b12345', 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Aguja Biopsia 18G x 25cm', 'unidad', 30, 10, true),
    ('f6000000-0000-0000-0000-000000000014',
     'd837f400-60b5-4b53-b0df-2b9a71b12345', 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Jeringa 20ml estéril', 'unidad', 200, 50, true),
    ('f6000000-0000-0000-0000-000000000015',
     'd837f400-60b5-4b53-b0df-2b9a71b12345', 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Clip ZSR (kit circuncisión)', 'kit', 20, 5, true),
    ('f6000000-0000-0000-0000-000000000016',
     'd837f400-60b5-4b53-b0df-2b9a71b12345', 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Guantes estériles Talla M', 'par', 150, 30, true);

-- ============================================================
-- PASO 12 — Pacientes (12 contactos con demografía completa)
-- ============================================================
INSERT INTO public.mpaci_contactos
    (id, empresa_id, nombre, rut, telefono, email,
     canal_origen, prevision, genero, fecha_nacimiento)
VALUES
    ('d4000000-0000-0000-0000-000000000001', 'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Manuel Ignacio Cortés Vega', '8.765.432-1', '+56912340001', 'manuel.cortes@gmail.com',
     'web', 'fonasa', 'masculino', '1952-06-14'),

    ('d4000000-0000-0000-0000-000000000002', 'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Ricardo Andrés Peña Soto', '12.543.876-5', '+56912340002', 'rpeña@outlook.com',
     'derivacion', 'isapre_banmedica', 'masculino', '1968-03-22'),

    ('d4000000-0000-0000-0000-000000000003', 'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Jorge Esteban Muñoz Díaz', '14.321.098-7', '+56912340003', NULL,
     'telefono', 'fonasa', 'masculino', '1975-11-08'),

    ('d4000000-0000-0000-0000-000000000004', 'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Felipe Rodrigo Castro Mora', '16.789.234-K', '+56912340004', 'fcastro@empresa.cl',
     'web', 'isapre_colmena', 'masculino', '1985-07-30'),

    ('d4000000-0000-0000-0000-000000000005', 'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Sebastián Omar Rojas Fuentes', '18.234.567-3', '+56912340005', 'srojas@gmail.com',
     'whatsapp', 'particular', 'masculino', '1990-02-15'),

    ('d4000000-0000-0000-0000-000000000006', 'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Gonzalo Patricio Herrera Núñez', '10.876.543-2', '+56912340006', 'gonzalo.h@gmail.com',
     'derivacion', 'fonasa', 'masculino', '1961-09-04'),

    ('d4000000-0000-0000-0000-000000000007', 'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Diego Alejandro Torres Pinto', '19.345.678-9', '+56912340007', 'dtorres@hotmail.com',
     'web', 'isapre_cruz_blanca', 'masculino', '1993-12-01'),

    ('d4000000-0000-0000-0000-000000000008', 'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Patricio Luis Vargas Campos', '7.654.321-0', '+56912340008', NULL,
     'telefono', 'particular', 'masculino', '1948-04-20'),

    ('d4000000-0000-0000-0000-000000000009', 'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Cristóbal Matías Silva Reyes', '20.123.456-7', '+56912340009', 'csilva@gmail.com',
     'web', 'fonasa', 'masculino', '1998-08-12'),

    ('d4000000-0000-0000-0000-000000000010', 'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Álvaro Nicolás Espinoza Tapia', '15.432.109-8', '+56912340010', 'aespinoza@empresa.cl',
     'derivacion', 'isapre_banmedica', 'masculino', '1979-05-27'),

    ('d4000000-0000-0000-0000-000000000011', 'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Héctor Ramón Gutiérrez León', '11.098.765-4', '+56912340011', 'hgutierrez@gmail.com',
     'whatsapp', 'fonasa', 'masculino', '1965-01-18'),

    ('d4000000-0000-0000-0000-000000000012', 'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Andrés Tomás Bravo Contreras', '17.654.321-K', '+56912340012', 'abravo@outlook.com',
     'web', 'isapre_colmena', 'masculino', '1987-10-09');

-- ============================================================
-- PASO 13 — Alergias (pacientes seleccionados)
-- ============================================================
INSERT INTO public.mpaci_alergias
    (empresa_id, contacto_id, sustancia, severidad, reaccion)
VALUES
    -- Manuel Cortés: alérgico a penicilina
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000001',
     'Penicilina', 'severa', 'Anafilaxia — urticaria generalizada y colapso hemodinámico en 2018'),

    -- Ricardo Peña: AINE
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000002',
     'Ibuprofeno', 'moderada', 'Broncoespasmo — disnea 30 min post ingesta'),

    -- Jorge Muñoz: látex
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000003',
     'Látex', 'leve', 'Eritema y prurito en zona de contacto'),

    -- Patricio Vargas: contraste yodado
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000008',
     'Contraste yodado', 'severa', 'Edema angioneurótico — hospitalización en 2015'),

    -- Héctor Gutiérrez: sulfas
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000011',
     'Cotrimoxazol (Sulfas)', 'moderada', 'Rash cutáneo generalizado y prurito intenso');

-- ============================================================
-- PASO 14 — Diagnósticos CIE-10 (longitudinales por paciente)
-- ============================================================
INSERT INTO public.mpaci_diagnosticos
    (empresa_id, contacto_id, codigo_cie10, descripcion, lateralidad,
     estado, es_principal, nota)
VALUES
    -- Manuel Cortés (BPH + DM + HTA)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000001',
     'N40.1', 'Hiperplasia benigna de próstata con síntomas del tracto urinario inferior',
     NULL, 'activo', true,
     'IPSS 18 — moderado-severo. PSA 4.2 ng/mL. Candidato Rezum según última evaluación.'),

    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000001',
     'E11.9', 'Diabetes mellitus tipo 2 sin complicaciones',
     NULL, 'activo', false, 'HbA1c 7.1% — bien controlada con metformina'),

    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000001',
     'I10', 'Hipertensión esencial (primaria)',
     NULL, 'activo', false, 'Losartán 50mg/día. PA 130/85 en control'),

    -- Ricardo Peña (cálculo ureteral + cólico renal recurrente)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000002',
     'N20.1', 'Cálculo del uréter',
     'derecho', 'activo', true,
     'Cálculo 7mm uréter distal derecho. Indicada URS si no pasa espontáneamente en 2 semanas.'),

    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000002',
     'N20.0', 'Cálculo del riñón (nefrolitiasis)',
     'izquierdo', 'activo', false,
     'Múltiples cálculos < 5mm. Seguimiento semestral.'),

    -- Jorge Muñoz (fimosis + ITU recurrente)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000003',
     'N47.0', 'Prepucio adherente — fimosis',
     NULL, 'activo', true,
     'Fimosis grado III. Indicada circuncisión. Programa para próximo mes.'),

    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000003',
     'N39.0', 'Infección del tracto urinario, sitio no especificado',
     NULL, 'activo', false, 'ITU recurrente — 3 episodios año 2024'),

    -- Felipe Castro (vasectomía electiva)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000004',
     'Z30.2', 'Esterilización — planificación familiar',
     NULL, 'activo', true, 'Vasectomía sin bisturí coordinada con pareja.'),

    -- Sebastián Rojas (hidrocele)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000005',
     'N43.3', 'Hidrocele, sin especificación',
     'izquierdo', 'activo', true,
     'Hidrocele izquierdo de 35ml. Asintomático. Seguimiento anual.'),

    -- Gonzalo Herrera (cáncer próstata seguimiento)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000006',
     'C61', 'Tumor maligno de la próstata',
     NULL, 'activo', true,
     'PCa Gleason 6 (3+3). Vigilancia activa. PSA 6.8 → 7.1 ng/mL en 6 meses. Biopsia fusión programada.'),

    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000006',
     'I10', 'Hipertensión esencial',
     NULL, 'activo', false, NULL),

    -- Diego Torres (estenosis uretra)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000007',
     'N35.0', 'Estenosis uretral postinfecciosa',
     NULL, 'activo', true,
     'Estenosis uretra bulbar 2cm. Candidato uretroplastia. Uretroscopia previa con dilatación insuficiente.'),

    -- Patricio Vargas (BPH severo + HTA + IRC)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000008',
     'N40.1', 'Hiperplasia benigna de próstata con STUI',
     NULL, 'activo', true,
     'IPSS 24 — severo. Volumen prostático 85ml. Candidato HoLEP por tamaño y retención urinaria previa.'),

    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000008',
     'I10', 'Hipertensión esencial', NULL, 'activo', false, 'Bajo tratamiento con Enalapril 10mg'),

    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000008',
     'N18.3', 'Enfermedad renal crónica estadio 3', NULL, 'activo', false,
     'TFG 42 ml/min. Nefrólogo tratante Dr. Castro — HCH'),

    -- Cristóbal Silva (cálculo vesical joven)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000009',
     'N21.0', 'Cálculo en vejiga urinaria',
     NULL, 'activo', true,
     'Cálculo único 12mm. Cistoscopia confirmatoria + LEOC programada.'),

    -- Álvaro Espinoza (disfunción eréctil post vasectomía)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000010',
     'N52.0', 'Disfunción eréctil de origen orgánico vascular',
     NULL, 'activo', true,
     'Escala IIEF-5: 12 puntos. Inició Tadalafilo 5mg diario. Control en 3 meses.'),

    -- Héctor Gutiérrez (nefrolitiasis bilateral)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000011',
     'N20.0', 'Cálculo del riñón bilateral',
     'bilateral', 'activo', true,
     'Cálculo coraliforme derecho 25mm + cálculo izquierdo 8mm. Indicada NLP derecha.'),

    -- Andrés Bravo (orquitis + varicocele)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000012',
     'N45.1', 'Orquitis y epididimitis',
     'izquierdo', 'resuelto', false,
     'Episodio 2023, resuelto con antibióticos. Sin secuelas.'),

    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000012',
     'I86.1', 'Varicocele',
     'izquierdo', 'activo', true,
     'Varicocele grado II. Análisis seminal alterado. Pareja en evaluación fertilidad.');

-- ============================================================
-- PASO 15 — Medicamentos activos por paciente
-- ============================================================
INSERT INTO public.mpaci_medicamentos_paciente
    (empresa_id, contacto_id, nombre, estado, es_principal, nota)
VALUES
    -- Manuel Cortés
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000001',
     'Tamsulosina 0.4mg — 1 cáp/noche', 'activo', true, 'Para BPH — mejora flujo urinario'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000001',
     'Metformina 850mg — 2 veces/día', 'activo', false, 'DM2'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000001',
     'Losartán 50mg — 1 vez/día', 'activo', false, 'HTA'),

    -- Gonzalo Herrera
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000006',
     'Enalapril 10mg — 1 vez/día', 'activo', false, 'HTA'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000006',
     'Ácido acetilsalicílico 100mg — 1 vez/día', 'activo', false, 'Cardioprotección'),

    -- Patricio Vargas
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000008',
     'Finasterida 5mg — 1 vez/día', 'activo', true, 'BPH — reduce volumen prostático'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000008',
     'Enalapril 10mg — 1 vez/día', 'activo', false, 'HTA'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000008',
     'Furosemida 40mg — según indicación', 'activo', false, 'IRC estadio 3'),

    -- Álvaro Espinoza
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000010',
     'Tadalafilo 5mg — 1 vez/día', 'activo', true, 'Disfunción eréctil');

-- ============================================================
-- PASO 16 — Cirugías externas (antecedentes quirúrgicos)
-- ============================================================
INSERT INTO public.mpaci_cirugias_externas
    (empresa_id, contacto_id, nombre, fecha)
VALUES
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000001',
     'Apendicectomía laparoscópica', '2005-03-10'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000002',
     'Litotricia extracorpórea (LEOC) riñón derecho', '2019-07-22'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000006',
     'Biopsia próstata transrectal (eco-guiada) — CTO 2022', '2022-09-14'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000007',
     'Uretroplastia (dilatación) — fallida HCH 2023', '2023-02-08'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000008',
     'RTU Próstata (RTUP) — Hospital Barros Luco 2015', '2015-11-19'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000008',
     'Cateterismo urinario por retención aguda — Clínica Las Condes 2022', '2022-06-03'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', 'd4000000-0000-0000-0000-000000000011',
     'Nefrolitotomía percutánea izquierda — UC Christus 2020', '2020-04-15');

-- ============================================================
-- PASO 17 — Citas (35 en distintos estados)
-- Variables médico IDs inyectadas dinámicamente
-- ============================================================
DO $$
DECLARE
    v_emp  UUID := 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    v_suc  UUID := 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    v_med1 UUID; -- Schatloff
    v_med2 UUID; -- Altamirano
    v_med3 UUID := 'b2000000-0000-0000-0000-000000000001'; -- Miranda (staging)
BEGIN
    SELECT id INTO v_med1 FROM public.mpaci_usuarios
    WHERE email = 'dr.schatloff@urbamed.cl' AND empresa_id = v_emp LIMIT 1;
    IF v_med1 IS NULL THEN v_med1 := v_med3; END IF; -- Fallback a staging

    SELECT id INTO v_med2 FROM public.mpaci_usuarios
    WHERE email = 'caltamirano@manmec.cl' AND empresa_id = v_emp LIMIT 1;
    IF v_med2 IS NULL THEN v_med2 := v_med3; END IF;

    -- ── PASADAS (hace 30-7 días) ─────────────────────────────

    -- Citas realizadas
    INSERT INTO public.mpaci_citas (id, empresa_id, sucursal_id, medico_id, contacto_id,
        servicio_id, fecha_inicio, fecha_fin, estado_operativo, estado_confirmacion,
        estado_pago, precio_base, cobertura_usada, sala_id)
    VALUES
        ('99000000-0000-0000-0000-000000000001', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000001',
         'c3000000-0000-0000-0000-000000000001',
         now()-interval'28 days'+time'08:30', now()-interval'28 days'+time'08:50',
         'Realizada','confirmada','Pago total', 40000, 'fonasa',
         'a1000000-0000-0000-0000-000000000002'),

        ('99000000-0000-0000-0000-000000000002', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000002',
         'c3000000-0000-0000-0000-000000000016',
         now()-interval'25 days'+time'09:00', now()-interval'25 days'+time'10:00',
         'Realizada','confirmada','Pago total', 900000, 'isapre_banmedica',
         'a1000000-0000-0000-0000-000000000001'),

        ('99000000-0000-0000-0000-000000000003', v_emp, v_suc, v_med2,
         'd4000000-0000-0000-0000-000000000003',
         'c3000000-0000-0000-0000-000000000001',
         now()-interval'21 days'+time'08:00', now()-interval'21 days'+time'08:20',
         'Realizada','confirmada','Pago total', 55000, 'fonasa',
         'a1000000-0000-0000-0000-000000000003'),

        ('99000000-0000-0000-0000-000000000004', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000004',
         'c3000000-0000-0000-0000-000000000002',
         now()-interval'18 days'+time'09:00', now()-interval'18 days'+time'09:25',
         'Realizada','confirmada','Pago total', 490000, 'fonasa',
         'a1000000-0000-0000-0000-000000000001'),

        ('99000000-0000-0000-0000-000000000005', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000006',
         'c3000000-0000-0000-0000-000000000006',
         now()-interval'15 days'+time'10:00', now()-interval'15 days'+time'10:45',
         'Realizada','confirmada','Pago total', 750000, 'fonasa',
         'a1000000-0000-0000-0000-000000000004'),

        ('99000000-0000-0000-0000-000000000006', v_emp, v_suc, v_med2,
         'd4000000-0000-0000-0000-000000000007',
         'c3000000-0000-0000-0000-000000000001',
         now()-interval'14 days'+time'08:00', now()-interval'14 days'+time'08:20',
         'Realizada','confirmada','Pago total', 55000, 'particular',
         'a1000000-0000-0000-0000-000000000003'),

        ('99000000-0000-0000-0000-000000000007', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000008',
         'c3000000-0000-0000-0000-000000000001',
         now()-interval'14 days'+time'08:30', now()-interval'14 days'+time'08:50',
         'Realizada','confirmada','Pago total', 40000, 'fonasa',
         'a1000000-0000-0000-0000-000000000002'),

        ('99000000-0000-0000-0000-000000000008', v_emp, v_suc, v_med2,
         'd4000000-0000-0000-0000-000000000009',
         'c3000000-0000-0000-0000-000000000007',
         now()-interval'10 days'+time'09:00', now()-interval'10 days'+time'09:30',
         'Realizada','confirmada','Pago total', 180000, 'fonasa',
         'a1000000-0000-0000-0000-000000000004'),

        ('99000000-0000-0000-0000-000000000009', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000011',
         'c3000000-0000-0000-0000-000000000001',
         now()-interval'9 days'+time'08:00', now()-interval'9 days'+time'08:20',
         'Realizada','confirmada','Pago total', 40000, 'fonasa',
         'a1000000-0000-0000-0000-000000000002'),

        ('99000000-0000-0000-0000-000000000010', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000005',
         'c3000000-0000-0000-0000-000000000007',
         now()-interval'7 days'+time'10:00', now()-interval'7 days'+time'10:30',
         'Realizada','confirmada','Pago parcial', 180000, 'fonasa',
         'a1000000-0000-0000-0000-000000000004'),

        ('99000000-0000-0000-0000-000000000011', v_emp, v_suc, v_med2,
         'd4000000-0000-0000-0000-000000000010',
         'c3000000-0000-0000-0000-000000000001',
         now()-interval'7 days'+time'08:00', now()-interval'7 days'+time'08:20',
         'Realizada','confirmada','Pago total', 50000, 'isapre_banmedica',
         'a1000000-0000-0000-0000-000000000003'),

        ('99000000-0000-0000-0000-000000000012', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000012',
         'c3000000-0000-0000-0000-000000000001',
         now()-interval'5 days'+time'09:00', now()-interval'5 days'+time'09:20',
         'Realizada','confirmada','Pago total', 55000, 'isapre_colmena',
         'a1000000-0000-0000-0000-000000000002'),

        -- Control post-op Vasectomía (Felipe Castro)
        ('99000000-0000-0000-0000-000000000013', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000004',
         'c3000000-0000-0000-0000-000000000010',
         now()-interval'4 days'+time'08:00', now()-interval'4 days'+time'08:15',
         'Realizada','confirmada','Pago total', 30000, 'fonasa',
         'a1000000-0000-0000-0000-000000000002'),

    -- Citas canceladas / no asistió
        ('99000000-0000-0000-0000-000000000014', v_emp, v_suc, v_med2,
         'd4000000-0000-0000-0000-000000000003',
         'c3000000-0000-0000-0000-000000000003',
         now()-interval'20 days'+time'08:00', now()-interval'20 days'+time'08:25',
         'No asistió','confirmada','No pagado', 490000, 'fonasa', NULL),

        ('99000000-0000-0000-0000-000000000015', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000001',
         'c3000000-0000-0000-0000-000000000005',
         now()-interval'12 days'+time'09:00', now()-interval'12 days'+time'10:00',
         'Cancelada por paciente dentro de plazo','confirmada','No pagado',
         1600000, 'fonasa', NULL),

    -- ── HOY ─────────────────────────────────────────────────

        ('99000000-0000-0000-0000-000000000016', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000001',
         'c3000000-0000-0000-0000-000000000005',
         date_trunc('day',now())+time'08:00', date_trunc('day',now())+time'09:00',
         'Agendada','confirmada','No pagado', 1800000, 'fonasa',
         'a1000000-0000-0000-0000-000000000001'),

        ('99000000-0000-0000-0000-000000000017', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000008',
         'c3000000-0000-0000-0000-000000000009',
         date_trunc('day',now())+time'09:00', date_trunc('day',now())+time'10:30',
         'Agendada','confirmada','No pagado', 2200000, 'particular',
         'a1000000-0000-0000-0000-000000000001'),

        ('99000000-0000-0000-0000-000000000018', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000006',
         'c3000000-0000-0000-0000-000000000010',
         date_trunc('day',now())+time'10:30', date_trunc('day',now())+time'10:45',
         'Agendada','confirmada','No pagado', 30000, 'fonasa',
         'a1000000-0000-0000-0000-000000000002'),

        ('99000000-0000-0000-0000-000000000019', v_emp, v_suc, v_med2,
         'd4000000-0000-0000-0000-000000000003',
         'c3000000-0000-0000-0000-000000000003',
         date_trunc('day',now())+time'08:00', date_trunc('day',now())+time'08:25',
         'Agendada','no_confirmada','No pagado', 590000, 'fonasa',
         'a1000000-0000-0000-0000-000000000001'),

        ('99000000-0000-0000-0000-000000000020', v_emp, v_suc, v_med2,
         'd4000000-0000-0000-0000-000000000007',
         'c3000000-0000-0000-0000-000000000001',
         date_trunc('day',now())+time'09:00', date_trunc('day',now())+time'09:20',
         'Agendada','confirmada','No pagado', 55000, 'particular',
         'a1000000-0000-0000-0000-000000000003'),

        ('99000000-0000-0000-0000-000000000021', v_emp, v_suc, v_med2,
         'd4000000-0000-0000-0000-000000000009',
         'c3000000-0000-0000-0000-000000000015',
         date_trunc('day',now())+time'10:00', date_trunc('day',now())+time'10:45',
         'Agendada','no_confirmada','No pagado', 350000, 'fonasa',
         'a1000000-0000-0000-0000-000000000004'),

        ('99000000-0000-0000-0000-000000000022', v_emp, v_suc, v_med3,
         'd4000000-0000-0000-0000-000000000005',
         'c3000000-0000-0000-0000-000000000011',
         date_trunc('day',now())+time'09:00', date_trunc('day',now())+time'09:50',
         'Agendada','confirmada','No pagado', 580000, 'fonasa',
         'a1000000-0000-0000-0000-000000000001'),

    -- ── PRÓXIMOS 14 DÍAS ────────────────────────────────────

        ('99000000-0000-0000-0000-000000000023', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000011',
         'c3000000-0000-0000-0000-000000000008',
         date_trunc('week',now())+interval'7 days'+time'07:30',
         date_trunc('week',now())+interval'7 days'+time'09:30',
         'Agendada','no_confirmada','No pagado', 2500000, 'fonasa',
         'a1000000-0000-0000-0000-000000000001'),

        ('99000000-0000-0000-0000-000000000024', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000006',
         'c3000000-0000-0000-0000-000000000006',
         date_trunc('week',now())+interval'8 days'+time'09:00',
         date_trunc('week',now())+interval'8 days'+time'09:45',
         'Agendada','confirmada','No pagado', 890000, 'fonasa',
         'a1000000-0000-0000-0000-000000000004'),

        ('99000000-0000-0000-0000-000000000025', v_emp, v_suc, v_med2,
         'd4000000-0000-0000-0000-000000000012',
         'c3000000-0000-0000-0000-000000000001',
         date_trunc('week',now())+interval'9 days'+time'08:30',
         date_trunc('week',now())+interval'9 days'+time'08:50',
         'Agendada','no_confirmada','No pagado', 55000, 'isapre_colmena',
         'a1000000-0000-0000-0000-000000000003'),

        ('99000000-0000-0000-0000-000000000026', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000002',
         'c3000000-0000-0000-0000-000000000010',
         date_trunc('week',now())+interval'9 days'+time'10:00',
         date_trunc('week',now())+interval'9 days'+time'10:15',
         'Agendada','confirmada','No pagado', 30000, 'isapre_banmedica',
         'a1000000-0000-0000-0000-000000000002'),

        ('99000000-0000-0000-0000-000000000027', v_emp, v_suc, v_med2,
         'd4000000-0000-0000-0000-000000000004',
         'c3000000-0000-0000-0000-000000000011',
         date_trunc('week',now())+interval'10 days'+time'08:00',
         date_trunc('week',now())+interval'10 days'+time'08:50',
         'Agendada','confirmada','No pagado', 580000, 'isapre_colmena',
         'a1000000-0000-0000-0000-000000000001'),

        ('99000000-0000-0000-0000-000000000028', v_emp, v_suc, v_med1,
         'd4000000-0000-0000-0000-000000000010',
         'c3000000-0000-0000-0000-000000000001',
         date_trunc('week',now())+interval'11 days'+time'08:00',
         date_trunc('week',now())+interval'11 days'+time'08:20',
         'Agendada','no_confirmada','No pagado', 50000, 'isapre_banmedica',
         'a1000000-0000-0000-0000-000000000002');

END $$;

-- ============================================================
-- PASO 18 — Pacientes principales de cada cita
-- ============================================================
INSERT INTO public.mpaci_cita_pacientes
    (empresa_id, cita_id, contacto_id, es_principal, estado_asistencia)
SELECT c.empresa_id, c.id, c.contacto_id, true,
    CASE c.estado_operativo
        WHEN 'Realizada'  THEN 'asistio'
        WHEN 'No asistió' THEN 'no_asistio'
        ELSE 'pendiente'
    END
FROM public.mpaci_citas c
WHERE c.id::text LIKE '99000000-0000-0000-0000-0000000000%'
  AND c.contacto_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================
-- PASO 19 — Equipo clínico (citas realizadas con equipo)
-- ============================================================
INSERT INTO public.mpaci_equipo_cita
    (empresa_id, cita_id, usuario_id, rol_clinico, honorario_calculado)
VALUES
    -- URS Ricardo Peña (cita 002) — arsenalera
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', '99000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000002', 'arsenalera', 35000),

    -- Biopsia fusión Gonzalo Herrera (cita 005) — encargada pabellón (TENS)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', '99000000-0000-0000-0000-000000000005',
     'b2000000-0000-0000-0000-000000000002', 'encargada_pabellon', 25000),

    -- Vasectomía Felipe Castro (cita 004) — encargada pabellón (TENS)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345', '99000000-0000-0000-0000-000000000004',
     'b2000000-0000-0000-0000-000000000003', 'encargada_pabellon', 20000);

-- ============================================================
-- PASO 20 — Pagos registrados
-- ============================================================
DO $$
DECLARE
    v_asistente UUID;
BEGIN
    SELECT id INTO v_asistente FROM public.mpaci_usuarios
    WHERE email = 'sditecnologiachile@gmail.com'
    AND empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345' LIMIT 1;

    IF v_asistente IS NULL THEN
        v_asistente := 'b2000000-0000-0000-0000-000000000002'; -- fallback staging
    END IF;

    INSERT INTO public.mpaci_pagos_cita
        (empresa_id, cita_id, tipo, monto, medio_pago, referencia, registrado_por)
    VALUES
        ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000001',
         'pago', 40000, 'transferencia', 'TRF-001', v_asistente),
        ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000002',
         'pago', 900000, 'transferencia', 'TRF-002', v_asistente),
        ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000003',
         'pago', 55000, 'efectivo', NULL, v_asistente),
        ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000004',
         'pago', 390000, 'transferencia', 'TRF-003', v_asistente),
        ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000005',
         'pago', 750000, 'transferencia', 'TRF-004', v_asistente),
        ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000006',
         'pago', 55000, 'efectivo', NULL, v_asistente),
        ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000007',
         'pago', 40000, 'efectivo', NULL, v_asistente),
        ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000008',
         'pago', 180000, 'tarjeta', 'VISA-1234', v_asistente),
        ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000009',
         'pago', 40000, 'efectivo', NULL, v_asistente),
        -- Pago parcial cistoscopia Sebastián Rojas
        ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000010',
         'abono', 90000, 'transferencia', 'TRF-005', v_asistente),
        ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000011',
         'pago', 50000, 'tarjeta', 'MASTER-5678', v_asistente),
        ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000012',
         'pago', 55000, 'transferencia', 'TRF-006', v_asistente),
        ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000013',
         'pago', 30000, 'efectivo', NULL, v_asistente);
END $$;

-- ============================================================
-- PASO 21 — Fichas clínicas (citas pasadas realizadas)
-- ============================================================
DO $$
DECLARE
    v_med1 UUID;
    v_med2 UUID;
    v_med3 UUID := 'b2000000-0000-0000-0000-000000000001';
    v_emp  UUID := 'd837f400-60b5-4b53-b0df-2b9a71b12345';
BEGIN
    SELECT id INTO v_med1 FROM public.mpaci_usuarios
    WHERE email = 'dr.schatloff@urbamed.cl' AND empresa_id = v_emp LIMIT 1;
    IF v_med1 IS NULL THEN v_med1 := v_med3; END IF;

    SELECT id INTO v_med2 FROM public.mpaci_usuarios
    WHERE email = 'caltamirano@manmec.cl' AND empresa_id = v_emp LIMIT 1;
    IF v_med2 IS NULL THEN v_med2 := v_med3; END IF;

    INSERT INTO public.mpaci_fichas_clinicas
        (id, cita_id, medico_id, contenido_texto,
         creado_en, actualizado_en)
    VALUES
        -- Consulta Manuel Cortés — evaluación BPH
        ('fc000000-0000-0000-0000-000000000001',
         '99000000-0000-0000-0000-000000000001', v_med1,
         'MOTIVO: Paciente consulta por síntomas obstructivos y de almacenamiento urinario de 8 meses de evolución. Refiere nicturia x3, chorro débil, sensación de vaciado incompleto.
EXAMEN FÍSICO: PA 132/86. FC 72. TR: próstata grado II, consistencia adenomatosa, simétrica, sin nódulos.
IPSS: 18 (moderado-severo). Residuo post-miccional: 85ml por ECO.
PSA total: 4.2 ng/mL — dentro de rango para la edad (72 años). Solicito PSA libre/total.
PLAN: Iniciar Tamsulosina 0.4mg/noche. Control en 6 semanas. Evaluar Rezum si IPSS no mejora > 30%.',
         now()-interval'28 days', now()-interval'28 days'),

        -- URS Ricardo Peña
        ('fc000000-0000-0000-0000-000000000002',
         '99000000-0000-0000-0000-000000000002', v_med1,
         'PROCEDIMIENTO: Ureteroscopia rígida (URS) + litotripsia intracorpórea con láser Holmium. Cálculo uréter distal derecho 7mm.
TÉCNICA: Anestesia raquídea. URS rígida 8/9.8 Fr. Identificación cálculo a 2cm del meato ureteral derecho. Fragmentación completa con láser Holmium 0.6J × 10Hz. Extracción de fragmentos con canasta Nitinol. Instalación catéter doble J 6Fr × 26cm.
HALLAZGOS: Urotelio normal. Sin perforación. Sangrado mínimo.
COMPLICACIONES: Sin complicaciones intraoperatorias.
INDICACIONES POST: Catéter DJ a retirar en 3 semanas. AINE + antiespasmódico. Hidratación oral 2L/día. Control imagenológico RxTx en 4 semanas.',
         now()-interval'25 days', now()-interval'25 days'),

        -- Consulta Jorge Muñoz
        ('fc000000-0000-0000-0000-000000000003',
         '99000000-0000-0000-0000-000000000003', v_med2,
         'MOTIVO: Fimosis grado III, episodios recurrentes de ITU (3 en 2024). Dificulta higiene.
EXAMEN FÍSICO: Prepucio no retráctil. Sin signos de infección activa.
PLAN: Circuncisión electiva con técnica ZSR. Fecha coordinada próximo mes. Preoperatorio solicitado (ECG, hemograma, coagulación). Sin contraindicación anestésica conocida.
ALERTA: Alergia a látex documentada — informar a pabellón.',
         now()-interval'21 days', now()-interval'21 days'),

        -- Vasectomía Felipe Castro
        ('fc000000-0000-0000-0000-000000000004',
         '99000000-0000-0000-0000-000000000004', v_med1,
         'PROCEDIMIENTO: Vasectomía sin bisturí técnica No-Scalpel Vasectomy (NSV).
TÉCNICA: Anestesia local con Lidocaína al 2% perivasal bilateral. Punción única línea media escrotal. Identificación y aislamiento conductos deferentes bilateral. Oclusión por fulguración y ligadura con Vicryl 3-0. Sección de segmento de 1cm bilateral. Fascia entre los extremos.
HALLAZGOS: Anatomía normal bilateral. Sin varicocele. Sin hidrocele.
COMPLICACIONES: Sin complicaciones.
INDICACIONES: Reposo relativo 48hrs. Sin coito 7 días. Espermatograma de control a los 3 meses para confirmar azoospermia.',
         now()-interval'18 days', now()-interval'18 days'),

        -- Biopsia fusión Gonzalo Herrera
        ('fc000000-0000-0000-0000-000000000005',
         '99000000-0000-0000-0000-000000000005', v_med1,
         'PROCEDIMIENTO: Biopsia de próstata por fusión (eco-RM). Indicación: cáncer próstata Gleason 6 en vigilancia activa. PSA 6.8→7.1 ng/mL en 6 meses. RM mp-próstata: lesión PIRADS 3 en zona de transición.
TÉCNICA: Sonda transrectal BK. Fusión imagen RM previo con imágenes eco en tiempo real. Biopsia sistemática 12 cilindros + 2 cilindros dirigidos a zona PIRADS 3.
HALLAZGOS: Próstata 58cc. Zona de transición heterogénea. Sin extensión extracapsular aparente.
MUESTRAS: 14 cilindros enviados a anatomía patológica (Clínica UC). Resultado esperado en 7 días.',
         now()-interval'15 days', now()-interval'15 days'),

        -- Control post-op vasectomía Felipe Castro
        ('fc000000-0000-0000-0000-000000000013',
         '99000000-0000-0000-0000-000000000013', v_med1,
         'CONTROL POST-VASECTOMÍA (día 14):
Paciente refiere evolución sin complicaciones. Sin dolor escrotal. Sin hematoma. Herida cicatrizada.
EXAMEN FÍSICO: Sitio punción cicatrizado. Sin induración. Sin signos infecciosos.
PLAN: Alta. Espermatograma de control en 3 meses (día 90 post-cirugía) para confirmar azoospermia. Se instruye sobre necesidad de anticoncepción hasta resultado.',
         now()-interval'4 days', now()-interval'4 days');

END $$;

-- ============================================================
-- PASO 22 — Anotaciones clínicas (eventos posteriores)
-- ============================================================
DO $$
DECLARE
    v_med1 UUID;
    v_emp  UUID := 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    v_med3 UUID := 'b2000000-0000-0000-0000-000000000001';
BEGIN
    SELECT id INTO v_med1 FROM public.mpaci_usuarios
    WHERE email = 'dr.schatloff@urbamed.cl' AND empresa_id = v_emp LIMIT 1;
    IF v_med1 IS NULL THEN v_med1 := v_med3; END IF;

    INSERT INTO public.mpaci_anotaciones_clinicas
        (ficha_id, medico_id, contenido, creado_en)
    VALUES
        -- Resultado anatomía patológica Gonzalo Herrera
        ('fc000000-0000-0000-0000-000000000005', v_med1,
         'RESULTADO AP (recibido hoy): 12/14 cilindros negativos para malignidad. 2 cilindros zona de transición: adenocarcinoma acinar Gleason 6 (3+3) < 5% del tejido. Concordante con vigilancia activa. Control PSA + RM en 6 meses. Informado al paciente.',
         now()-interval'8 days'),

        -- Comunicación post-URS Ricardo Peña
        ('fc000000-0000-0000-0000-000000000002', v_med1,
         'LLAMADA CONTROL: Paciente refiere cólico leve post-catéter DJ. Se indica Ketoprofeno 100mg + Solifenacina 5mg por 5 días. Control retiro DJ coordinado para próxima semana.',
         now()-interval'22 days');
END $$;

-- ============================================================
-- PASO 23 — Documentos clínicos (exámenes simulados)
-- ============================================================
DO $$
DECLARE
    v_med1 UUID;
    v_emp  UUID := 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    v_med3 UUID := 'b2000000-0000-0000-0000-000000000001';
BEGIN
    SELECT id INTO v_med1 FROM public.mpaci_usuarios
    WHERE email = 'dr.schatloff@urbamed.cl' AND empresa_id = v_emp LIMIT 1;
    IF v_med1 IS NULL THEN v_med1 := v_med3; END IF;

    INSERT INTO public.mpaci_documentos
        (empresa_id, contacto_id, cita_id, ficha_id, tipo, nombre,
         storage_path, mime_type, tamanio_bytes, origen, subido_por, creado_en)
    VALUES
        -- Manuel Cortés — ECO próstata
        (v_emp, 'd4000000-0000-0000-0000-000000000001',
         '99000000-0000-0000-0000-000000000001',
         'fc000000-0000-0000-0000-000000000001',
         'clinico', 'Ecografía Prostática — 2024-10',
         'documentos/clinica-urologia-demo/d4000000-0001/eco_prostata_oct2024.pdf',
         'application/pdf', 284500, 'upload_manual', v_med1,
         now()-interval'28 days'),

        -- Manuel Cortés — PSA
        (v_emp, 'd4000000-0000-0000-0000-000000000001',
         '99000000-0000-0000-0000-000000000001',
         'fc000000-0000-0000-0000-000000000001',
         'clinico', 'PSA Total + Libre — Lab. Alemana Oct 2024',
         'documentos/clinica-urologia-demo/d4000000-0001/psa_lab_oct2024.pdf',
         'application/pdf', 128000, 'upload_manual', v_med1,
         now()-interval'27 days'),

        -- Ricardo Peña — TAC urinario pre URS
        (v_emp, 'd4000000-0000-0000-0000-000000000002',
         '99000000-0000-0000-0000-000000000002',
         'fc000000-0000-0000-0000-000000000002',
         'clinico', 'TAC Urinario sin contraste — cálculo ureteral',
         'documentos/clinica-urologia-demo/d4000000-0002/tac_urinario_preurs.pdf',
         'application/pdf', 1250000, 'upload_manual', v_med1,
         now()-interval'26 days'),

        -- Ricardo Peña — RxTx post URS (control)
        (v_emp, 'd4000000-0000-0000-0000-000000000002',
         '99000000-0000-0000-0000-000000000002',
         'fc000000-0000-0000-0000-000000000002',
         'clinico', 'Rx Tórax control DJ — post URS',
         'documentos/clinica-urologia-demo/d4000000-0002/rxtx_post_urs.pdf',
         'application/pdf', 420000, 'upload_manual', v_med1,
         now()-interval'20 days'),

        -- Gonzalo Herrera — RM próstata mp
        (v_emp, 'd4000000-0000-0000-0000-000000000006',
         '99000000-0000-0000-0000-000000000005',
         'fc000000-0000-0000-0000-000000000005',
         'clinico', 'RM Multiparamétrica Próstata — PIRADS 3',
         'documentos/clinica-urologia-demo/d4000000-0006/rm_mprostata_pirads3.pdf',
         'application/pdf', 3200000, 'upload_manual', v_med1,
         now()-interval'16 days'),

        -- Gonzalo Herrera — Resultado AP biopsia
        (v_emp, 'd4000000-0000-0000-0000-000000000006',
         '99000000-0000-0000-0000-000000000005',
         'fc000000-0000-0000-0000-000000000005',
         'clinico', 'Informe Anatomía Patológica — Biopsia Próstata Fusión',
         'documentos/clinica-urologia-demo/d4000000-0006/ap_biopsia_prostata.pdf',
         'application/pdf', 195000, 'upload_manual', v_med1,
         now()-interval'8 days'),

        -- Patricio Vargas — Urodinamia
        (v_emp, 'd4000000-0000-0000-0000-000000000008',
         '99000000-0000-0000-0000-000000000007',
         'fc000000-0000-0000-0000-000000000013',
         'clinico', 'Urodinamia — flujo miccional obstruido',
         'documentos/clinica-urologia-demo/d4000000-0008/urodinamia_vargas.pdf',
         'application/pdf', 560000, 'upload_manual', v_med1,
         now()-interval'13 days'),

        -- Cristóbal Silva — Ecografía vesical
        (v_emp, 'd4000000-0000-0000-0000-000000000009',
         '99000000-0000-0000-0000-000000000008',
         NULL,
         'clinico', 'Ecografía Vesical — cálculo 12mm',
         'documentos/clinica-urologia-demo/d4000000-0009/eco_vesical_silva.pdf',
         'application/pdf', 310000, 'upload_manual', v_med1,
         now()-interval'10 days'),

        -- Héctor Gutiérrez — Urocultivo
        (v_emp, 'd4000000-0000-0000-0000-000000000011',
         '99000000-0000-0000-0000-000000000009',
         NULL,
         'clinico', 'Urocultivo — E.coli sensible Ciprofloxacino',
         'documentos/clinica-urologia-demo/d4000000-0011/urocultivo_gutierrez.pdf',
         'application/pdf', 89000, 'upload_manual', v_med1,
         now()-interval'9 days'),

        -- Héctor Gutiérrez — TAC renal bilateral
        (v_emp, 'd4000000-0000-0000-0000-000000000011',
         '99000000-0000-0000-0000-000000000009',
         NULL,
         'clinico', 'TAC Renal sin contraste — nefrolitiasis bilateral',
         'documentos/clinica-urologia-demo/d4000000-0011/tac_renal_bilateral.pdf',
         'application/pdf', 2100000, 'upload_manual', v_med1,
         now()-interval'8 days');
END $$;

-- ============================================================
-- PASO 24 — Timeline de eventos
-- ============================================================
DO $$
DECLARE
    v_med1 UUID;
    v_emp  UUID := 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    v_med3 UUID := 'b2000000-0000-0000-0000-000000000001';
BEGIN
    SELECT id INTO v_med1 FROM public.mpaci_usuarios
    WHERE email = 'dr.schatloff@urbamed.cl' AND empresa_id = v_emp LIMIT 1;
    IF v_med1 IS NULL THEN v_med1 := v_med3; END IF;

    INSERT INTO public.mpaci_timeline_eventos
        (empresa_id, contacto_id, origen, referencia_id, referencia_tabla,
         descripcion, usuario_id, es_automatico, creado_en)
    VALUES
        (v_emp, 'd4000000-0000-0000-0000-000000000001',
         'agenda', '99000000-0000-0000-0000-000000000001', 'mpaci_citas',
         'Consulta urológica realizada — evaluación BPH',
         v_med1, false, now()-interval'28 days'),

        (v_emp, 'd4000000-0000-0000-0000-000000000001',
         'ficha_clinica', 'fc000000-0000-0000-0000-000000000001', 'mpaci_fichas_clinicas',
         'Ficha clínica generada — IPSS 18, inicia Tamsulosina',
         v_med1, false, now()-interval'28 days'),

        (v_emp, 'd4000000-0000-0000-0000-000000000002',
         'agenda', '99000000-0000-0000-0000-000000000002', 'mpaci_citas',
         'URS + litotripsia láser realizada — cálculo ureteral derecho',
         v_med1, false, now()-interval'25 days'),

        (v_emp, 'd4000000-0000-0000-0000-000000000004',
         'agenda', '99000000-0000-0000-0000-000000000004', 'mpaci_citas',
         'Vasectomía sin bisturí realizada — sin complicaciones',
         v_med1, false, now()-interval'18 days'),

        (v_emp, 'd4000000-0000-0000-0000-000000000006',
         'agenda', '99000000-0000-0000-0000-000000000005', 'mpaci_citas',
         'Biopsia próstata por fusión realizada — 14 cilindros',
         v_med1, false, now()-interval'15 days'),

        (v_emp, 'd4000000-0000-0000-0000-000000000006',
         'ficha_clinica', 'fc000000-0000-0000-0000-000000000005', 'mpaci_fichas_clinicas',
         'AP recibida: Gleason 6 (3+3) — mantener vigilancia activa',
         v_med1, false, now()-interval'8 days'),

        (v_emp, 'd4000000-0000-0000-0000-000000000004',
         'agenda', '99000000-0000-0000-0000-000000000013', 'mpaci_citas',
         'Control post-vasectomía día 14 — evolución favorable',
         v_med1, false, now()-interval'4 days');
END $$;

-- ============================================================
-- PASO 25 — Service Builder (mpaci_servicios_config)
--           Configuración operativa por médico × servicio × sede
-- ============================================================
DO $$
DECLARE
    v_emp  UUID := 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    v_suc  UUID := 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    v_med1 UUID; -- Schatloff
    v_med2 UUID; -- Altamirano
    v_med3 UUID := 'b2000000-0000-0000-0000-000000000001'; -- Miranda (staging)
BEGIN
    SELECT id INTO v_med1 FROM public.mpaci_usuarios
    WHERE email = 'dr.schatloff@urbamed.cl' AND empresa_id = v_emp LIMIT 1;
    IF v_med1 IS NULL THEN v_med1 := v_med3; END IF;

    SELECT id INTO v_med2 FROM public.mpaci_usuarios
    WHERE email = 'caltamirano@manmec.cl' AND empresa_id = v_emp LIMIT 1;
    IF v_med2 IS NULL THEN v_med2 := v_med3; END IF;

    INSERT INTO public.mpaci_servicios_config
        (id, empresa_id, servicio_id, medico_id, sucursal_id,
         duracion_minutos, buffer_pre_min, buffer_post_min, sala_id,
         modelo_honorarios, monto_bloque, monto_por_cirugia,
         alias, activo)
    VALUES
        -- ── Dr. Schatloff ────────────────────────────────────────────

        -- Consulta general (Box 1, honorario fijo)
        ('e5000000-0000-0000-0000-000000000001',
         v_emp, 'c3000000-0000-0000-0000-000000000001', v_med1, v_suc,
         20, 0, 5, 'a1000000-0000-0000-0000-000000000002',
         'fijo', NULL, 55000, 'Consulta OS', true),

        -- Vasectomía sin bisturí (Pabellón 1, bloque+procedimiento)
        ('e5000000-0000-0000-0000-000000000002',
         v_emp, 'c3000000-0000-0000-0000-000000000002', v_med1, v_suc,
         25, 5, 10, 'a1000000-0000-0000-0000-000000000001',
         'bloque_procedimiento', 137500, 200000, 'Vasect OS', true),

        -- Circuncisión ZSR (Pabellón 1)
        ('e5000000-0000-0000-0000-000000000003',
         v_emp, 'c3000000-0000-0000-0000-000000000003', v_med1, v_suc,
         25, 5, 10, 'a1000000-0000-0000-0000-000000000001',
         'bloque_procedimiento', 137500, 250000, 'Circunc ZSR OS', true),

        -- Próstata Rezum (Sala Procedimientos)
        ('e5000000-0000-0000-0000-000000000004',
         v_emp, 'c3000000-0000-0000-0000-000000000005', v_med1, v_suc,
         60, 10, 20, 'a1000000-0000-0000-0000-000000000004',
         'cirugia_general', NULL, 800000, 'Rezum OS', true),

        -- Biopsia Fusión (Sala Procedimientos)
        ('e5000000-0000-0000-0000-000000000005',
         v_emp, 'c3000000-0000-0000-0000-000000000006', v_med1, v_suc,
         45, 10, 15, 'a1000000-0000-0000-0000-000000000004',
         'cirugia_general', NULL, 400000, 'Biopsia Fusión OS', true),

        -- Nefrolitotomía (Pabellón 1, cirugía mayor)
        ('e5000000-0000-0000-0000-000000000006',
         v_emp, 'c3000000-0000-0000-0000-000000000008', v_med1, v_suc,
         120, 15, 20, 'a1000000-0000-0000-0000-000000000001',
         'bloque_procedimiento', 137500, 600000, 'NLP OS', true),

        -- HoLEP (Pabellón 1)
        ('e5000000-0000-0000-0000-000000000007',
         v_emp, 'c3000000-0000-0000-0000-000000000009', v_med1, v_suc,
         90, 15, 20, 'a1000000-0000-0000-0000-000000000001',
         'bloque_procedimiento', 137500, 550000, 'HoLEP OS', true),

        -- Control post-op (Box 1)
        ('e5000000-0000-0000-0000-000000000008',
         v_emp, 'c3000000-0000-0000-0000-000000000010', v_med1, v_suc,
         15, 0, 5, 'a1000000-0000-0000-0000-000000000002',
         'fijo', NULL, 30000, 'Control OS', true),

        -- URS (Pabellón 1)
        ('e5000000-0000-0000-0000-000000000009',
         v_emp, 'c3000000-0000-0000-0000-000000000016', v_med1, v_suc,
         60, 10, 15, 'a1000000-0000-0000-0000-000000000001',
         'cirugia_general', NULL, 350000, 'URS OS', true),

        -- ── Dr. Altamirano ───────────────────────────────────────────

        -- Consulta general (Box 2)
        ('e5000000-0000-0000-0000-000000000010',
         v_emp, 'c3000000-0000-0000-0000-000000000001', v_med2, v_suc,
         20, 0, 5, 'a1000000-0000-0000-0000-000000000003',
         'fijo', NULL, 50000, 'Consulta CA', true),

        -- Circuncisión con suturas (Pabellón 1)
        ('e5000000-0000-0000-0000-000000000011',
         v_emp, 'c3000000-0000-0000-0000-000000000004', v_med2, v_suc,
         45, 5, 10, 'a1000000-0000-0000-0000-000000000001',
         'cirugia_general', NULL, 200000, 'Circunc Sut CA', true),

        -- Cistoscopia (Sala Procedimientos)
        ('e5000000-0000-0000-0000-000000000012',
         v_emp, 'c3000000-0000-0000-0000-000000000007', v_med2, v_suc,
         30, 5, 10, 'a1000000-0000-0000-0000-000000000004',
         'fijo', NULL, 80000, 'Cisto CA', true),

        -- LEOC (Sala Procedimientos)
        ('e5000000-0000-0000-0000-000000000013',
         v_emp, 'c3000000-0000-0000-0000-000000000015', v_med2, v_suc,
         45, 5, 10, 'a1000000-0000-0000-0000-000000000004',
         'fijo', NULL, 150000, 'LEOC CA', true),

        -- Orquidopexia (Pabellón 1)
        ('e5000000-0000-0000-0000-000000000014',
         v_emp, 'c3000000-0000-0000-0000-000000000012', v_med2, v_suc,
         50, 10, 10, 'a1000000-0000-0000-0000-000000000001',
         'cirugia_general', NULL, 250000, 'Orquidopexia CA', true),

        -- Uretroplastia (Pabellón 1)
        ('e5000000-0000-0000-0000-000000000015',
         v_emp, 'c3000000-0000-0000-0000-000000000014', v_med2, v_suc,
         90, 15, 20, 'a1000000-0000-0000-0000-000000000001',
         'cirugia_general', NULL, 500000, 'Uretroplastia CA', true),

        -- ── Dra. Miranda (staging) ───────────────────────────────────

        -- Consulta general (Box 2)
        ('e5000000-0000-0000-0000-000000000016',
         v_emp, 'c3000000-0000-0000-0000-000000000001', v_med3, v_suc,
         20, 0, 5, 'a1000000-0000-0000-0000-000000000003',
         'fijo', NULL, 50000, 'Consulta CM', true),

        -- Orquidopexia (Pabellón 1)
        ('e5000000-0000-0000-0000-000000000017',
         v_emp, 'c3000000-0000-0000-0000-000000000012', v_med3, v_suc,
         50, 10, 10, 'a1000000-0000-0000-0000-000000000001',
         'cirugia_general', NULL, 220000, 'Orquidopexia CM', true);

    RAISE NOTICE '✓ Service Builder (mpaci_servicios_config): 17 configuraciones cargadas';
END $$;

-- ============================================================
-- PASO 26 — Honorarios de bloque (mpaci_honorarios_bloque)
--           Schatloff: bloque mañana pasado + hoy + futuro
-- ============================================================
DO $$
DECLARE
    v_emp  UUID := 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    v_suc  UUID := 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    v_med1 UUID;
    v_med3 UUID := 'b2000000-0000-0000-0000-000000000001';
    v_admin UUID;
BEGIN
    SELECT id INTO v_med1 FROM public.mpaci_usuarios
    WHERE email = 'dr.schatloff@urbamed.cl' AND empresa_id = v_emp LIMIT 1;
    IF v_med1 IS NULL THEN v_med1 := v_med3; END IF;

    SELECT id INTO v_admin FROM public.mpaci_usuarios
    WHERE email = 'carlos@sditecnologia.cl' AND empresa_id = v_emp LIMIT 1;

    INSERT INTO public.mpaci_honorarios_bloque
        (empresa_id, medico_id, sucursal_id, fecha, bloque_rango,
         monto, estado, confirmado_en, confirmado_por)
    VALUES
        -- Bloque mañana hace 28 días (confirmado — URS + consulta)
        (v_emp, v_med1, v_suc,
         (now()-interval'28 days')::date,
         tstzrange(
             date_trunc('day', now()-interval'28 days') + time'08:00',
             date_trunc('day', now()-interval'28 days') + time'13:00'
         ),
         137500, 'confirmado',
         now()-interval'27 days', v_admin),

        -- Bloque tarde hace 25 días (confirmado — URS Ricardo Peña)
        (v_emp, v_med1, v_suc,
         (now()-interval'25 days')::date,
         tstzrange(
             date_trunc('day', now()-interval'25 days') + time'08:00',
             date_trunc('day', now()-interval'25 days') + time'13:00'
         ),
         137500, 'confirmado',
         now()-interval'24 days', v_admin),

        -- Bloque hace 18 días (confirmado — Vasectomía Felipe Castro)
        (v_emp, v_med1, v_suc,
         (now()-interval'18 days')::date,
         tstzrange(
             date_trunc('day', now()-interval'18 days') + time'08:00',
             date_trunc('day', now()-interval'18 days') + time'13:00'
         ),
         137500, 'confirmado',
         now()-interval'17 days', v_admin),

        -- Bloque hace 15 días (confirmado — Biopsia fusión)
        (v_emp, v_med1, v_suc,
         (now()-interval'15 days')::date,
         tstzrange(
             date_trunc('day', now()-interval'15 days') + time'08:00',
             date_trunc('day', now()-interval'15 days') + time'13:00'
         ),
         137500, 'confirmado',
         now()-interval'14 days', v_admin),

        -- Bloque HOY mañana (pendiente confirmación — Rezum + HoLEP)
        (v_emp, v_med1, v_suc,
         date_trunc('day', now())::date,
         tstzrange(
             date_trunc('day', now()) + time'08:00',
             date_trunc('day', now()) + time'13:00'
         ),
         137500, 'pendiente_confirmacion',
         NULL, NULL),

        -- Bloque próxima semana (auto generado — NLP Héctor Gutiérrez)
        (v_emp, v_med1, v_suc,
         (date_trunc('week', now()) + interval'7 days')::date,
         tstzrange(
             date_trunc('week', now()) + interval'7 days' + time'07:30',
             date_trunc('week', now()) + interval'7 days' + time'13:30'
         ),
         137500, 'auto',
         NULL, NULL);

    RAISE NOTICE '✓ Honorarios de bloque: 6 registros cargados';
END $$;

-- ============================================================
-- PASO 27 — CRM: Prospectos + Actividades
--           Cubre TAB CRM de Vista de Contacto Integrada V2.3
-- ============================================================
DO $$
DECLARE
    v_emp       UUID := 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    v_asistente UUID;
    v_med1      UUID;
    v_admin     UUID;
    v_med3      UUID := 'b2000000-0000-0000-0000-000000000001';

    -- IDs prospectos (fijos para referenciar en actividades)
    v_p1 UUID := 'aa000000-0000-0000-0000-000000000001';
    v_p2 UUID := 'aa000000-0000-0000-0000-000000000002';
    v_p3 UUID := 'aa000000-0000-0000-0000-000000000003';
    v_p4 UUID := 'aa000000-0000-0000-0000-000000000004';
    v_p5 UUID := 'aa000000-0000-0000-0000-000000000005';
    v_p6 UUID := 'aa000000-0000-0000-0000-000000000006';
    v_p7 UUID := 'aa000000-0000-0000-0000-000000000007';
    v_p8 UUID := 'aa000000-0000-0000-0000-000000000008';
BEGIN
    SELECT id INTO v_asistente FROM public.mpaci_usuarios
    WHERE email = 'sditecnologiachile@gmail.com' AND empresa_id = v_emp LIMIT 1;
    IF v_asistente IS NULL THEN v_asistente := 'b2000000-0000-0000-0000-000000000002'; END IF;

    SELECT id INTO v_med1 FROM public.mpaci_usuarios
    WHERE email = 'dr.schatloff@urbamed.cl' AND empresa_id = v_emp LIMIT 1;
    IF v_med1 IS NULL THEN v_med1 := v_med3; END IF;

    SELECT id INTO v_admin FROM public.mpaci_usuarios
    WHERE email = 'carlos@sditecnologia.cl' AND empresa_id = v_emp LIMIT 1;

    -- ── Prospectos ───────────────────────────────────────────────────
    -- Embudos mixtos: Ganado, Perdido, En seguimiento, Interesado, Agendado

    INSERT INTO public.mpaci_prospectos
        (id, contacto_id, responsable_id, estado, servicio_id, empresa_id,
         campos_personalizados)
    VALUES
        -- Ganados (ya agendados y realizados)
        (v_p1, 'd4000000-0000-0000-0000-000000000004', v_asistente,
         'Ganado', 'c3000000-0000-0000-0000-000000000002', v_emp,
         '{"fuente":"web","canal_primer_contacto":"formulario","notas_comerciales":"Paciente joven, decisión rápida. Pareja coordinada."}'::jsonb),

        (v_p2, 'd4000000-0000-0000-0000-000000000002', v_asistente,
         'Ganado', 'c3000000-0000-0000-0000-000000000016', v_emp,
         '{"fuente":"derivacion","derivado_por":"Dr. Saavedra HCH","notas_comerciales":"Urgencia cólico renal. Cirugía coordinada misma semana."}'::jsonb),

        (v_p3, 'd4000000-0000-0000-0000-000000000006', v_med1,
         'Ganado', 'c3000000-0000-0000-0000-000000000006', v_emp,
         '{"fuente":"derivacion","derivado_por":"Oncólogo CTO","notas_comerciales":"Vigilancia activa PCa. Familia muy presente. 2da biopsia coordinada."}'::jsonb),

        -- Agendados (cita futura confirmada)
        (v_p4, 'd4000000-0000-0000-0000-000000000011', v_asistente,
         'Agendado', 'c3000000-0000-0000-0000-000000000008', v_emp,
         '{"fuente":"whatsapp","notas_comerciales":"Nefrolitiasis bilateral. Espera largo tiempo. Muy motivado."}'::jsonb),

        (v_p5, 'd4000000-0000-0000-0000-000000000008', v_asistente,
         'Agendado', 'c3000000-0000-0000-0000-000000000009', v_emp,
         '{"fuente":"telefono","notas_comerciales":"BPH severo. Retención previa. Coordinó con cardiólogo antes de cirugía."}'::jsonb),

        -- En seguimiento (evaluados, pendiente decisión)
        (v_p6, 'd4000000-0000-0000-0000-000000000007', v_asistente,
         'En seguimiento', 'c3000000-0000-0000-0000-000000000014', v_emp,
         '{"fuente":"web","notas_comerciales":"Estenosis uretral. Duda entre uretroplastia aquí vs. Hospital UC. Enviar comparativo."}'::jsonb),

        (v_p7, 'd4000000-0000-0000-0000-000000000012', v_asistente,
         'Interesado', 'c3000000-0000-0000-0000-000000000012', v_emp,
         '{"fuente":"web","notas_comerciales":"Varicocele + fertilidad. Pareja en paralelo con ginecólogo. Espera resultado semen."}'::jsonb),

        -- Perdido
        (v_p8, 'd4000000-0000-0000-0000-000000000005', v_asistente,
         'Perdido', 'c3000000-0000-0000-0000-000000000007', v_emp,
         '{"fuente":"web","motivo_perdida":"precio","notas_comerciales":"Paciente fue a Hospital Barros Luco por costo. Cistoscopia gratuita ahí."}'::jsonb);

    -- ── Actividades (tareas y seguimientos del CRM) ─────────────────

    INSERT INTO public.mpaci_actividades
        (prospecto_id, contacto_id, asignado_a_id, asignado_por,
         tipo_actividad, titulo, descripcion,
         fecha_vencimiento, estado, prioridad, categoria)
    VALUES
        -- Seguimiento Felipe Castro (Ganado) — post vasectomía
        (v_p1, 'd4000000-0000-0000-0000-000000000004', v_asistente, v_asistente,
         'Llamada', 'Confirmar espermatograma 3 meses',
         'Llamar para recordar examen espermatograma de control post-vasectomía',
         now() + interval'75 days', 'pendiente', 'alta', 'clinica'),

        -- Seguimiento Gonzalo Herrera (Ganado) — resultado biopsia
        (v_p3, 'd4000000-0000-0000-0000-000000000006', v_med1, v_admin,
         'Seguimiento', 'Llamada resultado AP biopsia',
         'Contactar para informar resultado anatomía patológica y coordinar próxima RM en 6 meses',
         now()-interval'7 days', 'completada', 'urgente', 'clinica'),

        -- Seguimiento Héctor Gutiérrez (Agendado) — confirmar cirugía NLP
        (v_p4, 'd4000000-0000-0000-0000-000000000011', v_asistente, v_asistente,
         'WhatsApp', 'Confirmar preparación NLP',
         'Enviar instrucciones pre-operatorias NLP: ayuno 8h, suspender AAS 7 días antes, traer TAC impreso',
         now() + interval'5 days', 'pendiente', 'alta', 'administrativa'),

        -- Seguimiento Patricio Vargas (Agendado) — HoLEP
        (v_p5, 'd4000000-0000-0000-0000-000000000008', v_asistente, v_asistente,
         'Llamada', 'Coordinar evaluación preoperatoria HoLEP',
         'Confirmar evaluación cardiológica y función renal antes de HoLEP. Solicitar TFG actualizado.',
         now() + interval'3 days', 'pendiente', 'alta', 'clinica'),

        -- Seguimiento Diego Torres (En seguimiento) — uretroplastia
        (v_p6, 'd4000000-0000-0000-0000-000000000007', v_asistente, v_asistente,
         'Email', 'Enviar comparativo de técnicas uretroplastia',
         'Preparar y enviar documento comparativo Urbamed vs. alternativas para decisión del paciente',
         now() + interval'2 days', 'pendiente', 'normal', 'comercial'),

        -- Seguimiento Andrés Bravo (Interesado) — varicocele
        (v_p7, 'd4000000-0000-0000-0000-000000000012', v_asistente, v_asistente,
         'Seguimiento', 'Esperar resultado seminograma',
         'No contactar hasta que paciente confirme resultado de análisis seminal. Reactivar en 2 semanas.',
         now() + interval'14 days', 'pendiente', 'normal', 'comercial'),

        -- Actividad completada — consulta inicial Manuel Cortés
        (NULL, 'd4000000-0000-0000-0000-000000000001', v_asistente, v_asistente,
         'Llamada', 'Llamada bienvenida post-consulta',
         'Llamar para confirmar que recibió indicaciones y tiene Tamsulosina. Recordar control en 6 semanas.',
         now()-interval'27 days', 'completada', 'normal', 'administrativa'),

        -- Actividad pendiente — Ricardo Peña retiro DJ
        (v_p2, 'd4000000-0000-0000-0000-000000000002', v_asistente, v_asistente,
         'Llamada', 'Confirmar retiro catéter DJ',
         'Coordinar fecha retiro doble J. Cita debe ser en sala procedimientos con cistoscopio disponible.',
         now() + interval'1 day', 'pendiente', 'alta', 'clinica');

    -- ── Timeline CRM para los prospectos ────────────────────────────
    INSERT INTO public.mpaci_timeline_eventos
        (empresa_id, contacto_id, origen, referencia_id, referencia_tabla,
         descripcion, usuario_id, es_automatico, creado_en)
    VALUES
        (v_emp, 'd4000000-0000-0000-0000-000000000004',
         'crm', v_p1, 'mpaci_prospectos',
         'Prospecto creado — Vasectomía sin bisturí (vía web)',
         v_asistente, false, now()-interval'20 days'),

        (v_emp, 'd4000000-0000-0000-0000-000000000004',
         'crm', v_p1, 'mpaci_prospectos',
         'Estado cambiado: Nuevo → Agendado',
         v_asistente, false, now()-interval'19 days'),

        (v_emp, 'd4000000-0000-0000-0000-000000000004',
         'crm', v_p1, 'mpaci_prospectos',
         'Estado cambiado: Agendado → Ganado — cirugía realizada',
         v_asistente, false, now()-interval'18 days'),

        (v_emp, 'd4000000-0000-0000-0000-000000000006',
         'crm', v_p3, 'mpaci_prospectos',
         'Prospecto creado — Biopsia Fusión (derivación oncólogo)',
         v_asistente, false, now()-interval'17 days'),

        (v_emp, 'd4000000-0000-0000-0000-000000000006',
         'crm', v_p3, 'mpaci_prospectos',
         'Estado cambiado: Interesado → Ganado — biopsia realizada',
         v_asistente, false, now()-interval'15 days'),

        (v_emp, 'd4000000-0000-0000-0000-000000000005',
         'crm', v_p8, 'mpaci_prospectos',
         'Estado cambiado: En seguimiento → Perdido — paciente eligió servicio público por costo',
         v_asistente, false, now()-interval'5 days'),

        (v_emp, 'd4000000-0000-0000-0000-000000000011',
         'crm', v_p4, 'mpaci_prospectos',
         'Prospecto creado — Nefrolitotomía (WhatsApp)',
         v_asistente, false, now()-interval'10 days'),

        (v_emp, 'd4000000-0000-0000-0000-000000000011',
         'crm', v_p4, 'mpaci_prospectos',
         'Estado cambiado: Interesado → Agendado — NLP coordinada próxima semana',
         v_asistente, false, now()-interval'3 days');

    RAISE NOTICE '✓ CRM: 8 prospectos + 8 actividades + 8 eventos timeline cargados';
END $$;

-- ============================================================
-- PASO 28 — Servicio + Citas quirúrgicas adicionales
--           Diego Torres (Uretroplastia) + Andrés Bravo (Varicocelectomía)
-- ============================================================

-- Servicio Varicocelectomía (no estaba en el catálogo)
INSERT INTO public.mpaci_servicios
    (id, nombre, categoria, es_cirugia, duracion_minutos, precio_base,
     activo, empresa_id, roles_sugeridos)
VALUES
    ('c3000000-0000-0000-0000-000000000017',
     'Varicocelectomía Microquirúrgica', 'cirugia', true, 45, 580000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     '{"cirujano":1,"arsenalera":1,"anestesista":1}')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
    v_emp  UUID := 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    v_suc  UUID := 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    v_med2 UUID;
    v_med3 UUID := 'b2000000-0000-0000-0000-000000000001';
BEGIN
    SELECT id INTO v_med2 FROM public.mpaci_usuarios
    WHERE email = 'caltamirano@manmec.cl' AND empresa_id = v_emp LIMIT 1;
    IF v_med2 IS NULL THEN v_med2 := v_med3; END IF;

    INSERT INTO public.mpaci_citas
        (id, empresa_id, sucursal_id, medico_id, contacto_id,
         servicio_id, fecha_inicio, fecha_fin,
         estado_operativo, estado_confirmacion, estado_pago,
         precio_base, cobertura_usada, sala_id)
    VALUES
        -- Diego Torres — Uretroplastia anastomótica (+15 días, Pabellón 1)
        ('99000000-0000-0000-0000-000000000029',
         v_emp, v_suc, v_med2,
         'd4000000-0000-0000-0000-000000000007',
         'c3000000-0000-0000-0000-000000000014',
         date_trunc('day', now()) + interval'15 days' + time'07:30',
         date_trunc('day', now()) + interval'15 days' + time'09:00',
         'Agendada', 'confirmada', 'Abono',
         1500000, 'isapre_cruz_blanca',
         'a1000000-0000-0000-0000-000000000001'),

        -- Andrés Bravo — Varicocelectomía microquirúrgica (+20 días, Pabellón 1)
        ('99000000-0000-0000-0000-000000000030',
         v_emp, v_suc, v_med2,
         'd4000000-0000-0000-0000-000000000012',
         'c3000000-0000-0000-0000-000000000017',
         date_trunc('day', now()) + interval'20 days' + time'08:00',
         date_trunc('day', now()) + interval'20 days' + time'08:45',
         'Agendada', 'no_confirmada', 'No pagado',
         580000, 'isapre_colmena',
         'a1000000-0000-0000-0000-000000000001');

    -- Pacientes principales de las nuevas citas
    INSERT INTO public.mpaci_cita_pacientes
        (empresa_id, cita_id, contacto_id, es_principal, estado_asistencia)
    VALUES
        (v_emp, '99000000-0000-0000-0000-000000000029',
         'd4000000-0000-0000-0000-000000000007', true, 'pendiente'),
        (v_emp, '99000000-0000-0000-0000-000000000030',
         'd4000000-0000-0000-0000-000000000012', true, 'pendiente');

    RAISE NOTICE '✓ Citas quirúrgicas adicionales: Uretroplastia (Torres) + Varicocelectomía (Bravo)';
END $$;

-- ============================================================
-- PASO 29 — Fichas clínicas quirúrgicas (datos ricos para frontend)
--           Usa columnas Sprint 6: examen_fisico JSONB, notas_medicas,
--           examenes_solicitados. Cubre todos los tipos de procedimiento.
-- ============================================================
DO $$
DECLARE
    v_emp  UUID := 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    v_med1 UUID;
    v_med2 UUID;
    v_med3 UUID := 'b2000000-0000-0000-0000-000000000001';
BEGIN
    SELECT id INTO v_med1 FROM public.mpaci_usuarios
    WHERE email = 'dr.schatloff@urbamed.cl' AND empresa_id = v_emp LIMIT 1;
    IF v_med1 IS NULL THEN v_med1 := v_med3; END IF;

    SELECT id INTO v_med2 FROM public.mpaci_usuarios
    WHERE email = 'caltamirano@manmec.cl' AND empresa_id = v_emp LIMIT 1;
    IF v_med2 IS NULL THEN v_med2 := v_med3; END IF;

    -- ── fc-006: REZUM — Manuel Cortés (cita HOY 016) ──────────────
    INSERT INTO public.mpaci_fichas_clinicas
        (id, cita_id, medico_id, contenido_texto,
         notas_medicas, examenes_solicitados, notas_examenes,
         examen_fisico, medico_consulta_id,
         creado_en, actualizado_en)
    VALUES (
        'fc000000-0000-0000-0000-000000000006',
        '99000000-0000-0000-0000-000000000016',
        v_med1,
        'PROCEDIMIENTO REZUM — Hiperplasia Prostática Benigna
Paciente: Manuel Ignacio Cortés Vega, 73 años. FONASA.
Diagnóstico: HBP sintomática IPSS 18, próstata 38cc. PSA 4.2 ng/mL.
Antecedentes: DM2 (metformina), HTA (losartán). Alergia a penicilina SEVERA.
IPSS inicial 18 → moderado-severo. Fracaso relativo alfa-bloqueadores (Tamsulosina 6 sem).
INDICACIÓN: Rezum por edad, tamaño prostático, y deseo de preservar función sexual.',
        'Procedimiento Rezum realizado bajo anestesia local. 3 emisiones de vapor en zona de transición (9 seg c/u). Sin complicaciones. Alta inmediata. Inicia Ibuprofeno 400mg c/8h + Ciprofloxacino 500mg c/12h por 5 días. Control con uroflujometría + IPSS en 8 semanas.',
        'Uroflujometría + residuo post-miccional (8 semanas), IPSS score repetir a las 8 semanas, PSA control 6 meses',
        'Próstata 38cc en eco previo. Zona de transición hipertrófica. Uretra sin estenosis. Vejiga sin trabeculación severa.',
        '{"ipss_score": 18, "qmax_ml_s": 7.5, "residuo_post_miccional_ml": 85,
          "volumen_prostatico_cc": 38, "psa_ng_ml": 4.2,
          "tacto_rectal": "grado II, adenomatosa, simétrica, sin nódulos",
          "lma_mm": 22, "pulsos_vapor_aplicados": 3,
          "asa_clasificacion": "II", "alergia_penicilina": true}'::jsonb,
        v_med1,
        now(), now()
    );

    -- ── fc-007: HoLEP — Patricio Vargas (cita HOY 017) ───────────
    INSERT INTO public.mpaci_fichas_clinicas
        (id, cita_id, medico_id, contenido_texto,
         notas_medicas, examenes_solicitados, notas_examenes,
         examen_fisico, medico_consulta_id,
         creado_en, actualizado_en)
    VALUES (
        'fc000000-0000-0000-0000-000000000007',
        '99000000-0000-0000-0000-000000000017',
        v_med1,
        'PROCEDIMIENTO HoLEP — Enucleación Láser Prostática
Paciente: Patricio Luis Vargas Campos, 77 años. Particular.
Diagnóstico: HBP severa IPSS 24. Próstata 85cc. Retención urinaria previa (2 episodios).
Antecedentes: HTA (enalapril), IRC estadio 3 (TFG 42), RTU previa 2015. Alergia contraste yodado SEVERA.
Evaluación preoperatoria: cardiólogo autoriza cirugía. Nefrólogo indica TFG 42 — estable.
ASA III por comorbilidades.',
        'HoLEP realizado bajo raquídea. Enucleación bilobular completa. Adenoma 62g extraído con morcelador. Hemostasia con láser Holmium. Sonda Foley 22Fr instalada con irrigación. Sin complicaciones mayores. Hospitalización 1 noche programada.',
        'Hemograma + VHS post-op mañana, creatinina 48h post-op (IRC vigilancia), orina completa al alta, control uroflujometría + residuo 6 semanas',
        'Hemostasia adecuada intraoperatoria. Sin perforación capsular. Cuello vesical conservado. Irrigación limpia al cierre.',
        '{"ipss_score": 24, "qmax_ml_s": 4.2, "residuo_post_miccional_ml": 180,
          "volumen_prostatico_cc": 85, "psa_ng_ml": 3.1,
          "tacto_rectal": "grado III, lisa, simétrica, sin nódulos",
          "tfg_ml_min": 42, "asa_clasificacion": "III",
          "adenoma_extraido_g": 62, "tecnica": "HoLEP_bilobular",
          "sonda_foley_instalada": true, "sonda_fr": 22,
          "alergia_contraste_yodado": true,
          "rtup_previa": true, "anio_rtup": 2015}'::jsonb,
        v_med1,
        now(), now()
    );

    -- ── fc-008: Circuncisión ZSR — Jorge Muñoz (cita HOY 019) ─────
    INSERT INTO public.mpaci_fichas_clinicas
        (id, cita_id, medico_id, contenido_texto,
         notas_medicas, examenes_solicitados, notas_examenes,
         examen_fisico, medico_consulta_id,
         creado_en, actualizado_en)
    VALUES (
        'fc000000-0000-0000-0000-000000000008',
        '99000000-0000-0000-0000-000000000019',
        v_med2,
        'PROCEDIMIENTO CIRCUNCISIÓN ZSR — Fimosis Grado III
Paciente: Jorge Esteban Muñoz Díaz, 50 años. FONASA.
Diagnóstico: Fimosis congénita grado III + ITU recurrente (3 episodios 2024).
ALERTA CRÍTICA: Alergia a látex — uso de guantes y material libre de látex OBLIGATORIO.
Reagendado: paciente no asistió cita previa (hace 20 días). Hoy confirmado.',
        'Circuncisión ZSR talla T3 bajo anestesia local (lidocaína 2% gel + infiltración). Sin incidencias. Anillo colocado correctamente. Alta inmediata con kit de cuidados. Instrucciones entregadas por escrito.',
        'Control a los 10-14 días (cuando caiga el anillo ZSR), sin exámenes de laboratorio requeridos',
        'Anillo ZSR en posición correcta post-procedimiento. Sin sangrado activo. Herida cubierta con apósito.',
        '{"prepucio": "no retráctil grado III",
          "glande": "sin lesiones visibles, sin balanitis activa",
          "meato": "central permeable",
          "sangrado_activo": false,
          "alergia_latex": true,
          "anillo_zsr_talla": "T3",
          "anestesia_usada": "lidocaína 2% gel + infiltración peribalánica",
          "duracion_procedimiento_min": 15,
          "material_libre_latex": true}'::jsonb,
        v_med2,
        now(), now()
    );

    -- ── fc-009: LEOC — Cristóbal Silva (cita HOY 021) ─────────────
    INSERT INTO public.mpaci_fichas_clinicas
        (id, cita_id, medico_id, contenido_texto,
         notas_medicas, examenes_solicitados, notas_examenes,
         examen_fisico, medico_consulta_id,
         creado_en, actualizado_en)
    VALUES (
        'fc000000-0000-0000-0000-000000000009',
        '99000000-0000-0000-0000-000000000021',
        v_med2,
        'PROCEDIMIENTO LEOC — Litotricia Extracorpórea
Paciente: Cristóbal Matías Silva Reyes, 27 años. FONASA.
Diagnóstico: Cálculo vesical 12mm único. Cistoscopia confirmatoria hace 10 días.
Sin comorbilidades relevantes. Urocultivo negativo pre-procedimiento.',
        'LEOC con equipo Dornier Delta II. 2800 ondas a 16 kV. Buena imagen fluoroscópica del cálculo. Fragmentación eficiente. Procedimiento bien tolerado. Alta inmediata. Filtro de orina indicado para recuperar fragmentos.',
        'Orina completa + sedimento a las 48h, Eco vesical control en 4 semanas para verificar litiasis residual, filtrar orina en casa (instrucción entregada)',
        'Cálculo único vesical 12mm bien delimitado en fluoroscopía. Sin otros cálculos visibles. Vejiga sin trabeculación.',
        '{"calculo_mm": 12,
          "localizacion": "pared_posterior_vejiga",
          "densidad_hu": 980,
          "sesiones_leoc_previas": 0,
          "hidronefrosis": "no",
          "ondas_aplicadas": 2800,
          "kv_usado": 16,
          "fragmentacion": "eficiente",
          "hematuria_post": "leve",
          "urocultivo_previo": "negativo"}'::jsonb,
        v_med2,
        now(), now()
    );

    -- ── fc-010: Orquidopexia — Sebastián Rojas (cita HOY 022) ─────
    INSERT INTO public.mpaci_fichas_clinicas
        (id, cita_id, medico_id, contenido_texto,
         notas_medicas, examenes_solicitados, notas_examenes,
         examen_fisico, medico_consulta_id,
         creado_en, actualizado_en)
    VALUES (
        'fc000000-0000-0000-0000-000000000010',
        '99000000-0000-0000-0000-000000000022',
        v_med3,
        'PROCEDIMIENTO ORQUIDOPEXIA — Hidrocele Izquierdo
Paciente: Sebastián Omar Rojas Fuentes, 35 años. Particular.
Diagnóstico: Hidrocele izquierdo 35ml. Asintomático. Paciente solicita corrección electiva.
Sin patología testicular subyacente. ECO previa confirma testículo normal.',
        'Orquidopexia bajo sedación + anestesia local. Abordaje escrotal. Eversión y plicatura de túnica vaginal (técnica Jaboulay). Hidrocele drenado (35ml líquido ámbar). Sin complicaciones. Alta 2h post procedimiento.',
        'Control 7 días (revisión herida), eco escrotal al mes para confirmar resolución',
        'Herida escrotal izquierda suturada con Vicryl 3-0. Sin sangrado activo. Testículo en posición normal post-fijación.',
        '{"testiculo_afectado": "izquierdo",
          "volumen_hidrocele_ml": 35,
          "liquido_aspecto": "ámbar_claro",
          "testiculo_contralateral": "normal",
          "tecnica": "Jaboulay_eversion_tunica",
          "sutura_usada": "Vicryl 3-0",
          "sangrado_intraop": "minimo",
          "duracion_procedimiento_min": 40}'::jsonb,
        v_med3,
        now(), now()
    );

    -- ── fc-011: NLP pre-op — Héctor Gutiérrez (cita +7 días, 023) ─
    INSERT INTO public.mpaci_fichas_clinicas
        (id, cita_id, medico_id, contenido_texto,
         notas_medicas, examenes_solicitados, notas_examenes,
         examen_fisico, medico_consulta_id,
         creado_en, actualizado_en)
    VALUES (
        'fc000000-0000-0000-0000-000000000011',
        '99000000-0000-0000-0000-000000000023',
        v_med1,
        'PRE-OP NLP — Nefrolitotomía Percutánea Derecha
Paciente: Héctor Ramón Gutiérrez León, 61 años. FONASA.
Diagnóstico: Cálculo coraliforme parcial riñón derecho 25mm + cálculo izq 8mm (seguimiento).
Antecedentes: NLP izquierda 2020 (UC Christus). Alergia a cotrimoxazol.
Contraindicación: NO usar cotrimoxazol — rash cutáneo generalizado.
Evaluación pre-op: TFG 58 ml/min (normal para la edad). Urocultivo negativo.',
        'Evaluación pre-operatoria NLP derecha. Se explica procedimiento, riesgos y alternativas. Paciente firma consentimiento informado. Instrucciones ayuno 8h, suspender AAS 7 días antes, traer TAC impreso. Profilaxis: Ciprofloxacino 500mg noche previa + mañana cirugía (SIN cotrimoxazol).',
        'TAC renal sin contraste (traer impreso día cirugía), hemograma + coagulación + creatinina pre-op, orina completa + cultivo, ECG (61 años)',
        'Paciente en buenas condiciones generales. Sin fiebre. Sin cólico activo. Puño percusión positivo lado derecho.',
        '{"calculo_derecho_mm": 25,
          "tipo_calculo_derecho": "coraliforme_parcial",
          "calculo_izquierdo_mm": 8,
          "densidad_hu_derecho": 1100,
          "tfg_ml_min": 58,
          "obstruccion_derecha": "moderada",
          "urocultivo": "negativo",
          "nlp_previa": true, "anio_nlp_previa": 2020, "lado_nlp_previa": "izquierdo",
          "asa_clasificacion": "II",
          "alergia_cotrimoxazol": true,
          "antibiotico_profilaxis": "Ciprofloxacino 500mg (NO cotrimoxazol)"}'::jsonb,
        v_med1,
        now()-interval'2 days', now()-interval'2 days'
    );

    -- ── fc-012: Biopsia Fusión 2 — Gonzalo Herrera (cita +8 días, 024)
    INSERT INTO public.mpaci_fichas_clinicas
        (id, cita_id, medico_id, contenido_texto,
         notas_medicas, examenes_solicitados, notas_examenes,
         examen_fisico, medico_consulta_id,
         creado_en, actualizado_en)
    VALUES (
        'fc000000-0000-0000-0000-000000000012',
        '99000000-0000-0000-0000-000000000024',
        v_med1,
        'BIOPSIA PRÓSTATA POR FUSIÓN — Vigilancia Activa PCa Gleason 6
Paciente: Gonzalo Patricio Herrera Núñez, 65 años. FONASA.
Diagnóstico: Adenocarcinoma prostático Gleason 6 (3+3) — vigilancia activa.
PSA 6.8 → 7.1 ng/mL en 6 meses (velocidad PSA 0.3 ng/mL/año — dentro del rango VA).
RM mpróstata control: lesión PIRADS 3 zona de transición (sin cambio respecto a previa).
Biopsia previa (hace 15 días): 2/14 cilindros con Gleason 6 < 5% cada uno.
Esta biopsia: protocolo vigilancia activa — confirmar estabilidad.',
        'Pre-biopsia evaluación: PSA 7.1, ratio L/T 18%. RM sin nuevas lesiones. Consentimiento firmado. Profilaxis: Ciprofloxacino 500mg 1h antes. Sedación consciente: Midazolam 2mg + Fentanilo 50mcg. 14 cilindros sistemáticos + 2 dirigidos zona PIRADS 3 zona transición. Abordaje transperineal. Sin complicaciones.',
        'Resultado anatomía patológica en 7-10 días hábiles, PSA control en 6 meses, RM mpróstata control en 12 meses',
        'AP previa: 2/14 Gleason 6 (3+3) < 5%. Sin extensión extracapsular en RM. Sin invasión vesicular seminal.',
        '{"psa_ng_ml": 7.1,
          "psa_previo_ng_ml": 6.8,
          "ratio_libre_total_pct": 18,
          "pirads_actual": "3",
          "pirads_previo": "3",
          "volumen_prostatico_cc": 58,
          "zona_sospechosa": "transicion_anterior",
          "cilindros_tomados": 16,
          "cilindros_sistematicos": 14,
          "cilindros_dirigidos": 2,
          "biopsia_previa_resultado": "Gleason 6 (3+3), 2/14 cilindros <5%",
          "tecnica": "fusion_transperineal",
          "profilaxis": "Ciprofloxacino 500mg 1h pre"}'::jsonb,
        v_med1,
        now()-interval'1 day', now()-interval'1 day'
    );

    -- ── fc-014: Uretroplastia pre-op — Diego Torres (+15 días, 029)
    INSERT INTO public.mpaci_fichas_clinicas
        (id, cita_id, medico_id, contenido_texto,
         notas_medicas, examenes_solicitados, notas_examenes,
         examen_fisico, medico_consulta_id,
         creado_en, actualizado_en)
    VALUES (
        'fc000000-0000-0000-0000-000000000014',
        '99000000-0000-0000-0000-000000000029',
        v_med2,
        'PRE-OP URETROPLASTIA — Estenosis Uretral Bulbar
Paciente: Diego Alejandro Torres Pinto, 32 años. Isapre Cruz Blanca.
Diagnóstico: Estenosis uretral postinfecciosa uretra bulbar 2cm.
Antecedente: 3 dilataciones ambulatorias (HCH 2023) — fracaso con recidiva rápida.
Uretrografía retrógrada y miccional: estenosis única 2cm calibre 6Fr en uretra bulbar.
Uretrometría: Qmax 3.8 ml/s. No candidato a nueva dilatación.',
        'Evaluación pre-operatoria definitiva. Técnica seleccionada: uretroplastia anastomótica término-terminal (2cm permiten resección y anastomosis directa). Riesgo acortamiento mínimo. Anestesia raquídea. Hospitalización 1-2 noches. Sonda Foley 16Fr por 21 días post cirugía. Consentimiento informado firmado.',
        'Uretrografía retrógrada + miccional (traer si tiene de HCH), hemograma + coagulación + creatinina, urocultivo pre-op, ECG',
        'Uretroscopia flexible previa: estenosis densa infranqueable a 2cm del bulbo. Sin fístula. Sin divertículo.',
        '{"longitud_estenosis_cm": 2.0,
          "localizacion": "uretra_bulbar",
          "tipo_estenosis": "postinfecciosa",
          "qmax_ml_s": 3.8,
          "calibre_estenosis_fr": 6,
          "dilataciones_previas": 3,
          "resultado_dilataciones": "fracaso_con_recidiva",
          "tecnica_propuesta": "anastomotica_termino_terminal",
          "asa_clasificacion": "I",
          "duracion_sonda_post_op_dias": 21}'::jsonb,
        v_med2,
        now()+interval'5 days', now()+interval'5 days'
    );

    -- ── fc-015: Varicocelectomía pre-op — Andrés Bravo (+20 días, 030)
    INSERT INTO public.mpaci_fichas_clinicas
        (id, cita_id, medico_id, contenido_texto,
         notas_medicas, examenes_solicitados, notas_examenes,
         examen_fisico, medico_consulta_id,
         creado_en, actualizado_en)
    VALUES (
        'fc000000-0000-0000-0000-000000000015',
        '99000000-0000-0000-0000-000000000030',
        v_med2,
        'PRE-OP VARICOCELECTOMÍA — Varicocele Grado II + Factor Masculino
Paciente: Andrés Tomás Bravo Contreras, 38 años. Isapre Colmena.
Diagnóstico: Varicocele grado II izquierdo. Análisis seminal alterado.
Contexto: Pareja en evaluación por infertilidad (ginecólogo: Dr. Salgado, Clínica Alemana).
Seminograma: concentración 8.2M/ml, motilidad 32%, morfología 3% normales (Kruger).
ECO doppler escrotal: reflujo venoso izquierdo > 2.5 sec. Testículo derecho normal.',
        'Evaluación pre-operatoria varicocelectomía microquirúrgica subinguinal izquierda. Técnica de elección por menor tasa de hidrocele post-op y preservación de arterias testiculares. Anestesia espinal. Hospitalización ambulatoria. Alta el mismo día. Resultado seminal esperado en 3-6 meses post corrección. Esposa informada por ginecólogo tratante.',
        'Seminograma control pre-op (si no tiene uno reciente <3 meses), ECO doppler escrotal (si no tiene), hemograma + coagulación pre-op',
        'ECO doppler: venas pampiniformes izquierdas dilatadas > 3mm con reflujo al Valsalva. Testículo izquierdo levemente hipotrófico vs contralateral.',
        '{"grado_varicocele": "II",
          "lado": "izquierdo",
          "dilatacion_venas_mm": 3.2,
          "reflejo_valsalva": true,
          "seminograma_concentracion_M_ml": 8.2,
          "seminograma_motilidad_pct": 32,
          "morfologia_kruger_pct": 3,
          "volumen_testicular_izq_ml": 14,
          "volumen_testicular_der_ml": 18,
          "tecnica_propuesta": "microsurgica_subinguinal",
          "contexto": "infertilidad_pareja",
          "asa_clasificacion": "I",
          "esperado_mejoria_seminal_meses": "3-6"}'::jsonb,
        v_med2,
        now()+interval'8 days', now()+interval'8 days'
    );

    RAISE NOTICE '✓ Fichas clínicas quirúrgicas: 9 fichas cargadas (Sprint-6 + examen_fisico JSONB)';
END $$;

-- ============================================================
-- RESUMEN FINAL
-- ============================================================
DO $$
DECLARE
    v_n_usuarios  INTEGER;
    v_n_citas     INTEGER;
    v_n_pacientes INTEGER;
    v_n_docs      INTEGER;
    v_n_fichas    INTEGER;
BEGIN
    SELECT count(*) INTO v_n_usuarios  FROM public.mpaci_usuarios  WHERE empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    SELECT count(*) INTO v_n_citas     FROM public.mpaci_citas      WHERE empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    SELECT count(*) INTO v_n_pacientes FROM public.mpaci_contactos  WHERE empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    SELECT count(*) INTO v_n_docs      FROM public.mpaci_documentos WHERE empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    SELECT count(*) INTO v_n_fichas    FROM public.mpaci_fichas_clinicas fc
        JOIN public.mpaci_citas c ON c.id = fc.cita_id WHERE c.empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345';

    RAISE NOTICE '';
    RAISE NOTICE '╔══════════════════════════════════════════════╗';
    RAISE NOTICE '║   RESET + STAGING COMPLETADO                 ║';
    RAISE NOTICE '╠══════════════════════════════════════════════╣';
    RAISE NOTICE '║ Empresa:    Clínica Urología Demo            ║';
    RAISE NOTICE '║ Slug:       clinica-urologia-demo            ║';
    RAISE NOTICE '╠══════════════════════════════════════════════╣';
    RAISE NOTICE '║ Usuarios cargados:  %', v_n_usuarios;
    RAISE NOTICE '║   → admin_general:  Carlos Schatloff        ║';
    RAISE NOTICE '║   → medico:         dr.schatloff@urbamed.cl ║';
    RAISE NOTICE '║   → medico:         Dr. Cristóbal Altamirano║';
    RAISE NOTICE '║   → asistente:      Rosa Vega               ║';
    RAISE NOTICE '║   → enfermera:      María Rojas             ║';
    RAISE NOTICE '║   → staging:        Dra. Miranda + equipo   ║';
    RAISE NOTICE '╠══════════════════════════════════════════════╣';
    RAISE NOTICE '║ Pacientes:   %', v_n_pacientes;
    RAISE NOTICE '║ Citas:       %', v_n_citas;
    RAISE NOTICE '║ Fichas clín: %', v_n_fichas;
    RAISE NOTICE '║ Documentos:  %', v_n_docs;
    RAISE NOTICE '║ Servicios:   17 (urología completa)          ║';
    RAISE NOTICE '╠══════════════════════════════════════════════╣';
    RAISE NOTICE '║ Acceso: /clinica-urologia-demo/agenda/hoy   ║';
    RAISE NOTICE '╚══════════════════════════════════════════════╝';
END $$;

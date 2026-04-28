-- ============================================================
-- RESET COMPLETO + RECARGA STAGING — Un solo disparo
-- ============================================================
-- Qué hace este script:
--   1. Borra todos los datos de negocio (mismo orden que hard_reset_data.sql)
--   2. Recrea empresa y sucursal con UUIDs fijos de desarrollo
--   3. Eleva el usuario admin real (por email) sin pasar por onboarding
--   4. Carga todos los datos de staging (médicos, servicios, citas, etc.)
--
-- ⚠️  NO toca auth.users — los usuarios de Google persisten entre resets.
--     Los usuarios @staging.test se crean con ON CONFLICT DO NOTHING (idempotente).
--
-- Uso: ejecutar completo en el SQL Editor de Supabase (requiere service_role)
-- ============================================================

-- ============================================================
-- PASO 0 — Configura aquí el email del admin real
-- ============================================================
DO $$
BEGIN
    -- Verificar que el usuario admin existe en auth.users antes de continuar
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'carlos@sditecnologia.cl'
    ) THEN
        RAISE EXCEPTION 'Usuario carlos@sditecnologia.cl no encontrado en auth.users. Inicia sesión con Google al menos una vez primero.';
    END IF;
END $$;

-- ============================================================
-- PASO 1 — HARD RESET (borra todos los datos de negocio)
--          Incluye las nuevas tablas de permisos (00048)
-- ============================================================
-- TRUNCATE CASCADE elimina todos los datos ignorando el orden de FKs.
-- Solo trunca tablas que existen (seguro ante migraciones pendientes).
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
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = t
    );

    IF v_existing IS NOT NULL THEN
        EXECUTE 'TRUNCATE TABLE ' || v_existing || ' CASCADE';
    END IF;

    RAISE NOTICE '✓ Hard reset completado (TRUNCATE CASCADE).';
END $$;

-- ============================================================
-- PASO 2 — Empresa + Sucursal con UUIDs fijos de desarrollo
-- ============================================================
INSERT INTO public.mpaci_empresas (id, slug, nombre, plan_suscripcion, activo)
VALUES (
    'd837f400-60b5-4b53-b0df-2b9a71b12345',
    'urbamed',
    'Urbamed IA',
    'pro',
    true
);

INSERT INTO public.mpaci_sucursales (id, empresa_id, nombre, direccion, activo)
VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'd837f400-60b5-4b53-b0df-2b9a71b12345',
    'Sede Principal Santiago',
    'Av. Providencia 1234, Oficina 501',
    true
);

-- ============================================================
-- PASO 3 — Elevar usuario admin real (sin pasar por onboarding)
-- ============================================================
DO $$
DECLARE
    v_user_id   UUID;
    v_email     TEXT := 'carlos@sditecnologia.cl';
    v_nombre    TEXT;
BEGIN
    SELECT id, COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name',
        split_part(email, '@', 1)
    )
    INTO v_user_id, v_nombre
    FROM auth.users
    WHERE email = v_email
    LIMIT 1;

    INSERT INTO public.mpaci_usuarios
        (id, email, nombre_completo, empresa_id, rol, onboarding_completado)
    VALUES
        (v_user_id, v_email, v_nombre,
         'd837f400-60b5-4b53-b0df-2b9a71b12345',
         'admin_general', true)
    ON CONFLICT (id) DO UPDATE SET
        nombre_completo       = EXCLUDED.nombre_completo,
        empresa_id            = EXCLUDED.empresa_id,
        rol                   = EXCLUDED.rol,
        onboarding_completado = EXCLUDED.onboarding_completado;

    -- Sembrar permisos completos de admin_general
    PERFORM public.seed_permisos_por_rol(
        v_user_id,
        'd837f400-60b5-4b53-b0df-2b9a71b12345',
        'admin_general'::app_role,
        NULL
    );

    RAISE NOTICE '✓ Usuario admin elevado: % (%)', v_nombre, v_email;
END $$;

-- ============================================================
-- PASO 4 — Usuarios de staging en auth.users (idempotente)
-- ============================================================
INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at
)
VALUES
    ('b2000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'dr.garcia@staging.test', now(), '{"full_name":"Dr. Jaime García"}', now(), now()),

    ('b2000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'dr.rojas@staging.test', now(), '{"full_name":"Dra. Elizabeth Rojas"}', now(), now()),

    ('b2000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'dr.munoz@staging.test', now(), '{"full_name":"Dr. Roberto Muñoz"}', now(), now()),

    ('b2000000-0000-0000-0000-000000000004',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'asistente.torres@staging.test', now(), '{"full_name":"Valentina Torres"}', now(), now()),

    ('b2000000-0000-0000-0000-000000000005',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'asistente.perez@staging.test', now(), '{"full_name":"Catalina Pérez"}', now(), now()),

    ('b2000000-0000-0000-0000-000000000006',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'enfermera.soto@staging.test', now(), '{"full_name":"Patricia Soto"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PASO 5 — Perfiles de staging en mpaci_usuarios
-- ON CONFLICT DO UPDATE: el trigger handle_new_user() puede crear filas vacías
-- cuando PASO 4 inserta en auth.users; el UPSERT las completa correctamente.
-- ============================================================
INSERT INTO public.mpaci_usuarios
    (id, email, nombre_completo, empresa_id, rol, onboarding_completado)
VALUES
    ('b2000000-0000-0000-0000-000000000001', 'dr.garcia@staging.test',
     'Dr. Jaime García', 'd837f400-60b5-4b53-b0df-2b9a71b12345', 'medico', true),

    ('b2000000-0000-0000-0000-000000000002', 'dr.rojas@staging.test',
     'Dra. Elizabeth Rojas', 'd837f400-60b5-4b53-b0df-2b9a71b12345', 'medico', true),

    ('b2000000-0000-0000-0000-000000000003', 'dr.munoz@staging.test',
     'Dr. Roberto Muñoz', 'd837f400-60b5-4b53-b0df-2b9a71b12345', 'medico', true),

    ('b2000000-0000-0000-0000-000000000004', 'asistente.torres@staging.test',
     'Valentina Torres', 'd837f400-60b5-4b53-b0df-2b9a71b12345', 'asistente', true),

    ('b2000000-0000-0000-0000-000000000005', 'asistente.perez@staging.test',
     'Catalina Pérez', 'd837f400-60b5-4b53-b0df-2b9a71b12345', 'asistente', true),

    ('b2000000-0000-0000-0000-000000000006', 'enfermera.soto@staging.test',
     'Patricia Soto', 'd837f400-60b5-4b53-b0df-2b9a71b12345', 'enfermera_tens', true)
ON CONFLICT (id) DO UPDATE SET
    email                 = EXCLUDED.email,
    nombre_completo       = EXCLUDED.nombre_completo,
    empresa_id            = EXCLUDED.empresa_id,
    rol                   = EXCLUDED.rol,
    onboarding_completado = EXCLUDED.onboarding_completado;

-- Sembrar permisos para todos los usuarios de staging
SELECT public.seed_permisos_por_rol(id, empresa_id, rol::app_role, NULL)
FROM public.mpaci_usuarios
WHERE empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345';

-- ============================================================
-- PASO 6 — Asignaciones asistente ↔ médico
-- ============================================================
INSERT INTO public.mpaci_asignaciones_medico
    (empresa_id, asistente_id, medico_id, activo)
VALUES
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     'b2000000-0000-0000-0000-000000000004',
     'b2000000-0000-0000-0000-000000000001', true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     'b2000000-0000-0000-0000-000000000004',
     'b2000000-0000-0000-0000-000000000002', true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     'b2000000-0000-0000-0000-000000000005',
     'b2000000-0000-0000-0000-000000000003', true);

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
     'Box Consulta 1', 'Consulta urológica general', true);

-- ============================================================
-- PASO 8 — Servicios
-- ============================================================
INSERT INTO public.mpaci_servicios
    (id, nombre, categoria, es_cirugia, duracion_minutos, precio_base,
     activo, empresa_id, roles_sugeridos)
VALUES
    ('c3000000-0000-0000-0000-000000000001',
     'Consulta Urología General', 'consulta', false, 20, 50000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"medico":1}'),

    ('c3000000-0000-0000-0000-000000000002',
     'Vasectomía', 'cirugia', true, 45, 490000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"cirujano":1,"anestesista":1,"arsenalera":1}'),

    ('c3000000-0000-0000-0000-000000000003',
     'Circuncisión Adulto', 'cirugia', true, 40, 490000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"cirujano":1,"arsenalera":1}'),

    ('c3000000-0000-0000-0000-000000000004',
     'Nefrolitotomía Percutánea', 'cirugia', true, 120, 1800000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"cirujano":1,"ayudante":1,"anestesista":1,"arsenalera":1}'),

    ('c3000000-0000-0000-0000-000000000005',
     'Cistoscopia Diagnóstica', 'procedimiento', false, 30, 180000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"medico":1,"arsenalera":1}'),

    ('c3000000-0000-0000-0000-000000000006',
     'Control Post-Operatorio', 'control', false, 15, 25000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345', '{"medico":1}');

-- ============================================================
-- PASO 9 — Servicios config (Service Builder)
-- ============================================================
INSERT INTO public.mpaci_servicios_config (
    id, empresa_id, servicio_id, medico_id, sucursal_id,
    duracion_minutos, buffer_pre_min, buffer_post_min,
    sala_id, modelo_honorarios, monto_bloque, monto_por_cirugia,
    unidad_honorario, modo_bloque, honorarios_por_rol,
    pct_no_realizada, fee_cancelacion_tardia, activo
)
VALUES
    ('e5000000-0000-0000-0000-000000000001',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'c3000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000001',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     45, 5, 10, 'a1000000-0000-0000-0000-000000000001',
     'bloque_procedimiento', 137500, 250000, 'caso', 'automatico',
     '{"cirujano":250000,"anestesista":80000,"arsenalera":35000}', 50, 30000, true),

    ('e5000000-0000-0000-0000-000000000002',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'c3000000-0000-0000-0000-000000000004',
     'b2000000-0000-0000-0000-000000000001',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     120, 15, 20, 'a1000000-0000-0000-0000-000000000001',
     'cirugia_general', 137500, 500000, 'caso', 'automatico',
     '{"cirujano":350000,"ayudante":80000,"anestesista":150000,"arsenalera":50000}', 0, 50000, true),

    ('e5000000-0000-0000-0000-000000000003',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'c3000000-0000-0000-0000-000000000006',
     'b2000000-0000-0000-0000-000000000001',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     15, 0, 5, 'a1000000-0000-0000-0000-000000000002',
     'fijo', 30000, NULL, 'caso', NULL,
     '{"medico":30000}', 100, 0, true),

    ('e5000000-0000-0000-0000-000000000004',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'c3000000-0000-0000-0000-000000000003',
     'b2000000-0000-0000-0000-000000000002',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     40, 5, 10, 'a1000000-0000-0000-0000-000000000001',
     'cirugia_general', NULL, 10000, 'caso', NULL,
     '{"cirujano":10000,"arsenalera":35000}', 50, 20000, true),

    ('e5000000-0000-0000-0000-000000000005',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'c3000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000002',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     45, 5, 10, 'a1000000-0000-0000-0000-000000000001',
     'cirugia_general', NULL, 10000, 'caso', NULL,
     '{"cirujano":10000,"arsenalera":35000}', 50, 20000, true),

    ('e5000000-0000-0000-0000-000000000006',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'c3000000-0000-0000-0000-000000000001',
     'b2000000-0000-0000-0000-000000000003',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     20, 0, 0, 'a1000000-0000-0000-0000-000000000002',
     'fijo', 50000, NULL, 'caso', NULL,
     '{"medico":50000}', 100, 0, true),

    ('e5000000-0000-0000-0000-000000000007',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'c3000000-0000-0000-0000-000000000005',
     'b2000000-0000-0000-0000-000000000003',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     30, 5, 5, 'a1000000-0000-0000-0000-000000000001',
     'fijo', 80000, NULL, 'caso', NULL,
     '{"medico":80000,"arsenalera":25000}', 50, 15000, true);

-- ============================================================
-- PASO 10 — Horarios prestador
-- ============================================================
INSERT INTO public.mpaci_horarios_prestador
    (empresa_id, medico_id, sucursal_id, dia_semana, hora_inicio, hora_fin, activo)
VALUES
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000001','f47ac10b-58cc-4372-a567-0e02b2c3d479',1,'07:30','13:30',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000001','f47ac10b-58cc-4372-a567-0e02b2c3d479',3,'07:30','13:30',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000001','f47ac10b-58cc-4372-a567-0e02b2c3d479',5,'07:30','13:30',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000001','f47ac10b-58cc-4372-a567-0e02b2c3d479',2,'14:00','18:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000001','f47ac10b-58cc-4372-a567-0e02b2c3d479',4,'14:00','18:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000002','f47ac10b-58cc-4372-a567-0e02b2c3d479',2,'08:00','14:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000002','f47ac10b-58cc-4372-a567-0e02b2c3d479',4,'08:00','14:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000002','f47ac10b-58cc-4372-a567-0e02b2c3d479',5,'08:00','14:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000003','f47ac10b-58cc-4372-a567-0e02b2c3d479',1,'09:00','17:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000003','f47ac10b-58cc-4372-a567-0e02b2c3d479',2,'09:00','17:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000003','f47ac10b-58cc-4372-a567-0e02b2c3d479',3,'09:00','17:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000003','f47ac10b-58cc-4372-a567-0e02b2c3d479',4,'09:00','17:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000003','f47ac10b-58cc-4372-a567-0e02b2c3d479',5,'09:00','17:00',true);

INSERT INTO public.mpaci_horarios_pausas (horario_id, hora_inicio, hora_fin, motivo)
SELECT hp.id, '13:00', '14:00', 'Colación'
FROM public.mpaci_horarios_prestador hp
WHERE hp.medico_id = 'b2000000-0000-0000-0000-000000000003'
  AND hp.dia_semana IN (1,2,3,4,5);

INSERT INTO public.mpaci_horarios_excepciones
    (empresa_id, medico_id, fecha, tipo, motivo)
VALUES (
    'd837f400-60b5-4b53-b0df-2b9a71b12345',
    'b2000000-0000-0000-0000-000000000001',
    (date_trunc('week', now()) + interval '9 days')::date,
    'no_disponible',
    'Congreso de Urología — Viña del Mar'
);

-- ============================================================
-- PASO 11 — Equipamiento e insumos
-- ============================================================
INSERT INTO public.mpaci_equipamiento
    (id, empresa_id, sucursal_id, nombre, descripcion, activo)
VALUES
    ('f6000000-0000-0000-0000-000000000001',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Cistoscopio Olympus CYF-VH', 'Videocistoscopio flexible HD', true),
    ('f6000000-0000-0000-0000-000000000002',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Nefrolitotriptor Lithocut', 'Sistema de litotricia percutánea', true);

INSERT INTO public.mpaci_insumos
    (id, empresa_id, sucursal_id, nombre, unidad, stock_actual, stock_minimo, activo)
VALUES
    ('f6000000-0000-0000-0000-000000000010',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Sonda Foley 16Fr', 'unidad', 50, 10, true),
    ('f6000000-0000-0000-0000-000000000011',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Sutura Vicryl 3-0', 'unidad', 30, 5, true),
    ('f6000000-0000-0000-0000-000000000012',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'Lidocaína Gel 2%', 'ml', 500, 100, true);

-- ============================================================
-- PASO 12 — Pacientes
-- ============================================================
INSERT INTO public.mpaci_contactos
    (id, empresa_id, nombre, rut, telefono, email,
     canal_origen, prevision, genero, fecha_nacimiento)
VALUES
    ('d4000000-0000-0000-0000-000000000001','d837f400-60b5-4b53-b0df-2b9a71b12345',
     'Carlos Herrera Vega','12.345.678-9','+56912345001','carlos.herrera@gmail.com','web','fonasa','masculino','1978-03-15'),
    ('d4000000-0000-0000-0000-000000000002','d837f400-60b5-4b53-b0df-2b9a71b12345',
     'Miguel Ángel Torres','13.456.789-0','+56912345002','mangel.torres@gmail.com','derivacion','isapre_banmedica','masculino','1985-07-22'),
    ('d4000000-0000-0000-0000-000000000003','d837f400-60b5-4b53-b0df-2b9a71b12345',
     'Roberto Fuentes Díaz','14.567.890-1','+56912345003',NULL,'telefono','fonasa','masculino','1962-11-30'),
    ('d4000000-0000-0000-0000-000000000004','d837f400-60b5-4b53-b0df-2b9a71b12345',
     'Andrés Carvajal Mena','15.678.901-2','+56912345004','andres.carvajal@outlook.com','web','isapre_colmena','masculino','1991-01-08'),
    ('d4000000-0000-0000-0000-000000000005','d837f400-60b5-4b53-b0df-2b9a71b12345',
     'Diego Salazar Pino','16.789.012-3','+56912345005','dsalazar@empresa.cl','derivacion','particular','masculino','1975-05-19'),
    ('d4000000-0000-0000-0000-000000000006','d837f400-60b5-4b53-b0df-2b9a71b12345',
     'Javier Mora Castillo','17.890.123-4','+56912345006',NULL,'whatsapp','fonasa','masculino','1968-09-03'),
    ('d4000000-0000-0000-0000-000000000007','d837f400-60b5-4b53-b0df-2b9a71b12345',
     'Fernando Reyes Núñez','18.901.234-5','+56912345007','f.reyes@gmail.com','web','isapre_cruz_blanca','masculino','1989-12-25'),
    ('d4000000-0000-0000-0000-000000000008','d837f400-60b5-4b53-b0df-2b9a71b12345',
     'Luis Espinoza Campos','19.012.345-6','+56912345008','luis.espinoza@hotmail.com','telefono','particular','masculino','1955-04-14');

-- ============================================================
-- PASO 13 — Citas (15 en distintos estados)
-- ============================================================
INSERT INTO public.mpaci_citas (
    id, empresa_id, sucursal_id, medico_id, contacto_id, servicio_id,
    fecha_inicio, fecha_fin, estado_operativo, estado_confirmacion,
    estado_pago, precio_base, cobertura_usada, sala_id
)
VALUES
    ('99000000-0000-0000-0000-000000000001','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000001','d4000000-0000-0000-0000-000000000001','c3000000-0000-0000-0000-000000000002',now()-interval'14 days'+time'08:00',now()-interval'14 days'+time'08:50','Realizada','confirmada','Pago total',490000,'fonasa','a1000000-0000-0000-0000-000000000001'),
    ('99000000-0000-0000-0000-000000000002','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000001','d4000000-0000-0000-0000-000000000002','c3000000-0000-0000-0000-000000000004',now()-interval'14 days'+time'09:00',now()-interval'14 days'+time'11:00','Realizada','confirmada','Pago total',1800000,'isapre_banmedica','a1000000-0000-0000-0000-000000000001'),
    ('99000000-0000-0000-0000-000000000003','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000001','d4000000-0000-0000-0000-000000000003','c3000000-0000-0000-0000-000000000002',now()-interval'7 days'+time'07:30',now()-interval'7 days'+time'08:20','No asistió','confirmada','No pagado',490000,'fonasa',NULL),
    ('99000000-0000-0000-0000-000000000004','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000001','d4000000-0000-0000-0000-000000000001','c3000000-0000-0000-0000-000000000006',now()-interval'7 days'+time'14:00',now()-interval'7 days'+time'14:20','Realizada','confirmada','Pago total',25000,'fonasa','a1000000-0000-0000-0000-000000000002'),
    ('99000000-0000-0000-0000-000000000005','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000002','d4000000-0000-0000-0000-000000000004','c3000000-0000-0000-0000-000000000003',now()-interval'10 days'+time'08:00',now()-interval'10 days'+time'08:45','Realizada','confirmada','Pago total',490000,'isapre_colmena','a1000000-0000-0000-0000-000000000001'),
    ('99000000-0000-0000-0000-000000000006','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000002','d4000000-0000-0000-0000-000000000005','c3000000-0000-0000-0000-000000000003',now()-interval'3 days'+time'08:00',now()-interval'3 days'+time'08:45','Cancelada por paciente dentro de plazo','confirmada','No pagado',490000,'particular',NULL),
    ('99000000-0000-0000-0000-000000000007','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000003','d4000000-0000-0000-0000-000000000006','c3000000-0000-0000-0000-000000000001',now()-interval'5 days'+time'09:00',now()-interval'5 days'+time'09:20','Realizada','confirmada','Pago total',50000,'fonasa','a1000000-0000-0000-0000-000000000002'),
    ('99000000-0000-0000-0000-000000000008','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000003','d4000000-0000-0000-0000-000000000007','c3000000-0000-0000-0000-000000000005',now()-interval'2 days'+time'10:00',now()-interval'2 days'+time'10:35','Realizada','confirmada','Pago parcial',180000,'isapre_cruz_blanca','a1000000-0000-0000-0000-000000000001'),
    ('99000000-0000-0000-0000-000000000009','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000001','d4000000-0000-0000-0000-000000000008','c3000000-0000-0000-0000-000000000002',date_trunc('day',now())+time'08:00',date_trunc('day',now())+time'08:50','Agendada','confirmada','No pagado',490000,'particular','a1000000-0000-0000-0000-000000000001'),
    ('99000000-0000-0000-0000-000000000010','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000001','d4000000-0000-0000-0000-000000000003','c3000000-0000-0000-0000-000000000004',date_trunc('day',now())+time'09:00',date_trunc('day',now())+time'11:00','Agendada','no_confirmada','No pagado',1800000,'fonasa','a1000000-0000-0000-0000-000000000001'),
    ('99000000-0000-0000-0000-000000000011','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000003','d4000000-0000-0000-0000-000000000001','c3000000-0000-0000-0000-000000000001',date_trunc('day',now())+time'09:00',date_trunc('day',now())+time'09:20','Agendada','confirmada','No pagado',50000,'fonasa','a1000000-0000-0000-0000-000000000002'),
    ('99000000-0000-0000-0000-000000000012','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000003','d4000000-0000-0000-0000-000000000005','c3000000-0000-0000-0000-000000000001',date_trunc('day',now())+time'09:20',date_trunc('day',now())+time'09:40','Agendada','no_confirmada','No pagado',50000,'particular','a1000000-0000-0000-0000-000000000002'),
    ('99000000-0000-0000-0000-000000000013','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000001','d4000000-0000-0000-0000-000000000006','c3000000-0000-0000-0000-000000000002',date_trunc('week',now())+interval'7 days'+time'07:30',date_trunc('week',now())+interval'7 days'+time'08:20','Agendada','no_confirmada','No pagado',490000,'fonasa','a1000000-0000-0000-0000-000000000001'),
    ('99000000-0000-0000-0000-000000000014','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000002','d4000000-0000-0000-0000-000000000007','c3000000-0000-0000-0000-000000000003',date_trunc('week',now())+interval'8 days'+time'08:00',date_trunc('week',now())+interval'8 days'+time'08:45','Agendada','confirmada','No pagado',490000,'isapre_cruz_blanca','a1000000-0000-0000-0000-000000000001'),
    ('99000000-0000-0000-0000-000000000015','d837f400-60b5-4b53-b0df-2b9a71b12345','f47ac10b-58cc-4372-a567-0e02b2c3d479','b2000000-0000-0000-0000-000000000003','d4000000-0000-0000-0000-000000000008','c3000000-0000-0000-0000-000000000005',date_trunc('week',now())+interval'9 days'+time'10:00',date_trunc('week',now())+interval'9 days'+time'10:35','Agendada','no_confirmada','No pagado',180000,'particular','a1000000-0000-0000-0000-000000000001');

-- Pacientes principales de cada cita
INSERT INTO public.mpaci_cita_pacientes
    (empresa_id, cita_id, contacto_id, es_principal, estado_asistencia)
SELECT c.empresa_id, c.id, c.contacto_id, true,
    CASE c.estado_operativo
        WHEN 'Realizada'  THEN 'asistio'
        WHEN 'No asistió' THEN 'no_asistio'
        ELSE 'pendiente'
    END
FROM public.mpaci_citas c
WHERE c.id LIKE '99000000-0000-0000-0000-0000000000%'
  AND c.contacto_id IS NOT NULL;

-- Equipo cita (citas realizadas)
INSERT INTO public.mpaci_equipo_cita
    (empresa_id, cita_id, usuario_id, rol_clinico, honorario_calculado)
VALUES
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000001','cirujano',250000),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000006','arsenalera',35000),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000001','cirujano',350000),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000002','ayudante',80000),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000006','arsenalera',50000),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000005','b2000000-0000-0000-0000-000000000002','cirujano',10000),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000005','b2000000-0000-0000-0000-000000000006','arsenalera',35000);

-- Pagos
INSERT INTO public.mpaci_pagos_cita
    (empresa_id, cita_id, tipo, monto, medio_pago, referencia, registrado_por)
VALUES
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000001','pago',490000,'transferencia','TRF-001','b2000000-0000-0000-0000-000000000004'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000002','pago',1800000,'transferencia','TRF-002','b2000000-0000-0000-0000-000000000004'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000004','pago',25000,'efectivo',NULL,'b2000000-0000-0000-0000-000000000004'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000005','pago',490000,'tarjeta','VISA-4567','b2000000-0000-0000-0000-000000000004'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000007','pago',50000,'efectivo',NULL,'b2000000-0000-0000-0000-000000000005'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','99000000-0000-0000-0000-000000000008','abono',90000,'transferencia','TRF-003','b2000000-0000-0000-0000-000000000005');

-- Honorarios bloque García
INSERT INTO public.mpaci_honorarios_bloque
    (empresa_id, medico_id, sucursal_id, fecha, bloque_rango, monto, estado)
VALUES
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000001','f47ac10b-58cc-4372-a567-0e02b2c3d479',
     (now()-interval'14 days')::date,
     tstzrange(now()-interval'14 days'+time'07:30', now()-interval'14 days'+time'13:30'),
     137500,'confirmado'),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000001','f47ac10b-58cc-4372-a567-0e02b2c3d479',
     date_trunc('day',now())::date,
     tstzrange(date_trunc('day',now())+time'07:30', date_trunc('day',now())+time'13:30'),
     137500,'pendiente_confirmacion');

-- ============================================================
-- RESUMEN FINAL
-- ============================================================
DO $$
DECLARE
    v_admin TEXT;
BEGIN
    SELECT nombre_completo INTO v_admin
    FROM public.mpaci_usuarios WHERE rol = 'admin_general' LIMIT 1;

    RAISE NOTICE '';
    RAISE NOTICE '╔══════════════════════════════════════╗';
    RAISE NOTICE '║   RESET + STAGING COMPLETADO         ║';
    RAISE NOTICE '╠══════════════════════════════════════╣';
    RAISE NOTICE '║ Admin:      %', v_admin;
    RAISE NOTICE '║ Empresa:    Urbamed IA  (slug: urbamed)';
    RAISE NOTICE '║ Usuarios:   6 staging + 1 admin real';
    RAISE NOTICE '║ Servicios:  6  |  Configs: 7';
    RAISE NOTICE '║ Citas:      15 (pasadas + hoy + futuras)';
    RAISE NOTICE '╠══════════════════════════════════════╣';
    RAISE NOTICE '║ Acceso directo → /urbamed/agenda/hoy ║';
    RAISE NOTICE '╚══════════════════════════════════════╝';
END $$;

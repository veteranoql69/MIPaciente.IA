-- ============================================================
-- SEED DE STAGING — Módulo Agenda (Mi-Paciente)
-- Ejecutar DESPUÉS de supabase/seed.sql (empresa + sucursal base)
-- Propósito: datos representativos para desarrollar y probar
--   la Agenda con escenarios reales antes de producción.
-- ============================================================
-- Empresa:  d837f400-60b5-4b53-b0df-2b9a71b12345  (Urbamed IA)
-- Sucursal: f47ac10b-58cc-4372-a567-0e02b2c3d479  (Sede Principal Santiago)
-- ============================================================

-- ============================================================
-- 0. CONSTANTES (DO block para validar prereqs)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.mpaci_empresas
        WHERE id = 'd837f400-60b5-4b53-b0df-2b9a71b12345'
    ) THEN
        RAISE EXCEPTION 'Ejecuta seed.sql primero — empresa Urbamed no existe.';
    END IF;
END $$;

-- ============================================================
-- 1. SALAS
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
     'Box Consulta 1', 'Consulta urológica general', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. SERVICIOS — ampliar los 3 base + agregar 3 nuevos
--    Usamos INSERT con ID estático para referenciar después
-- ============================================================
INSERT INTO public.mpaci_servicios
    (id, nombre, categoria, es_cirugia, duracion_minutos, precio_base,
     activo, empresa_id, roles_sugeridos)
VALUES
    ('c3000000-0000-0000-0000-000000000001',
     'Consulta Urología General', 'consulta', false, 20, 50000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     '{"medico":1}'),

    ('c3000000-0000-0000-0000-000000000002',
     'Vasectomía', 'cirugia', true, 45, 490000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     '{"cirujano":1,"anestesista":1,"arsenalera":1}'),

    ('c3000000-0000-0000-0000-000000000003',
     'Circuncisión Adulto', 'cirugia', true, 40, 490000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     '{"cirujano":1,"arsenalera":1}'),

    ('c3000000-0000-0000-0000-000000000004',
     'Nefrolitotomía Percutánea', 'cirugia', true, 120, 1800000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     '{"cirujano":1,"ayudante":1,"anestesista":1,"arsenalera":1}'),

    ('c3000000-0000-0000-0000-000000000005',
     'Cistoscopia Diagnóstica', 'procedimiento', false, 30, 180000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     '{"medico":1,"arsenalera":1}'),

    ('c3000000-0000-0000-0000-000000000006',
     'Control Post-Operatorio', 'control', false, 15, 25000, true,
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     '{"medico":1}')
ON CONFLICT (id) DO UPDATE SET
    categoria        = EXCLUDED.categoria,
    es_cirugia       = EXCLUDED.es_cirugia,
    roles_sugeridos  = EXCLUDED.roles_sugeridos;

-- ============================================================
-- 3. USUARIOS DE STAGING (auth.users + mpaci_usuarios)
--    Emails @staging.test — no son cuentas reales de Google
-- ============================================================

-- 3A. Insertar en auth.users (requiere service_role)
INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, email_confirmed_at,
    raw_user_meta_data,
    created_at, updated_at
)
VALUES
    -- Dr. Jaime García — cirujano urólogo (modelo doc §16)
    ('b2000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'dr.garcia@staging.test', now(),
     '{"full_name":"Dr. Jaime García"}', now(), now()),

    -- Dra. Elizabeth Rojas — uróloga / arsenalera (modelo doc §16)
    ('b2000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'dr.rojas@staging.test', now(),
     '{"full_name":"Dra. Elizabeth Rojas"}', now(), now()),

    -- Dr. Roberto Muñoz — urólogo general (consultas + cistoscopias)
    ('b2000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'dr.munoz@staging.test', now(),
     '{"full_name":"Dr. Roberto Muñoz"}', now(), now()),

    -- Valentina Torres — asistente (asignada a García + Rojas)
    ('b2000000-0000-0000-0000-000000000004',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'asistente.torres@staging.test', now(),
     '{"full_name":"Valentina Torres"}', now(), now()),

    -- Catalina Pérez — asistente (asignada a Muñoz)
    ('b2000000-0000-0000-0000-000000000005',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'asistente.perez@staging.test', now(),
     '{"full_name":"Catalina Pérez"}', now(), now()),

    -- Patricia Soto — enfermera/TENS (pabellón)
    ('b2000000-0000-0000-0000-000000000006',
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'enfermera.soto@staging.test', now(),
     '{"full_name":"Patricia Soto"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 3B. Upsert en mpaci_usuarios con roles y empresa correctos
INSERT INTO public.mpaci_usuarios
    (id, email, nombre_completo, empresa_id, rol, onboarding_completado)
VALUES
    ('b2000000-0000-0000-0000-000000000001',
     'dr.garcia@staging.test', 'Dr. Jaime García',
     'd837f400-60b5-4b53-b0df-2b9a71b12345', 'medico', true),

    ('b2000000-0000-0000-0000-000000000002',
     'dr.rojas@staging.test', 'Dra. Elizabeth Rojas',
     'd837f400-60b5-4b53-b0df-2b9a71b12345', 'medico', true),

    ('b2000000-0000-0000-0000-000000000003',
     'dr.munoz@staging.test', 'Dr. Roberto Muñoz',
     'd837f400-60b5-4b53-b0df-2b9a71b12345', 'medico', true),

    ('b2000000-0000-0000-0000-000000000004',
     'asistente.torres@staging.test', 'Valentina Torres',
     'd837f400-60b5-4b53-b0df-2b9a71b12345', 'asistente', true),

    ('b2000000-0000-0000-0000-000000000005',
     'asistente.perez@staging.test', 'Catalina Pérez',
     'd837f400-60b5-4b53-b0df-2b9a71b12345', 'asistente', true),

    ('b2000000-0000-0000-0000-000000000006',
     'enfermera.soto@staging.test', 'Patricia Soto',
     'd837f400-60b5-4b53-b0df-2b9a71b12345', 'enfermera_tens', true)
ON CONFLICT (id) DO UPDATE SET
    rol                   = EXCLUDED.rol,
    empresa_id            = EXCLUDED.empresa_id,
    onboarding_completado = EXCLUDED.onboarding_completado;

-- 3C. Sembrar permisos por rol para los nuevos usuarios
SELECT public.seed_permisos_por_rol(id, empresa_id, rol::app_role, NULL)
FROM public.mpaci_usuarios
WHERE id IN (
    'b2000000-0000-0000-0000-000000000001',
    'b2000000-0000-0000-0000-000000000002',
    'b2000000-0000-0000-0000-000000000003',
    'b2000000-0000-0000-0000-000000000004',
    'b2000000-0000-0000-0000-000000000005',
    'b2000000-0000-0000-0000-000000000006'
);

-- ============================================================
-- 4. ASIGNACIONES ASISTENTE ↔ MÉDICO
-- ============================================================
INSERT INTO public.mpaci_asignaciones_medico
    (empresa_id, asistente_id, medico_id, activo)
VALUES
    -- Valentina Torres atiende a García y Rojas
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     'b2000000-0000-0000-0000-000000000004',
     'b2000000-0000-0000-0000-000000000001', true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     'b2000000-0000-0000-0000-000000000004',
     'b2000000-0000-0000-0000-000000000002', true),
    -- Catalina Pérez atiende solo a Muñoz
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     'b2000000-0000-0000-0000-000000000005',
     'b2000000-0000-0000-0000-000000000003', true)
ON CONFLICT (asistente_id, medico_id) DO NOTHING;

-- ============================================================
-- 5. CONFIGURACIONES DE SERVICIO (Service Builder)
--    (servicio + médico + sucursal) → tiempos + honorarios
--    Ref: doc Agenda V1.7 §3.2 y §16
-- ============================================================
INSERT INTO public.mpaci_servicios_config (
    id, empresa_id, servicio_id, medico_id, sucursal_id,
    duracion_minutos, buffer_pre_min, buffer_post_min,
    sala_id, modelo_honorarios, monto_bloque,
    monto_por_cirugia, unidad_honorario, modo_bloque,
    honorarios_por_rol, pct_no_realizada, fee_cancelacion_tardia,
    activo
)
VALUES
    -- García: Vasectomía — bloque 137.500 + 250.000 por cirugía (doc §16.5)
    ('e5000000-0000-0000-0000-000000000001',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'c3000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000001',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     45, 5, 10,
     'a1000000-0000-0000-0000-000000000001',
     'bloque_procedimiento', 137500,
     250000, 'caso', 'automatico',
     '{"cirujano":250000,"anestesista":80000,"arsenalera":35000}',
     50, 30000, true),

    -- García: Nefrolitotomía — cirugía general + roles
    ('e5000000-0000-0000-0000-000000000002',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'c3000000-0000-0000-0000-000000000004',
     'b2000000-0000-0000-0000-000000000001',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     120, 15, 20,
     'a1000000-0000-0000-0000-000000000001',
     'cirugia_general', 137500,
     500000, 'caso', 'automatico',
     '{"cirujano":350000,"ayudante":80000,"anestesista":150000,"arsenalera":50000}',
     0, 50000, true),

    -- García: Control Post-Op — fijo
    ('e5000000-0000-0000-0000-000000000003',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'c3000000-0000-0000-0000-000000000006',
     'b2000000-0000-0000-0000-000000000001',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     15, 0, 5,
     'a1000000-0000-0000-0000-000000000002',
     'fijo', 30000,
     NULL, 'caso', NULL,
     '{"medico":30000}',
     100, 0, true),

    -- Rojas: Circuncisión — 10.000 cirugía general + 35.000 arsenalera (doc §16.5)
    ('e5000000-0000-0000-0000-000000000004',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'c3000000-0000-0000-0000-000000000003',
     'b2000000-0000-0000-0000-000000000002',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     40, 5, 10,
     'a1000000-0000-0000-0000-000000000001',
     'cirugia_general', NULL,
     10000, 'caso', NULL,
     '{"cirujano":10000,"arsenalera":35000}',
     50, 20000, true),

    -- Rojas: Vasectomía — también opera
    ('e5000000-0000-0000-0000-000000000005',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'c3000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000002',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     45, 5, 10,
     'a1000000-0000-0000-0000-000000000001',
     'cirugia_general', NULL,
     10000, 'caso', NULL,
     '{"cirujano":10000,"arsenalera":35000}',
     50, 20000, true),

    -- Muñoz: Consulta — fijo 50.000
    ('e5000000-0000-0000-0000-000000000006',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'c3000000-0000-0000-0000-000000000001',
     'b2000000-0000-0000-0000-000000000003',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     20, 0, 0,
     'a1000000-0000-0000-0000-000000000002',
     'fijo', 50000,
     NULL, 'caso', NULL,
     '{"medico":50000}',
     100, 0, true),

    -- Muñoz: Cistoscopia — fijo 80.000
    ('e5000000-0000-0000-0000-000000000007',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'c3000000-0000-0000-0000-000000000005',
     'b2000000-0000-0000-0000-000000000003',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     30, 5, 5,
     'a1000000-0000-0000-0000-000000000001',
     'fijo', 80000,
     NULL, 'caso', NULL,
     '{"medico":80000,"arsenalera":25000}',
     50, 15000, true)
ON CONFLICT (servicio_id, medico_id, sucursal_id, empresa_id) DO UPDATE SET
    duracion_minutos     = EXCLUDED.duracion_minutos,
    modelo_honorarios    = EXCLUDED.modelo_honorarios,
    monto_bloque         = EXCLUDED.monto_bloque,
    honorarios_por_rol   = EXCLUDED.honorarios_por_rol;

-- ============================================================
-- 6. HORARIOS PRESTADOR (lun-vie con variaciones reales)
--    dia_semana: 1=lunes … 5=viernes (0=domingo, 6=sábado)
-- ============================================================
INSERT INTO public.mpaci_horarios_prestador
    (empresa_id, medico_id, sucursal_id, dia_semana,
     hora_inicio, hora_fin, activo)
VALUES
    -- García: lun/mié/vie pabellón 07:30–13:30
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000001','f47ac10b-58cc-4372-a567-0e02b2c3d479',1,'07:30','13:30',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000001','f47ac10b-58cc-4372-a567-0e02b2c3d479',3,'07:30','13:30',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000001','f47ac10b-58cc-4372-a567-0e02b2c3d479',5,'07:30','13:30',true),
    -- García: mar/jue consultas 14:00–18:00
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000001','f47ac10b-58cc-4372-a567-0e02b2c3d479',2,'14:00','18:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000001','f47ac10b-58cc-4372-a567-0e02b2c3d479',4,'14:00','18:00',true),

    -- Rojas: mar/jue/vie pabellón 08:00–14:00
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000002','f47ac10b-58cc-4372-a567-0e02b2c3d479',2,'08:00','14:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000002','f47ac10b-58cc-4372-a567-0e02b2c3d479',4,'08:00','14:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000002','f47ac10b-58cc-4372-a567-0e02b2c3d479',5,'08:00','14:00',true),

    -- Muñoz: lun–vie consultas 09:00–17:00
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000003','f47ac10b-58cc-4372-a567-0e02b2c3d479',1,'09:00','17:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000003','f47ac10b-58cc-4372-a567-0e02b2c3d479',2,'09:00','17:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000003','f47ac10b-58cc-4372-a567-0e02b2c3d479',3,'09:00','17:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000003','f47ac10b-58cc-4372-a567-0e02b2c3d479',4,'09:00','17:00',true),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345','b2000000-0000-0000-0000-000000000003','f47ac10b-58cc-4372-a567-0e02b2c3d479',5,'09:00','17:00',true)
ON CONFLICT DO NOTHING;

-- 6A. Pausa almuerzo para Muñoz (lun–vie 13:00–14:00)
INSERT INTO public.mpaci_horarios_pausas (horario_id, hora_inicio, hora_fin, motivo)
SELECT hp.id, '13:00', '14:00', 'Colación'
FROM public.mpaci_horarios_prestador hp
WHERE hp.medico_id = 'b2000000-0000-0000-0000-000000000003'
  AND hp.dia_semana IN (1,2,3,4,5)
ON CONFLICT DO NOTHING;

-- 6B. Excepción: García bloquea próximo miércoles (día sin operar)
INSERT INTO public.mpaci_horarios_excepciones
    (empresa_id, medico_id, fecha, tipo, motivo)
VALUES (
    'd837f400-60b5-4b53-b0df-2b9a71b12345',
    'b2000000-0000-0000-0000-000000000001',
    (date_trunc('week', now()) + interval '9 days')::date,
    'no_disponible',
    'Congreso de Urología — Viña del Mar'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. RECURSOS: EQUIPAMIENTO + INSUMOS (para Pabellón 1)
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
     'Nefrolitotriptor Lithocut', 'Sistema de litotricia percutánea', true)
ON CONFLICT (id) DO NOTHING;

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
     'Lidocaína Gel 2%', 'ml', 500, 100, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. PACIENTES (mpaci_contactos)
-- ============================================================
INSERT INTO public.mpaci_contactos
    (id, empresa_id, nombre, rut, telefono, email,
     canal_origen, prevision, genero, fecha_nacimiento)
VALUES
    ('d4000000-0000-0000-0000-000000000001',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Carlos Herrera Vega', '12.345.678-9', '+56912345001',
     'carlos.herrera@gmail.com', 'web', 'fonasa', 'masculino', '1978-03-15'),

    ('d4000000-0000-0000-0000-000000000002',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Miguel Ángel Torres', '13.456.789-0', '+56912345002',
     'mangel.torres@gmail.com', 'derivacion', 'isapre_banmedica', 'masculino', '1985-07-22'),

    ('d4000000-0000-0000-0000-000000000003',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Roberto Fuentes Díaz', '14.567.890-1', '+56912345003',
     NULL, 'telefono', 'fonasa', 'masculino', '1962-11-30'),

    ('d4000000-0000-0000-0000-000000000004',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Andrés Carvajal Mena', '15.678.901-2', '+56912345004',
     'andres.carvajal@outlook.com', 'web', 'isapre_colmena', 'masculino', '1991-01-08'),

    ('d4000000-0000-0000-0000-000000000005',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Diego Salazar Pino', '16.789.012-3', '+56912345005',
     'dsalazar@empresa.cl', 'derivacion', 'particular', 'masculino', '1975-05-19'),

    ('d4000000-0000-0000-0000-000000000006',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Javier Mora Castillo', '17.890.123-4', '+56912345006',
     NULL, 'whatsapp', 'fonasa', 'masculino', '1968-09-03'),

    ('d4000000-0000-0000-0000-000000000007',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Fernando Reyes Núñez', '18.901.234-5', '+56912345007',
     'f.reyes@gmail.com', 'web', 'isapre_cruz_blanca', 'masculino', '1989-12-25'),

    ('d4000000-0000-0000-0000-000000000008',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'Luis Espinoza Campos', '19.012.345-6', '+56912345008',
     'luis.espinoza@hotmail.com', 'telefono', 'particular', 'masculino', '1955-04-14')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. CITAS — 15 citas en distintos estados y fechas
--    El trigger fn_citas_autofill_snapshot() llena los snapshots
--    automáticamente al INSERT si existe servicios_config.
-- ============================================================
INSERT INTO public.mpaci_citas (
    id, empresa_id, sucursal_id, medico_id, contacto_id, servicio_id,
    fecha_inicio, fecha_fin,
    estado_operativo, estado_confirmacion, estado_pago,
    precio_base, cobertura_usada, sala_id
)
VALUES
    -- PASADAS — García (cirugías realizadas hace ~2 semanas)
    ('99000000-0000-0000-0000-000000000001',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000001',
     'd4000000-0000-0000-0000-000000000001',
     'c3000000-0000-0000-0000-000000000002',
     now() - interval '14 days' + time '08:00',
     now() - interval '14 days' + time '08:50',
     'Realizada', 'confirmada', 'Pago total',
     490000, 'fonasa',
     'a1000000-0000-0000-0000-000000000001'),

    ('99000000-0000-0000-0000-000000000002',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000001',
     'd4000000-0000-0000-0000-000000000002',
     'c3000000-0000-0000-0000-000000000004',
     now() - interval '14 days' + time '09:00',
     now() - interval '14 days' + time '11:00',
     'Realizada', 'confirmada', 'Pago total',
     1800000, 'isapre_banmedica',
     'a1000000-0000-0000-0000-000000000001'),

    ('99000000-0000-0000-0000-000000000003',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000001',
     'd4000000-0000-0000-0000-000000000003',
     'c3000000-0000-0000-0000-000000000002',
     now() - interval '7 days' + time '07:30',
     now() - interval '7 days' + time '08:20',
     'No asistió', 'confirmada', 'No pagado',
     490000, 'fonasa', NULL),

    -- PASADAS — García (control post-op de paciente 1)
    ('99000000-0000-0000-0000-000000000004',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000001',
     'd4000000-0000-0000-0000-000000000001',
     'c3000000-0000-0000-0000-000000000006',
     now() - interval '7 days' + time '14:00',
     now() - interval '7 days' + time '14:20',
     'Realizada', 'confirmada', 'Pago total',
     25000, 'fonasa',
     'a1000000-0000-0000-0000-000000000002'),

    -- PASADAS — Rojas (circuncisiones)
    ('99000000-0000-0000-0000-000000000005',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000002',
     'd4000000-0000-0000-0000-000000000004',
     'c3000000-0000-0000-0000-000000000003',
     now() - interval '10 days' + time '08:00',
     now() - interval '10 days' + time '08:45',
     'Realizada', 'confirmada', 'Pago total',
     490000, 'isapre_colmena',
     'a1000000-0000-0000-0000-000000000001'),

    ('99000000-0000-0000-0000-000000000006',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000002',
     'd4000000-0000-0000-0000-000000000005',
     'c3000000-0000-0000-0000-000000000003',
     now() - interval '3 days' + time '08:00',
     now() - interval '3 days' + time '08:45',
     'Cancelada por paciente dentro de plazo', 'confirmada', 'No pagado',
     490000, 'particular', NULL),

    -- PASADAS — Muñoz (consultas y cistoscopia)
    ('99000000-0000-0000-0000-000000000007',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000003',
     'd4000000-0000-0000-0000-000000000006',
     'c3000000-0000-0000-0000-000000000001',
     now() - interval '5 days' + time '09:00',
     now() - interval '5 days' + time '09:20',
     'Realizada', 'confirmada', 'Pago total',
     50000, 'fonasa',
     'a1000000-0000-0000-0000-000000000002'),

    ('99000000-0000-0000-0000-000000000008',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000003',
     'd4000000-0000-0000-0000-000000000007',
     'c3000000-0000-0000-0000-000000000005',
     now() - interval '2 days' + time '10:00',
     now() - interval '2 days' + time '10:35',
     'Realizada', 'confirmada', 'Pago parcial',
     180000, 'isapre_cruz_blanca',
     'a1000000-0000-0000-0000-000000000001'),

    -- HOY — García (2 cirugías mañana temprano, agendadas)
    ('99000000-0000-0000-0000-000000000009',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000001',
     'd4000000-0000-0000-0000-000000000008',
     'c3000000-0000-0000-0000-000000000002',
     date_trunc('day', now()) + time '08:00',
     date_trunc('day', now()) + time '08:50',
     'Agendada', 'confirmada', 'No pagado',
     490000, 'particular',
     'a1000000-0000-0000-0000-000000000001'),

    ('99000000-0000-0000-0000-000000000010',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000001',
     'd4000000-0000-0000-0000-000000000003',
     'c3000000-0000-0000-0000-000000000004',
     date_trunc('day', now()) + time '09:00',
     date_trunc('day', now()) + time '11:00',
     'Agendada', 'no_confirmada', 'No pagado',
     1800000, 'fonasa',
     'a1000000-0000-0000-0000-000000000001'),

    -- HOY — Muñoz (3 consultas del día)
    ('99000000-0000-0000-0000-000000000011',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000003',
     'd4000000-0000-0000-0000-000000000001',
     'c3000000-0000-0000-0000-000000000001',
     date_trunc('day', now()) + time '09:00',
     date_trunc('day', now()) + time '09:20',
     'Agendada', 'confirmada', 'No pagado',
     50000, 'fonasa',
     'a1000000-0000-0000-0000-000000000002'),

    ('99000000-0000-0000-0000-000000000012',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000003',
     'd4000000-0000-0000-0000-000000000005',
     'c3000000-0000-0000-0000-000000000001',
     date_trunc('day', now()) + time '09:20',
     date_trunc('day', now()) + time '09:40',
     'Agendada', 'no_confirmada', 'No pagado',
     50000, 'particular',
     'a1000000-0000-0000-0000-000000000002'),

    -- FUTURAS (próxima semana)
    ('99000000-0000-0000-0000-000000000013',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000001',
     'd4000000-0000-0000-0000-000000000006',
     'c3000000-0000-0000-0000-000000000002',
     date_trunc('week', now()) + interval '7 days' + time '07:30',
     date_trunc('week', now()) + interval '7 days' + time '08:20',
     'Agendada', 'no_confirmada', 'No pagado',
     490000, 'fonasa',
     'a1000000-0000-0000-0000-000000000001'),

    ('99000000-0000-0000-0000-000000000014',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000002',
     'd4000000-0000-0000-0000-000000000007',
     'c3000000-0000-0000-0000-000000000003',
     date_trunc('week', now()) + interval '8 days' + time '08:00',
     date_trunc('week', now()) + interval '8 days' + time '08:45',
     'Agendada', 'confirmada', 'No pagado',
     490000, 'isapre_cruz_blanca',
     'a1000000-0000-0000-0000-000000000001'),

    ('99000000-0000-0000-0000-000000000015',
     'd837f400-60b5-4b53-b0df-2b9a71b12345',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     'b2000000-0000-0000-0000-000000000003',
     'd4000000-0000-0000-0000-000000000008',
     'c3000000-0000-0000-0000-000000000005',
     date_trunc('week', now()) + interval '9 days' + time '10:00',
     date_trunc('week', now()) + interval '9 days' + time '10:35',
     'Agendada', 'no_confirmada', 'No pagado',
     180000, 'particular',
     'a1000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. CITA_PACIENTES — vincular paciente principal a cada cita
-- ============================================================
INSERT INTO public.mpaci_cita_pacientes
    (empresa_id, cita_id, contacto_id, es_principal, estado_asistencia)
SELECT
    c.empresa_id,
    c.id,
    c.contacto_id,
    true,
    CASE c.estado_operativo
        WHEN 'Realizada'  THEN 'asistio'
        WHEN 'No asistió' THEN 'no_asistio'
        ELSE 'pendiente'
    END
FROM public.mpaci_citas c
WHERE c.id LIKE '99000000-0000-0000-0000-0000000000%'
  AND c.contacto_id IS NOT NULL
ON CONFLICT (cita_id, contacto_id) DO NOTHING;

-- ============================================================
-- 11. EQUIPO CITA — para citas ya Realizadas
-- ============================================================
INSERT INTO public.mpaci_equipo_cita
    (empresa_id, cita_id, usuario_id, rol_clinico, honorario_calculado)
VALUES
    -- Cita 001 (Vasectomía García) — García como cirujano, Soto arsenalera
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     '99000000-0000-0000-0000-000000000001',
     'b2000000-0000-0000-0000-000000000001', 'cirujano', 250000),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     '99000000-0000-0000-0000-000000000001',
     'b2000000-0000-0000-0000-000000000006', 'arsenalera', 35000),

    -- Cita 002 (Nefrolitotomía) — equipo completo
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     '99000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000001', 'cirujano', 350000),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     '99000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000002', 'ayudante', 80000),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     '99000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000006', 'arsenalera', 50000),

    -- Cita 005 (Circuncisión Rojas)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     '99000000-0000-0000-0000-000000000005',
     'b2000000-0000-0000-0000-000000000002', 'cirujano', 10000),
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     '99000000-0000-0000-0000-000000000005',
     'b2000000-0000-0000-0000-000000000006', 'arsenalera', 35000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 12. PAGOS — citas con pago registrado
-- ============================================================
INSERT INTO public.mpaci_pagos_cita
    (empresa_id, cita_id, tipo, monto, medio_pago, referencia, registrado_por)
VALUES
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     '99000000-0000-0000-0000-000000000001',
     'pago', 490000, 'transferencia', 'TRF-20240101-001',
     'b2000000-0000-0000-0000-000000000004'),

    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     '99000000-0000-0000-0000-000000000002',
     'pago', 1800000, 'transferencia', 'TRF-20240101-002',
     'b2000000-0000-0000-0000-000000000004'),

    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     '99000000-0000-0000-0000-000000000004',
     'pago', 25000, 'efectivo', NULL,
     'b2000000-0000-0000-0000-000000000004'),

    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     '99000000-0000-0000-0000-000000000005',
     'pago', 490000, 'tarjeta', 'VISA-4567',
     'b2000000-0000-0000-0000-000000000004'),

    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     '99000000-0000-0000-0000-000000000007',
     'pago', 50000, 'efectivo', NULL,
     'b2000000-0000-0000-0000-000000000005'),

    -- Pago parcial (cita 008 cistoscopia)
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     '99000000-0000-0000-0000-000000000008',
     'abono', 90000, 'transferencia', 'TRF-20240101-003',
     'b2000000-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 13. HONORARIOS BLOQUE — bloque del día de García
--     (modelo bloque_procedimiento genera 1 registro por día)
-- ============================================================
INSERT INTO public.mpaci_honorarios_bloque
    (empresa_id, medico_id, sucursal_id, fecha,
     bloque_rango, monto, estado)
VALUES
    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     'b2000000-0000-0000-0000-000000000001',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     (now() - interval '14 days')::date,
     tstzrange(
         now() - interval '14 days' + time '07:30',
         now() - interval '14 days' + time '13:30'
     ),
     137500, 'confirmado'),

    ('d837f400-60b5-4b53-b0df-2b9a71b12345',
     'b2000000-0000-0000-0000-000000000001',
     'f47ac10b-58cc-4372-a567-0e02b2c3d479',
     date_trunc('day', now())::date,
     tstzrange(
         date_trunc('day', now()) + time '07:30',
         date_trunc('day', now()) + time '13:30'
     ),
     137500, 'pendiente_confirmacion')
ON CONFLICT DO NOTHING;

-- ============================================================
-- RESUMEN
-- ============================================================
DO $$
DECLARE
    cnt_salas     INTEGER;
    cnt_servicios INTEGER;
    cnt_usuarios  INTEGER;
    cnt_config    INTEGER;
    cnt_contactos INTEGER;
    cnt_citas     INTEGER;
BEGIN
    SELECT COUNT(*) INTO cnt_salas     FROM public.mpaci_salas     WHERE empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    SELECT COUNT(*) INTO cnt_servicios FROM public.mpaci_servicios  WHERE empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    SELECT COUNT(*) INTO cnt_usuarios  FROM public.mpaci_usuarios   WHERE empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    SELECT COUNT(*) INTO cnt_config    FROM public.mpaci_servicios_config WHERE empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    SELECT COUNT(*) INTO cnt_contactos FROM public.mpaci_contactos  WHERE empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345';
    SELECT COUNT(*) INTO cnt_citas     FROM public.mpaci_citas      WHERE empresa_id = 'd837f400-60b5-4b53-b0df-2b9a71b12345';

    RAISE NOTICE '=== SEED STAGING COMPLETADO ===';
    RAISE NOTICE 'Salas:              %', cnt_salas;
    RAISE NOTICE 'Servicios:          %', cnt_servicios;
    RAISE NOTICE 'Usuarios:           %', cnt_usuarios;
    RAISE NOTICE 'Servicios config:   %', cnt_config;
    RAISE NOTICE 'Pacientes:          %', cnt_contactos;
    RAISE NOTICE 'Citas:              %', cnt_citas;
END $$;

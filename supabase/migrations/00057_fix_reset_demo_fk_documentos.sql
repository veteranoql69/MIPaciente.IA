-- ============================================================
-- Fix: reset_demo_staging() falla por FK mpaci_documentos → mpaci_citas
-- El DELETE de citas viola la restricción mpaci_documentos_cita_id_fkey.
-- Solución: eliminar documentos enlazados a las citas demo ANTES de borrarlas.
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_demo_staging()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emp        UUID := 'd837f400-60b5-4b53-b0df-2b9a71b12345';
  v_suc        UUID := 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  v_med1       UUID;
  v_med2       UUID;
  v_med3       UUID := 'b2000000-0000-0000-0000-000000000001';
  v_hoy        DATE;
  v_inicio     TIMESTAMPTZ;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM mpaci_empresas
    WHERE id = v_emp AND slug = 'clinica-urologia-demo'
  ) THEN
    RETURN 'error: empresa demo no encontrada';
  END IF;

  SELECT id INTO v_med1 FROM mpaci_usuarios
  WHERE email = 'mipaciente.demo@gmail.com' AND empresa_id = v_emp LIMIT 1;
  IF v_med1 IS NULL THEN v_med1 := v_med3; END IF;

  SELECT id INTO v_med2 FROM mpaci_usuarios
  WHERE email = 'caltamirano@manmec.cl' AND empresa_id = v_emp LIMIT 1;
  IF v_med2 IS NULL THEN v_med2 := v_med3; END IF;

  v_hoy    := current_date;
  v_inicio := timezone('America/Santiago', v_hoy::timestamp);

  -- Eliminar documentos vinculados a las citas de hoy ANTES de borrar las citas
  DELETE FROM mpaci_documentos
  WHERE cita_id IN (
    SELECT id FROM mpaci_citas
    WHERE empresa_id = v_emp
      AND fecha_inicio >= v_inicio
      AND fecha_inicio <  v_inicio + interval '1 day'
  );

  -- Ahora sí borrar las citas (CASCADE cubre cita_pacientes, equipo_cita, pagos)
  DELETE FROM mpaci_citas
  WHERE empresa_id = v_emp
    AND fecha_inicio >= v_inicio
    AND fecha_inicio <  v_inicio + interval '1 day';

  INSERT INTO mpaci_citas
    (id, empresa_id, sucursal_id, medico_id, contacto_id,
     servicio_id, fecha_inicio, fecha_fin,
     estado_operativo, estado_confirmacion, estado_pago,
     precio_base, cobertura_usada, sala_id)
  VALUES
    -- 08:00 Rezum — Manuel Cortés
    ('99000000-0000-0000-0000-000000000016',
     v_emp, v_suc, v_med1, 'd4000000-0000-0000-0000-000000000001',
     'c3000000-0000-0000-0000-000000000005',
     v_inicio + interval '8 hours',
     v_inicio + interval '9 hours',
     'Agendada', 'confirmada', 'No pagado', 1800000, 'fonasa',
     'a1000000-0000-0000-0000-000000000001'),

    -- 09:00 HoLEP — Patricio Vargas
    ('99000000-0000-0000-0000-000000000017',
     v_emp, v_suc, v_med1, 'd4000000-0000-0000-0000-000000000008',
     'c3000000-0000-0000-0000-000000000009',
     v_inicio + interval '9 hours',
     v_inicio + interval '10 hours 30 minutes',
     'Agendada', 'confirmada', 'No pagado', 2200000, 'particular',
     'a1000000-0000-0000-0000-000000000001'),

    -- 10:30 Control post-op — Gonzalo Herrera
    ('99000000-0000-0000-0000-000000000018',
     v_emp, v_suc, v_med1, 'd4000000-0000-0000-0000-000000000006',
     'c3000000-0000-0000-0000-000000000010',
     v_inicio + interval '10 hours 30 minutes',
     v_inicio + interval '10 hours 45 minutes',
     'Agendada', 'confirmada', 'No pagado', 30000, 'fonasa',
     'a1000000-0000-0000-0000-000000000002'),

    -- 08:00 Circuncisión ZSR — Jorge Muñoz (Dr. Altamirano)
    ('99000000-0000-0000-0000-000000000019',
     v_emp, v_suc, v_med2, 'd4000000-0000-0000-0000-000000000003',
     'c3000000-0000-0000-0000-000000000003',
     v_inicio + interval '8 hours',
     v_inicio + interval '8 hours 25 minutes',
     'Agendada', 'no_confirmada', 'No pagado', 590000, 'fonasa',
     'a1000000-0000-0000-0000-000000000001'),

    -- 09:00 Consulta — Diego Torres (Dr. Altamirano)
    ('99000000-0000-0000-0000-000000000020',
     v_emp, v_suc, v_med2, 'd4000000-0000-0000-0000-000000000007',
     'c3000000-0000-0000-0000-000000000001',
     v_inicio + interval '9 hours',
     v_inicio + interval '9 hours 20 minutes',
     'Agendada', 'confirmada', 'No pagado', 55000, 'particular',
     'a1000000-0000-0000-0000-000000000003'),

    -- 10:00 LEOC — Cristóbal Silva (Dr. Altamirano)
    ('99000000-0000-0000-0000-000000000021',
     v_emp, v_suc, v_med2, 'd4000000-0000-0000-0000-000000000009',
     'c3000000-0000-0000-0000-000000000015',
     v_inicio + interval '10 hours',
     v_inicio + interval '10 hours 45 minutes',
     'Agendada', 'no_confirmada', 'No pagado', 350000, 'fonasa',
     'a1000000-0000-0000-0000-000000000004'),

    -- 09:00 Orquidopexia — Sebastián Rojas (Dra. Miranda)
    ('99000000-0000-0000-0000-000000000022',
     v_emp, v_suc, v_med3, 'd4000000-0000-0000-0000-000000000005',
     'c3000000-0000-0000-0000-000000000012',
     v_inicio + interval '9 hours',
     v_inicio + interval '9 hours 50 minutes',
     'Agendada', 'confirmada', 'No pagado', 580000, 'fonasa',
     'a1000000-0000-0000-0000-000000000001');

  INSERT INTO mpaci_cita_pacientes
    (empresa_id, cita_id, contacto_id, es_principal, estado_asistencia)
  SELECT empresa_id, id, contacto_id, true, 'pendiente'
  FROM mpaci_citas
  WHERE id IN (
    '99000000-0000-0000-0000-000000000016',
    '99000000-0000-0000-0000-000000000017',
    '99000000-0000-0000-0000-000000000018',
    '99000000-0000-0000-0000-000000000019',
    '99000000-0000-0000-0000-000000000020',
    '99000000-0000-0000-0000-000000000021',
    '99000000-0000-0000-0000-000000000022'
  )
  ON CONFLICT DO NOTHING;

  RETURN 'ok: 7 citas demo restauradas para ' || v_hoy::text;
END;
$$;

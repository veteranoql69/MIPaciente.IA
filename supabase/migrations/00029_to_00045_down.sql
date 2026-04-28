-- ============================================================
-- Migración DOWN: 00029_to_00045_down.sql
-- Descripción: Revierte las migraciones 00029-00045 (Olas A, B, C).
--   Orden inverso de creación. Borra tablas nuevas, triggers,
--   views, columnas añadidas, constraints y políticas.
-- Ejecutar con cuidado: elimina datos.
-- ============================================================

-- ============================================================
-- 00045 — Views
-- ============================================================
DROP VIEW IF EXISTS public.mpaci_v_citas_dia;
DROP VIEW IF EXISTS public.mpaci_v_saldo_cita;

-- ============================================================
-- 00044 — Campañas y fuentes
-- ============================================================
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS campana_id;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS fuente_id;
DROP TABLE IF EXISTS public.mpaci_campanas;
DROP TABLE IF EXISTS public.mpaci_fuentes_lead;

-- ============================================================
-- 00043 — Reasignaciones
-- ============================================================
DROP TABLE IF EXISTS public.mpaci_reasignaciones;

-- ============================================================
-- 00042 — Deprecate gerente (no se puede revertir el backfill)
-- Se dejan las policies como están (ya no mencionan gerente).
-- ============================================================

-- ============================================================
-- 00041 — Frases rápidas y versionado de plantillas
-- ============================================================
DROP TRIGGER IF EXISTS trg_plantillas_archivar_version ON public.mpaci_plantillas_clinicas;
DROP FUNCTION IF EXISTS public.fn_plantillas_archivar_version();
DROP TABLE IF EXISTS public.mpaci_plantillas_clinicas_versiones;
DROP TABLE IF EXISTS public.mpaci_frases_rapidas;

-- ============================================================
-- 00040 — Catálogos CIE-10 y medicamentos
-- ============================================================
ALTER TABLE public.mpaci_medicamentos_paciente DROP COLUMN IF EXISTS catalogo_id;
DROP TABLE IF EXISTS public.mpaci_catalogo_medicamentos;
DROP TABLE IF EXISTS public.mpaci_catalogo_cie10;

-- ============================================================
-- 00039 — Notas agenda + bloque_base_min
-- ============================================================
ALTER TABLE public.mpaci_empresas
    DROP CONSTRAINT IF EXISTS chk_empresas_bloque_base;
ALTER TABLE public.mpaci_empresas DROP COLUMN IF EXISTS bloque_base_min;
DROP TRIGGER IF EXISTS trg_notas_agenda_updated_at ON public.mpaci_notas_agenda;
DROP FUNCTION IF EXISTS public.fn_notas_agenda_updated_at();
DROP TABLE IF EXISTS public.mpaci_notas_agenda;

-- ============================================================
-- 00038 — Recursos (insumos, equipamiento, config_recursos)
-- ============================================================
DROP TABLE IF EXISTS public.mpaci_servicios_config_recursos;
DROP TABLE IF EXISTS public.mpaci_equipamiento;
DROP TABLE IF EXISTS public.mpaci_insumos;

-- ============================================================
-- 00037 — Honorarios por bloque
-- ============================================================
DROP TRIGGER IF EXISTS trg_honorarios_bloque_lock ON public.mpaci_honorarios_bloque;
DROP FUNCTION IF EXISTS public.fn_honorarios_bloque_lock();
DROP TABLE IF EXISTS public.mpaci_honorarios_bloque;

-- ============================================================
-- 00036 — Cita pacientes
-- ============================================================
DROP TABLE IF EXISTS public.mpaci_cita_pacientes;
-- Restaurar NOT NULL en contacto_id requiere que no haya NULLs — no se hace aquí

-- ============================================================
-- 00035 — Cita procedimientos
-- ============================================================
DROP TABLE IF EXISTS public.mpaci_cita_procedimientos;
-- Restaurar NOT NULL en servicio_id requiere que no haya NULLs — no se hace aquí

-- ============================================================
-- 00034 — Horarios prestador
-- ============================================================
DROP TABLE IF EXISTS public.mpaci_horarios_excepciones;
DROP TABLE IF EXISTS public.mpaci_horarios_pausas;
DROP TABLE IF EXISTS public.mpaci_horarios_prestador;

-- ============================================================
-- 00033 — Inmutabilidad honorarios
-- ============================================================
DROP TRIGGER IF EXISTS trg_equipo_cita_proteger_honorario ON public.mpaci_equipo_cita;
DROP FUNCTION IF EXISTS public.fn_equipo_cita_proteger_honorario();

-- ============================================================
-- 00032 — Citas snapshot
-- ============================================================
DROP TRIGGER IF EXISTS trg_citas_proteger_snapshot ON public.mpaci_citas;
DROP TRIGGER IF EXISTS trg_citas_autofill_snapshot ON public.mpaci_citas;
DROP FUNCTION IF EXISTS public.fn_citas_proteger_snapshot();
DROP FUNCTION IF EXISTS public.fn_citas_autofill_snapshot();
ALTER TABLE public.mpaci_citas
    DROP COLUMN IF EXISTS honorarios_snapshot,
    DROP COLUMN IF EXISTS config_snapshot,
    DROP COLUMN IF EXISTS duracion_snapshot_min,
    DROP COLUMN IF EXISTS precio_snapshot;

-- ============================================================
-- 00031 — Honorarios avanzados
-- ============================================================
ALTER TABLE public.mpaci_servicios_config
    DROP CONSTRAINT IF EXISTS chk_servicios_config_pct_no_realizada,
    DROP CONSTRAINT IF EXISTS chk_servicios_config_modo_bloque,
    DROP CONSTRAINT IF EXISTS chk_servicios_config_unidad,
    DROP CONSTRAINT IF EXISTS chk_servicios_config_modelo;
ALTER TABLE public.mpaci_servicios_config
    DROP COLUMN IF EXISTS fee_cancelacion_tardia,
    DROP COLUMN IF EXISTS pct_no_realizada,
    DROP COLUMN IF EXISTS honorarios_por_rol,
    DROP COLUMN IF EXISTS monto_por_cirugia_general,
    DROP COLUMN IF EXISTS modo_bloque,
    DROP COLUMN IF EXISTS unidad_honorario;

-- ============================================================
-- 00030 — Servicios completar
-- ============================================================
ALTER TABLE public.mpaci_servicios
    DROP CONSTRAINT IF EXISTS chk_servicios_categoria;
ALTER TABLE public.mpaci_servicios
    DROP COLUMN IF EXISTS roles_sugeridos,
    DROP COLUMN IF EXISTS es_cirugia,
    DROP COLUMN IF EXISTS categoria;

-- ============================================================
-- 00029 — CHECK constraints críticos
-- ============================================================
ALTER TABLE public.mpaci_medicamentos_paciente
    DROP CONSTRAINT IF EXISTS chk_medicamentos_estado;
ALTER TABLE public.mpaci_alergias
    DROP CONSTRAINT IF EXISTS chk_alergias_severidad;
ALTER TABLE public.mpaci_diagnosticos
    DROP CONSTRAINT IF EXISTS chk_diagnosticos_estado,
    DROP CONSTRAINT IF EXISTS chk_diagnosticos_lateralidad;
ALTER TABLE public.mpaci_servicios_precios
    DROP CONSTRAINT IF EXISTS chk_precios_cobertura;
ALTER TABLE public.mpaci_prospectos
    DROP CONSTRAINT IF EXISTS chk_prospectos_estado;
ALTER TABLE public.mpaci_bloques_horarios
    DROP CONSTRAINT IF EXISTS chk_bloques_estado,
    DROP CONSTRAINT IF EXISTS chk_bloques_tipo;
ALTER TABLE public.mpaci_equipo_cita
    DROP CONSTRAINT IF EXISTS chk_equipo_cita_rol;
ALTER TABLE public.mpaci_citas
    DROP CONSTRAINT IF EXISTS chk_citas_estado_pago,
    DROP CONSTRAINT IF EXISTS chk_citas_estado_operativo;

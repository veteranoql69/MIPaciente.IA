-- ============================================================
-- ROLLBACK CONSOLIDADO: 00021 a 00026
-- ============================================================
-- Ejecutar en orden inverso para deshacer todas las migraciones
-- de evolución del modelo de datos.
-- ⚠️ DESTRUYE DATOS. Solo usar en desarrollo.
-- ============================================================

-- 00026: Estadísticas MP
DROP TABLE IF EXISTS public.mpaci_permisos_tablero CASCADE;
DROP TABLE IF EXISTS public.mpaci_tableros_reportes CASCADE;
DROP TABLE IF EXISTS public.mpaci_tableros CASCADE;
DROP TABLE IF EXISTS public.mpaci_reportes CASCADE;

-- 00025: Permisos granulares
DROP FUNCTION IF EXISTS public.check_permission(UUID, TEXT);
DROP TABLE IF EXISTS public.mpaci_auditoria_permisos CASCADE;
ALTER TABLE public.mpaci_usuarios DROP COLUMN IF EXISTS permisos;
ALTER TABLE public.mpaci_usuarios DROP COLUMN IF EXISTS plantilla_permisos_id;
DROP TABLE IF EXISTS public.mpaci_plantillas_permisos CASCADE;
-- NOTA: No se pueden eliminar valores de un enum en PostgreSQL.
-- Los valores admin_general, enfermera_tens, externo permanecerán en el enum.

-- 00024: Ficha Clínica Estructurada
DROP TABLE IF EXISTS public.mpaci_documentos CASCADE;
DROP TABLE IF EXISTS public.mpaci_registros_clinicos CASCADE;
DROP TABLE IF EXISTS public.mpaci_plantillas_clinicas CASCADE;
DROP TABLE IF EXISTS public.mpaci_cirugias_externas CASCADE;
DROP TABLE IF EXISTS public.mpaci_alergias CASCADE;
DROP TABLE IF EXISTS public.mpaci_medicamentos_paciente CASCADE;
DROP TABLE IF EXISTS public.mpaci_diagnosticos CASCADE;

-- 00023: Agenda Expansion
DROP TABLE IF EXISTS public.mpaci_auditoria_citas CASCADE;
DROP TABLE IF EXISTS public.mpaci_pagos_cita CASCADE;
DROP TABLE IF EXISTS public.mpaci_equipo_cita CASCADE;
DROP TABLE IF EXISTS public.mpaci_servicios_config CASCADE;
ALTER TABLE public.mpaci_citas DROP COLUMN IF EXISTS estado_confirmacion;
ALTER TABLE public.mpaci_citas DROP COLUMN IF EXISTS cobertura_usada;
ALTER TABLE public.mpaci_citas DROP COLUMN IF EXISTS gcal_event_id;
ALTER TABLE public.mpaci_citas DROP COLUMN IF EXISTS sala_id;
ALTER TABLE public.mpaci_citas DROP COLUMN IF EXISTS motivo_cancelacion;
ALTER TABLE public.mpaci_bloques_horarios DROP COLUMN IF EXISTS motivo;
ALTER TABLE public.mpaci_bloques_horarios DROP COLUMN IF EXISTS tipo;
DROP TABLE IF EXISTS public.mpaci_salas CASCADE;

-- 00022: CRM Actividades + Timeline
DROP TABLE IF EXISTS public.mpaci_timeline_eventos CASCADE;
ALTER TABLE public.mpaci_prospectos DROP COLUMN IF EXISTS campos_personalizados;
-- Revertir actividades es complejo por los constraints, se deja la tabla expandida
-- o se restaura desde backup.
ALTER TABLE public.mpaci_actividades DROP CONSTRAINT IF EXISTS chk_actividades_vinculo;
ALTER TABLE public.mpaci_actividades DROP CONSTRAINT IF EXISTS chk_actividades_estado;
ALTER TABLE public.mpaci_actividades DROP CONSTRAINT IF EXISTS chk_actividades_categoria;
ALTER TABLE public.mpaci_actividades DROP CONSTRAINT IF EXISTS chk_actividades_prioridad;
ALTER TABLE public.mpaci_actividades DROP COLUMN IF EXISTS completada_por;
ALTER TABLE public.mpaci_actividades DROP COLUMN IF EXISTS completada_en;
ALTER TABLE public.mpaci_actividades DROP COLUMN IF EXISTS es_de_ia;
ALTER TABLE public.mpaci_actividades DROP COLUMN IF EXISTS asignado_por;
ALTER TABLE public.mpaci_actividades DROP COLUMN IF EXISTS estado;
ALTER TABLE public.mpaci_actividades DROP COLUMN IF EXISTS categoria;
ALTER TABLE public.mpaci_actividades DROP COLUMN IF EXISTS prioridad;
ALTER TABLE public.mpaci_actividades DROP COLUMN IF EXISTS titulo;
ALTER TABLE public.mpaci_actividades DROP COLUMN IF EXISTS contacto_id;

-- 00021: Contactos Expansion
DROP TRIGGER IF EXISTS trg_contactos_updated_at ON public.mpaci_contactos;
DROP FUNCTION IF EXISTS public.fn_contactos_updated_at();
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS actualizado_en;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS campos_personalizados;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS observaciones_internas;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS emergencia_telefono;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS emergencia_nombre;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS talla_cm;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS peso_kg;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS empresa_paciente;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS plan_convenio;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS prevision;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS email_alternativo;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS telefono_secundario;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS region;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS comuna;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS direccion;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS genero;
ALTER TABLE public.mpaci_contactos DROP COLUMN IF EXISTS fecha_nacimiento;

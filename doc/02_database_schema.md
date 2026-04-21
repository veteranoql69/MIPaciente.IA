# Modelo de Datos (Esquema Multi-Tenant)

Toda la base de datos corre sobre un modelo Multi-Tenant aislando datos lógicamente mediante `Row Level Security (RLS)` de PostgreSQL usando el claim `empresa_id`.

## Reglas Obligatorias de Diseño
* **Nomenclatura (MANDATORY):** TODAS las tablas, sin excepción, inician con el prefijo `mpaci_`.
* **Seguridad:** Todas las tablas de negocio incluyen validación en políticas RLS basada en `empresa_id = get_my_empresa_id()` (Helper propio SECURITY DEFINER).
* **Supabase Types:** El uso de genéricos recae únicamente sobre `database.types.ts` generado por Supabase.
* **Inmutabilidad:** Las tablas de auditoría y registros clínicos post-lock bloquean UPDATE y DELETE vía RLS.

## Árbol Relacional y Entidades

```text
auth.users (Manejado por Supabase GoTrue Auth interno)
    └── mpaci_usuarios 
        (empresa_id, rol app_role, permisos JSONB, plantilla_permisos_id,
         onboarding_completado, avatar_url, ultima_sesion)

mpaci_empresas (slug LOWERCASE UNIQUE, nombre, plan_suscripcion, activo)
    │
    ├── mpaci_sucursales (nombre, direccion, activo)
    │       └── mpaci_salas (nombre, descripcion, activo)                    [00023]
    │
    ├── mpaci_servicios (nombre, duracion_minutos, precio_base, activo)
    │       ├── mpaci_servicios_precios (cobertura, precio, etiqueta)        [UNIQUE per cobertura]
    │       └── mpaci_servicios_config (medico_id, sucursal_id,              [00023]
    │               duracion_minutos, buffers, sala_id,
    │               modelo_honorarios, alias)                                [UNIQUE combo]
    │
    ├── mpaci_contactos (demográficos completos V2.3, clínico rápido,
    │       canal_contacto, canal_referencia, prevision, emergencia,
    │       campos_personalizados JSONB)                                     [00021]
    │       │
    │       ├── mpaci_prospectos (responsable_id, estado, servicio_id,
    │       │       campos_personalizados JSONB)
    │       │       ├── mpaci_actividades (contacto_id, titulo, prioridad,   [00022]
    │       │       │       categoria, estado, asignado_a/por, es_de_ia)
    │       │       └── mpaci_bitacora (accion, estados) [INMUTABLE]
    │       │
    │       ├── mpaci_diagnosticos (CIE-10, lateralidad, estado,             [00024]
    │       │       es_principal, es_favorito, nota)
    │       ├── mpaci_medicamentos_paciente (nombre, estado, flags, nota)    [00024]
    │       ├── mpaci_alergias (sustancia, reaccion, severidad, nota)        [00024]
    │       ├── mpaci_cirugias_externas (nombre, fecha, profesional)         [00024]
    │       ├── mpaci_documentos (tipo, nombre, storage_path, origen)        [00024]
    │       └── mpaci_timeline_eventos (origen, referencia_id/tabla,         [00022]
    │               descripcion, metadata) [INMUTABLE]
    │
    ├── mpaci_citas (sucursal_id, contacto_id, prospecto_id, servicio_id,
    │       medico_id, sala_id, precio_base, descuento,
    │       estado_operativo, estado_pago, estado_confirmacion,              [00023]
    │       cobertura_usada, gcal_event_id, motivo_cancelacion)
    │       │
    │       ├── mpaci_fichas_clinicas (contenido_texto [DEPRECATED]) [LOCK 24h]
    │       │       ├── mpaci_registros_clinicos (plantilla_id,              [00024]
    │       │       │       contenido JSONB) [hereda lock]
    │       │       └── mpaci_anotaciones_clinicas (contenido) [INMUTABLE]
    │       │
    │       ├── mpaci_equipo_cita (usuario_id, rol_clinico,                  [00023]
    │       │       honorario_calculado/fijado)
    │       │
    │       ├── mpaci_pagos_cita (tipo, monto, medio_pago) [INMUTABLE]       [00023]
    │       │
    │       └── mpaci_auditoria_citas (tipo_evento, valores,                 [00023]
    │               motivo, version_config) [INMUTABLE]
    │
    ├── mpaci_bloques_horarios (medico_id, rango_tiempo, motivo, tipo)       [00023]
    │       [GIST EXCLUDE anti-solapamiento]
    │
    ├── mpaci_mensajes_entrantes (canal, remitente, contenido, contacto_id)
    │
    ├── mpaci_plantillas_clinicas (nombre, categoria, campos JSONB,          [00024]
    │       version, activo)
    │
    ├── mpaci_plantillas_permisos (nombre, permisos JSONB, es_sistema)       [00025]
    │
    ├── mpaci_auditoria_permisos (usuario_afectado, permiso_clave,           [00025]
    │       valor_anterior/nuevo) [INMUTABLE, solo admin_general]
    │
    ├── mpaci_reportes (nombre, configuracion JSONB, visualizacion,          [00026]
    │       visibilidad, visibilidad_config JSONB)
    │
    └── mpaci_tableros (nombre, configuracion_visual JSONB)                  [00026]
            ├── mpaci_tableros_reportes (reporte_id, posicion, ancho)
            └── mpaci_permisos_tablero (tipo, referencia_id/texto)
```

## Estructura de Precios (Contrato de Servicios)
Se maneja una dualidad estructurada en precios:
1. `mpaci_servicios.precio_base`: Precio `NOT NULL` establecido como base o precio primario de la clínica para cada operación.
2. `mpaci_servicios_precios.precio`: Precio preferencial o contractual que interceden factores de cobertura (por ejemplo: "isapre_particular", "fonasa", "pad_2026"). Si no existe el registro aquí, la Server Action retrocede al `precio_base` por defecto.

## Funciones Helper

| Función | Tipo | Propósito |
|---|---|---|
| `get_my_empresa_id()` | SECURITY DEFINER | Obtiene empresa_id del usuario autenticado para RLS |
| `check_permission(user_id, key)` | SECURITY DEFINER | Verifica permiso granular (override > plantilla > false) |
| `handle_new_user()` | TRIGGER | Auto-crea perfil en mpaci_usuarios al registrarse |
| `handle_user_login()` | TRIGGER | Actualiza avatar_url y ultima_sesion en cada login |
| `fn_contactos_updated_at()` | TRIGGER | Actualiza timestamp en cada UPDATE de contacto |

## Historial de Migraciones

| Rango | Descripción |
|---|---|
| 00001–00006 | Cimientos: tablas base, ficha clínica, bloques, actividades, triggers |
| 00007–00012 | Multi-tenant: empresas, sucursales, FKs, helper, RLS, trigger fix |
| 00013–00020 | Sprint 1: servicios precios, actividades MT, onboarding, citas-prospecto, mensajes |
| **00021** | **Contactos expansion: 14+ columnas demográficas/clínicas/emergencia** |
| **00022** | **CRM: actividades enriquecidas + timeline eventos integrado** |
| **00023** | **Agenda: salas, service builder, equipo clínico, pagos, auditoría** |
| **00024** | **Ficha Clínica: diagnósticos, medicamentos, alergias, plantillas, registros, documentos** |
| **00025** | **Permisos: enum expansion, plantillas, JSONB granular, auditoría, check_permission()** |
| **00026** | **Estadísticas: reportes, tableros, permisos por tablero** |

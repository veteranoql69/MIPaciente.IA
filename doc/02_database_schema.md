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

mpaci_empresas (slug LOWERCASE UNIQUE, nombre, plan_suscripcion, activo,
                bloque_base_min [10,15,20])                             [00039]
    │
    ├── mpaci_invitaciones (email, rol, codigo, expires_at, usado)           [00046]
    │
    ├── mpaci_sucursales (nombre, direccion, activo)
    │       ├── mpaci_salas (nombre, descripcion, activo)                    [00023]
    │       ├── mpaci_insumos (nombre, sku, stock_actual)                    [00038]
    │       └── mpaci_equipamiento (nombre, activo)                          [00038]
    │
    ├── mpaci_servicios (nombre, duracion_minutos, precio_base, activo)
    │       ├── mpaci_servicios_precios (cobertura, precio, etiqueta)        [UNIQUE per cobertura]
    │       └── mpaci_servicios_config (medico_id, sucursal_id,              [00023]
    │               duracion_minutos, buffers, sala_id,
    │               modelo_honorarios, unidad_honorario, modo_bloque)        [00029, 00031]
    │
    ├── mpaci_contactos (demográficos completos V2.3, clínico rápido,        [00021]
    │       fuente_id, campana_id, prevision, emergencia)                    [00044]
    │       │
    │       ├── mpaci_prospectos (responsable_id, estado, servicio_id)
    │       │       ├── mpaci_actividades (contacto_id, titulo, prioridad)   [00022]
    │       │       └── mpaci_bitacora (accion, estados) [INMUTABLE]
    │       │
    │       ├── mpaci_diagnosticos (CIE-10 code, lateralidad, estado)        [00024]
    │       │       └── [Ref a mpaci_catalogo_cie10]                         [00040]
    │       ├── mpaci_medicamentos_paciente (nombre, catalogo_id)            [00040]
    │       ├── mpaci_alergias, mpaci_cirugias_externas, mpaci_documentos    [00024]
    │       └── mpaci_timeline_eventos (origen, referencia_id, desc)         [00022]
    │
    ├── mpaci_citas (sucursal_id, contacto_id, servicio_id, medico_id,
    │       precio_base, estado_operativo, estado_pago)                      [00023]
    │       │
    │       ├── mpaci_fichas_clinicas (contenido_texto [DEPRECATED]) [LOCK 24h]
    │       │       ├── mpaci_registros_clinicos (plantilla_id, contenido)   [00024]
    │       │       └── mpaci_anotaciones_clinicas (contenido) [INMUTABLE]
    │       │
    │       ├── mpaci_cita_procedimientos (procedimiento_id, cantidad)        [00035]
    │       ├── mpaci_cita_pacientes (contacto_id, es_principal)              [00036]
    │       ├── mpaci_equipo_cita (usuario_id, rol_clinico, honorario)       [00023]
    │       ├── mpaci_pagos_cita (tipo, monto, medio_pago)                   [00023]
    │       └── mpaci_auditoria_citas (evento, motivo, version)              [00023]
    │
    ├── mpaci_horarios_prestador (medico_id, dia_semana, hora_inicio/fin)    [00034]
    │       ├── mpaci_horarios_pausas (hora_inicio, hora_fin, motivo)        [00034]
    │       └── mpaci_horarios_excepciones (fecha, tipo, hora_inicio/fin)    [00034]
    │
    ├── mpaci_bloques_horarios (medico_id, rango_tiempo, motivo, tipo)       [00023]
    ├── mpaci_notas_agenda (alcance [dia/semana], fecha, contenido)          [00039]
    ├── mpaci_frases_rapidas (categoria, atajo, contenido)                   [00041]
    ├── mpaci_reasignaciones (de_usuario, a_usuario, motivo) [INMUTABLE]     [00043]
    │
    ├── mpaci_fuentes_lead (nombre, tipo [organico, pagado, etc])            [00044]
    └── mpaci_campanas (nombre, inversion, ROI_config)                       [00044]

[GLOBAL CATALOGS - SHARED]
    ├── mpaci_catalogo_cie10 (codigo PRIMARY, descripcion, capitulo)         [00040]
    └── mpaci_catalogo_medicamentos (nombre_generico, concentracion)         [00040]
```

## Estructura de Precios y Honorarios
1. `mpaci_servicios.precio_base`: Precio base de la clínica.
2. `mpaci_servicios_precios.precio`: Precios contractuales por cobertura (Isapre, Fonasa).
3. `mpaci_servicios_config.modelo_honorarios`: Define cómo se paga al profesional (`fijo`, `bloque_procedimiento`, `cirugia_general`). [00031]

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
| 00021–00026 | Expansión: CRM, Agenda inicial, Ficha estructurada, Permisos, Estadísticas |
| **00027–00033** | **Refuerzo: Roles nuevos, checks críticos, honorarios avanzados, snapshots de cita.** |
| **00034–00037** | **Disponibilidad: Horarios recurrentes (prestador), pausas, excepciones, procedimientos.** |
| **00038–00041** | **Operación: Recursos sede, notas agenda, bloque base configurable, catálogos CIE-10/Med.** |
| **00042–00047** | **Optimización: Reasignaciones CRM, marketing (fuentes/campañas), sistema de invitaciones y fix de recursión RLS.** |

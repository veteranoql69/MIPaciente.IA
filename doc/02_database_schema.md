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
        (empresa_id, rol app_role, onboarding_completado, avatar_url, ultima_sesion)
        │
        (+ gcal_access_token, gcal_refresh_token, gcal_token_expiry)          [00049]
        │
        ├── mpaci_permisos_usuario (modulo, permiso, activo) [ABAC System]    [00048]
        └── mpaci_asignaciones_medico (asistente_id, medico_id)               [00048]

mpaci_empresas (slug LOWERCASE UNIQUE, nombre, plan_suscripcion, activo,
                bloque_base_min [10,15,20],                            [00039]
                timezone TEXT DEFAULT 'America/Santiago')              [00053]
    │
    ├── mpaci_invitaciones (email, rol, codigo, expires_at, usado)           [00046]
    │
    ├── mpaci_sucursales (nombre, direccion, activo)
    │       ├── mpaci_salas (nombre, descripcion, activo)                    [00023]
    │       ├── mpaci_insumos (nombre, sku, stock_actual)                    [00038]
    │       └── mpaci_equipamiento (nombre, activo)                          [00038]
    │
    ├── mpaci_servicios (nombre, duracion_minutos, precio_base, activo,
    │       categoria, es_cirugia,                                           [00029]
    │       descripcion_procedimiento, cuidados_post_op[],                   [00051]
    │       instrucciones_pre_op[], plantilla_consentimiento)                [00051]
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
    │       ├── mpaci_timeline_eventos (origen, referencia_id, desc)         [00022]
    │       └── mpaci_motivos_consulta (empresa_id nullable=global, nombre, activo, [00050]
    │               orden) — catálogo de chips motivo consulta; NULL=global
    │
    ├── mpaci_citas (sucursal_id, contacto_id, servicio_id, medico_id,
    │       precio_base, estado_operativo, estado_pago)                      [00023]
    │       │
    │       ├── mpaci_fichas_clinicas (contenido_texto [DEPRECATED]) [LOCK 24h] [00050]
    │       │       +motivos_consulta_ids[], +notas_medicas, +examenes_solicitados[],
    │       │       +notas_examenes, +examen_fisico (JSONB), +fotos_examenes_paths[],
    │       │       +medico_id (owner), +medico_consulta_id (performer), +ultima_edicion_en,
    │       +contacto_id FK→mpaci_contactos (backfill desde cita_id)   [00055]
    │       │       ─ Vista Procedimiento (cuando es_cirugia=true):
    │       │           notas_medicas → "Notas Internas" (solo médico)
    │       │           contenido_texto → "Notas al Paciente" (va al PDF)
    │       │           examenes_solicitados[] → controles post-op
    │       │           examen_fisico JSONB → campos específicos del procedimiento
    │       │           [PDF generado via Stirling PDF → mpaci_documentos tipo='protocolo_quirurgico']
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

## Seguridad y Control de Acceso (ABAC y RLS)
El sistema utiliza un modelo de **Control de Acceso Basado en Atributos (ABAC)** mediante la tabla `mpaci_permisos_usuario`, sumado a **Row Level Security (RLS)** nativo de PostgreSQL.

1. **Jerarquía:** Un `admin_general` tiene acceso total implícito. Otros roles (`medico`, `asistente`, etc.) dependen de sus entradas activas en la tabla de permisos.
2. **Asignaciones:** La tabla `mpaci_asignaciones_medico` permite que un asistente gestione la agenda de múltiples médicos específicos.
3. **Fichas Clínicas (Doble Verificación y Bloqueo 24h):** 
   - Para insertar (`INSERT`), el sistema exige que el usuario sea el `medico_id` de la ficha (Owner).
   - El profesional que realiza la consulta puntual queda registrado en `medico_consulta_id` (Performer).
   - Para actualizar (`UPDATE`), la ficha se bloquea automáticamente pasadas **24 horas** desde `ultima_edicion_en` para garantizar inmutabilidad clínica.

## Estructura de Precios y Honorarios
1. `mpaci_servicios.precio_base`: Precio base de la clínica.
2. `mpaci_servicios_precios.precio`: Precios contractuales por cobertura (Isapre, Fonasa).
3. `mpaci_servicios_config.modelo_honorarios`: Define cómo se paga al profesional (`fijo`, `bloque_procedimiento`, `cirugia_general`). [00031]

## Funciones Helper

| Función | Tipo | Propósito |
|---|---|---|
| `get_my_empresa_id()` | SECURITY DEFINER | Obtiene empresa_id del usuario autenticado para RLS |
| `tiene_permiso(user_id, mod, perm)` | SECURITY DEFINER | Valida permiso granular (modular) |
| `seed_permisos_por_rol()` | FUNCTION | Aplica plantillas de permisos base según el rol del usuario |
| `handle_new_user()` | TRIGGER | Auto-crea perfil en mpaci_usuarios al registrarse |
| `handle_user_login()` | TRIGGER | Actualiza avatar_url y ultima_sesion en cada login |

## Vista Procedimiento Quirúrgico (Sprint 7)

Cuando `mpaci_servicios.es_cirugia = true` o `categoria IN ('cirugia','procedimiento')`, el doble-click en una cita de la agenda abre la **Vista Procedimiento** en lugar del modal de consulta rápida estándar.

### Flujo de datos

```text
[1] Server Action getProcedimientoTemplate(servicio_id)
    └── SELECT descripcion_procedimiento, cuidados_post_op,
               instrucciones_pre_op, plantilla_consentimiento
        FROM mpaci_servicios WHERE id = servicio_id
        → Pre-llena el formulario (editable por el médico)

[2] Médico completa dos campos libres:
    ├── Notas Internas    → mpaci_fichas_clinicas.notas_medicas    (privadas, no van al PDF)
    └── Notas al Paciente → mpaci_fichas_clinicas.contenido_texto  (incluidas en el PDF)

[3] Server Action generarProtocoloPDF(ficha_id)
    ├── Fusiona: datos paciente + descripcion_procedimiento + cuidados_post_op
    │            + notas al paciente + plantilla_consentimiento
    ├── POST → STIRLING_PDF_URL/api/v1/convert/html/pdf   (var en .env)
    ├── Recibe buffer → Supabase Storage
    └── INSERT mpaci_documentos (tipo='protocolo_quirurgico', cita_id, ficha_id)
        → Devuelve URL para firma física o digital
```

### Campos del examen_fisico JSONB por procedimiento (ejemplos seed)

| Procedimiento | Campos clave JSONB |
|---|---|
| REZUM | ipss_score, qmax_ml_s, volumen_prostatico_cc, pulsos_vapor_aplicados, alergia_penicilina |
| HoLEP | ipss_score, adenoma_extraido_g, asa_clasificacion, alergia_contraste_yodado, tfg_ml_min |
| Circuncisión ZSR | prepucio (grado), alergia_latex, anillo_zsr_talla, material_libre_latex |
| LEOC | calculo_mm, densidad_hu, ondas_aplicadas, kv_usado, fragmentacion |
| Biopsia Fusión | psa_ng_ml, cilindros_tomados, pirads_actual, tecnica |
| NLP | calculo_derecho_mm, alergia_cotrimoxazol, antibiotico_profilaxis, tfg_ml_min |
| Uretroplastia | longitud_estenosis_cm, calibre_estenosis_fr, tecnica_propuesta |
| Varicocelectomía | grado_varicocele, seminograma_concentracion_M_ml, contexto |

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
| **00042–00049** | **Optimización y ABAC: Reasignaciones, marketing, invitaciones, permisos granulares y Tokens Externos (GCal).** |
| **00050** | **Consulta Rápida Clínica: mpaci_motivos_consulta + 8 columnas en mpaci_fichas_clinicas (motivos, notas, exámenes, examen físico, fotos). Función calcular_imc().** |
| **00051** | **Templates Procedimiento Quirúrgico: 4 columnas en mpaci_servicios (descripcion_procedimiento TEXT, cuidados_post_op TEXT[], instrucciones_pre_op TEXT[], plantilla_consentimiento TEXT). Pobladas para 12 servicios del catálogo Urbamed.** |
| **00052** | **Función reset_demo_staging(): restaura 7 citas demo para el día actual. Usada por el botón "Restaurar Demo" (roles admin_general y medico).** |
| **00053** | **timezone TEXT en mpaci_empresas: soporte multi-país SaaS. Default 'America/Santiago'. Toda la lógica de fechas usa esta columna vía luxon (src/lib/dates.ts).** |
| **00054** | **Fix timezone en reset_demo_staging(): timezone(zone, ts) en lugar de ts AT TIME ZONE zone. El error anterior desplazaba las citas 4h hacia el pasado (UTC vs local).** |
| **00055** | **contacto_id en mpaci_fichas_clinicas: FK a mpaci_contactos con backfill desde cita_id. Habilita query de fichas por paciente sin JOIN a mpaci_citas. Índice idx_fichas_clinicas_contacto_id.** |
| **00056** | **RLS INSERT y UPDATE para mpaci_citas: admin/admin_general sin restricción, médico solo su propia agenda, asistente solo médicos asignados en mpaci_asignaciones_medico.** |

# Modelo de Datos (Esquema Multi-Tenant)

Toda la base de datos corre sobre un modelo Multi-Tenant aislando datos lógicamente mediante `Row Level Security (RLS)` de PostgreSQL usando el claim `empresa_id`.

## Reglas Obligatorias de Diseño
* **Nomenclatura (MANDATORY):** TODAS las tablas, sin excepción, inician con el prefijo `mpaci_`.
* **Seguridad:** Todas las tablas de negocio incluyen validación en políticas RLS basada en `empresa_id = get_my_empresa_id()` (Helper propio SECURITY DEFINER).
* **Supabase Types:** El uso de genéricos recae únicamente sobre `database.types.ts` generado por Supabase.

## Árbol Relacional y Entidades (MVP)

A continuación, la jerarquía principal y relacional diseñada para el proyecto:

```text
auth.users (Manejado por Supabase GoTrue Auth interno)
    └── mpaci_usuarios 
        (empresa_id [nullable para nuevos], rol, onboarding_completado, avatar_url, ultima_sesion)

mpaci_empresas (slug LOWERCASE UNIQUE, nombre, plan_suscripcion [nullable], activo)
    ├── mpaci_sucursales (empresa_id, nombre, direccion, activo)
    ├── mpaci_servicios (empresa_id, nombre, duracion_minutos, precio_base [FALLBACK NOT NULL], activo)
    │       └── mpaci_servicios_precios (servicio_id, empresa_id, cobertura TEXT, precio) [UNIQUE per cobertura]
    ├── mpaci_contactos (empresa_id, canal_contacto, canal_referencia, canal_origen [DEPRECATED S5])
    │       └── mpaci_prospectos (empresa_id, contacto_id, responsable_id, estado, servicio_id)
    │               ├── mpaci_actividades (empresa_id, prospecto_id, tipo, fecha_vencimiento, completada)
    │               └── mpaci_bitacora (empresa_id, prospecto_id, accion, estado_anterior, estado_nuevo) [INMUTABLE]
    ├── mpaci_citas (empresa_id, sucursal_id, contacto_id, prospecto_id [nullable S5], servicio_id, medico_id, precio_base, descuento)
    │       └── mpaci_fichas_clinicas (empresa_id, cita_id UNIQUE, contenido_texto) [LOCK 24h]
    │               └── mpaci_anotaciones_clinicas (empresa_id, ficha_id, medico_id, contenido) [INMUTABLE]
    ├── mpaci_bloques_horarios (empresa_id, sucursal_id, medico_id, rango_tiempo TSTZRANGE) [GIST EXCLUDE]
    └── mpaci_mensajes_entrantes (empresa_id, canal, remitente, contenido, contacto_id) [Agregado Sprint 7 para webhooks y chats crudos]
```

## Estructura de Precios (Contrato de Servicios)
Se maneja una dualidad estructurada en precios:
1. `mpaci_servicios.precio_base`: Precio `NOT NULL` establecido como base o precio primario de la clínica para cada operación.
2. `mpaci_servicios_precios.precio`: Precio preferencial o contractual que interceden factores de cobertura (por ejemplo: "isapre_particular", "fonasa", "pad_2026"). Si no existe el registro aquí, la Server Action retrocede al `precio_base` por defecto.

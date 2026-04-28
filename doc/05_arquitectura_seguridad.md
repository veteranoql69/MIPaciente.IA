# Arquitectura de Seguridad y RLS

Este documento describe la estrategia de aislamiento de datos y seguridad en **Mi-Paciente.com**, enfocándose en el sistema de Row Level Security (RLS) de Supabase/PostgreSQL.

## 1. El Concepto Multi-Tenant
Urbamed utiliza un aislamiento lógico. Todas las clínicas comparten las mismas tablas físicas, pero las políticas RLS aseguran que un usuario solo pueda leer/escribir datos que pertenezcan a su `empresa_id`.

## 2. El Problema de la Recursión Infinita (Postgres Error 42P17)
Durante el desarrollo del Sprint 2, detectamos un error crítico de recursión en la tabla `mpaci_usuarios`.

### El Escenario de Error:
1. Una política en `mpaci_usuarios` llamaba a `get_my_empresa_id()`.
2. `get_my_empresa_id()` realizaba un `SELECT` sobre `mpaci_usuarios` para buscar la empresa del usuario actual.
3. Ese `SELECT` activaba nuevamente la política de RLS.
4. Resultado: Bucle infinito y caída del sistema.

### La Solución (Migración 00047):
Hemos simplificado la política de la tabla `mpaci_usuarios` para que sea **independiente** de funciones que consulten la misma tabla.

*   **Lectura de Perfil Propio:** `auth.uid() = id`. (Basado puramente en el ID de autenticación, sin consultas extra).
*   **Lectura de Compañeros:** Para que un Admin vea a su equipo, la política debe usar subconsultas optimizadas o claims de JWT si están disponibles.

## 3. Mejores Prácticas para RLS
1. **Evitar Circularidad:** Nunca llames a una función que consulte la Tabla A desde una política de la Tabla A.
2. **SECURITY DEFINER vs INVOKER:** Las funciones como `get_my_empresa_id()` deben ser `SECURITY DEFINER` para saltarse el RLS internamente, pero deben ser programadas con extrema cautela.
3. **Uso de Claims:** Siempre que sea posible, pre-cargar el `empresa_id` en el JWT del usuario para que el RLS sea instantáneo y no requiera consultas adicionales.

## 4. Auditoría de Permisos
Cada mutación en el sistema pasa por dos filtros:
1. **RLS:** Bloquea el acceso a nivel de fila (Capa de datos).
2. **Server Actions (Zod):** Valida que el usuario tenga el `app_role` necesario para realizar la acción (Capa de negocio).

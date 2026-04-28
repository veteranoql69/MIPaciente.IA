# Wiki de Políticas RLS (Row Level Security) - Mi-Paciente

Este documento sirve como referencia práctica de todas las políticas de seguridad (RLS) configuradas en la base de datos de **Mi-Paciente**, basándose en las migraciones actuales. Las políticas aseguran la arquitectura **Multi-Tenant** (cada clínica ve solo su data) y el control de **Roles** (Admin, Médico, Asistente, etc.).

## Patrones de Seguridad Base (Core)

Casi todas las políticas en el sistema implementan dos funciones clave:
1. `get_my_empresa_id()`: Verifica que el `empresa_id` de la fila coincida con el entorno activo del usuario.
2. `auth.uid()`: El ID de sesión en Supabase Auth, que se mapea a `mpaci_usuarios.id` para revisar el `rol`.

---

## 1. Módulo Core / Usuarios / Empresas

### Políticas Principales

*   **`Usuarios ven su propio perfil`** (Tabla: `mpaci_usuarios`)
    *   **Descripción:** Permite que cualquier usuario lea sus propios datos base.
    *   **Ejemplo Práctico:** Al hacer login, el frontend solicita el perfil con `id = auth.uid()`.
*   **`Usuarios ven su empresa asignada`** (Tabla: `mpaci_usuarios`)
    *   **Descripción:** Un usuario puede ver el perfil de otros usuarios siempre que pertenezcan al mismo `empresa_id`.
*   **`Admins ven todos los perfiles`** / **`Admin gestiona usuarios de su empresa`**
    *   **Descripción:** Los dueños de clínica (`admin_general`, `admin`) pueden crear, editar o desactivar perfiles médicos y de asistentes de su propia empresa.
*   **`Onboarding lista empresas activas`** (Tabla: `mpaci_empresas`)
    *   **Descripción:** Permite a usuarios sin clínica ver si un *slug* o clínica existe durante el registro, pero no expone datos sensibles.

---

## 2. Módulo CRM (Prospectos y Contactos)

*   **`Staff ve contactos de su empresa`** / **`Staff ve prospectos de su empresa`**
    *   **Descripción:** Cualquier miembro del personal autenticado puede leer el CRM, pero *estrictamente* filtrado por `get_my_empresa_id()`.
*   **`Staff gestiona contactos de su empresa`**
    *   **Descripción:** Permite INSERT, UPDATE y DELETE en prospectos/contactos para roles operativos.
    *   **Ejemplo SQL de la política:**
      ```sql
      USING (empresa_id = get_my_empresa_id() AND EXISTS (
          SELECT 1 FROM mpaci_usuarios WHERE id = auth.uid()
          AND rol IN ('admin_general', 'admin', 'asistente', 'medico', 'enfermera_tens')
      ))
      ```
*   **`Aislamiento multi-tenant mensajes entrantes`** (Tabla: `mpaci_mensajes`)
    *   **Descripción:** Regla crítica que impide que un Webhook o atacante inyecte mensajes para un WhatsApp/empresa que no le corresponde.

---

## 3. Módulo Agenda y Honorarios

*   **`Staff ve citas de su empresa`** / **`Staff ve cita_pacientes de su empresa`**
    *   **Descripción:** (Migración 36). Un recepcionista o médico puede ver el calendario, pero solo los eventos de su clínica.
*   **`Medicos ven sus propias citas`** / **`Medicos gestionan sus bloques`**
    *   **Descripción:** Un profesional de la salud puede administrar su propia disponibilidad y turnos (`mpaci_honorarios_bloque`), pero no puede alterar la de otros médicos (a menos que sea Admin).
*   **`Admin inserta honorarios bloque`** / **`Admin confirma honorarios bloque`**
    *   **Descripción:** (Migración 37). Los médicos solicitan honorarios, pero solo el administrador financiero tiene el `FOR UPDATE` para aprobar o rechazar pagos.

---

## 4. Módulo Ficha Clínica (Inmutabilidad Médica)

Este módulo tiene las políticas más estrictas por normativas de salud (HIPAA / Leyes Locales).

*   **`Staff ve fichas de su empresa`**
    *   **Descripción:** Lectura general permitida al personal médico autorizado.
*   **`Medicos crean ficha en su empresa`**
    *   **Descripción:** Solo perfiles clínicos (`medico`, `enfermera_tens`) pueden iniciar una ficha.
*   **`Medicos editan ficha por 24hrs`** (Tabla: `mpaci_fichas_clinicas`)
    *   **Descripción:** Permite modificaciones `FOR UPDATE` solo si `now() < creado_en + interval '24 hours'`.
*   **`Anotaciones son inmutables`** / **`Anotaciones no se pueden borrar`** (Tabla: `mpaci_fichas_anotaciones`)
    *   **Descripción:** Las adiciones posteriores a las 24 horas no modifican la ficha base, sino que agregan notas (append-only). La regla anula cualquier intento de `DELETE` o `UPDATE` (`FOR UPDATE / DELETE USING (false)`).
    *   **Ejemplo Práctico:** Si un médico intenta editar una evolución de hace una semana, la base de datos lo bloquea a nivel de kernel de PostgreSQL.

---

## 5. Catálogos, Insumos y Configuración

*   **`Staff ve insumos de su empresa`** / **`Admin gestiona insumos de su empresa`**
    *   **Descripción:** (Migración 38). Todos ven el stock, pero solo admins pueden dar de alta nuevos productos o descontar stock manualmente.
*   **`Usuarios autenticados leen catalogo cie10`** / **`Usuarios autenticados leen catalogo medicamentos`**
    *   **Descripción:** (Migración 40). El CIE-10 (enfermedades) es un catálogo universal. Todos los usuarios logueados tienen acceso global `FOR SELECT` sin filtro de empresa.

---

## 6. Auditoría y Trazabilidad (Bitácora)

*   **`No Borrar bitacora`** / **`No Editar bitacora`** (Tabla: `mpaci_bitacora`)
    *   **Descripción:** El log del sistema (`mpaci_bitacora`) es 100% inmutable. Cualquier `UPDATE` o `DELETE` es bloqueado por la base de datos para garantizar la validez legal de las auditorías.
*   **`Staff inserta en bitacora de su empresa`**
    *   **Descripción:** Cualquier acción ejecutada por el backend en nombre del usuario permite insertar (`FOR INSERT`) registros de seguimiento.

---

> **💡 Nota de Desarrollo sobre RLS:** 
> Al escribir *Server Actions* en Next.js, NO usamos el Service Role Key (que salta el RLS). Usamos el cliente autenticado (`createClient()`), lo que significa que **todas estas reglas se aplican automáticamente** a cada `select()`, `insert()` o `update()`, brindando una capa de seguridad infranqueable a nivel backend.

**Usuarios y Permisos — Versión 6**

(Con ajuste completo del módulo de Estadísticas y eliminación definitiva del permiso de organización de carpetas)

Este documento define la estructura de usuarios, niveles administrativos y permisos modulares dentro de Mi-Paciente.com.  
Incluye la lógica final de Estadísticas según lo conversado.

---

**1\. Objetivo del sistema de permisos**

* Controlar quién puede ver y hacer qué dentro del sistema.

* Fortalecer seguridad: solo el Administrador General puede otorgar o modificar permisos.

* Mantener flexibilidad con casillas ticables por módulo.

* Evitar accesos indebidos a información clínica, financiera o administrativa.

* Simplificar el uso: cada módulo define sus visibilidades internas (como en Estadísticas).

---

**2\. Tipos de usuario (categorías base)**

*(Usadas solo como clasificación; los permisos reales son 100% modulares.)*

* **Administrador General**

* **Administrador**

* **Médico**

* **Asistente**

* **Enfermera / TENS**

* **Externo**

**2.1 Administrador General**

Máxima autoridad del sistema.

Puede:

* Crear, editar y desactivar usuarios.

* Otorgar, quitar y modificar permisos.

* Crear y modificar plantillas de permisos.

* Ver registro de cambios de permisos.

* Configurar todos los módulos e integraciones.

* Crear/degradar administradores.

No puede:

* Ser modificado por nadie que no sea también Administrador General.

**2.2 Administrador**

Autoridad operativa, sin control de permisos.

Puede:

* Gestionar servicios, precios, programas.

* Ver usuarios y sus datos básicos.

* Ver estadísticas compartidas (si un tablero lo permite).

* Crear usuarios (opcional; quedan sin permisos hasta que el Admin General los configure).

No puede:

* Modificar permisos.

* Crear plantillas de permisos.

* Modificar integraciones críticas.

* Editar cuentas de Administrador General.

**2.3 Médico**

Profesional clínico.

**2.4 Asistente**

Secretaría, coordinación, ventas, soporte operativo.

**2.5 Enfermera / TENS**

Personal clínico técnico.

**2.6 Externo**

Marketing, soporte, agencias, consultores.

---

**3\. Reglas centrales del sistema**

**3.1 Solo el Administrador General puede otorgar o modificar permisos**

Regla dura del sistema.

**3.2 Creación de usuarios**

Opciones configurables:

* Solo el Administrador General crea usuarios.

* O el Administrador puede crearlos, pero quedan sin permisos hasta revisión.

**3.3 Registro de auditoría**

Cada cambio de permisos queda registrado con:

* Fecha

* Usuario que realizó el cambio

* Permiso modificado

Visible solo por Administrador General.

---

**4\. Módulos sobre los que se otorgan permisos**

* Agenda

* CRM

* Ficha Clínica

* Estadísticas

* Configuración

* Integraciones

* Automatizaciones (si aplica)

---

**5\. Permisos ticables por módulo**

**5.1 Agenda**

* Acceder a Agenda

* Ver agenda completa

* Ver solo agenda propia

* Crear / modificar citas

* Cancelar citas

* Ver estado de pago

* Marcar asistencia (realizada, no-show, etc.)

---

**5.2 CRM**

* Acceder al CRM

* Ver todos los tratos

* Ver solo tratos asignados

* Crear / editar tratos

* Cambiar etapa del embudo

* Marcar ganado / perdido

* Crear / editar tareas

* Exportar tratos / reportes

---

**5.3 Ficha Clínica**

* Acceder a Ficha Clínica

* Ver fichas clínicas

* Ver solo fichas de sus pacientes

* Ver solo datos administrativos

* Ver datos clínicos completos

* Editar ficha clínica

* Ver notas privadas del médico

* Subir documentos (exámenes, informes)

* Descargar / imprimir documentos

---

**5.4 Estadísticas**

*(Arquitectura final implementada)*

**Visibilidad**

* **No depende de estos permisos.**

* Si un tablero es compartido con un usuario → automáticamente lo ve.

* Si no tiene ningún tablero asignado → verá el módulo vacío.

**Permisos que sí se configuran aquí:**

* **Crear reportes/tableros**  
  (Incluye organizar sus propios reportes en carpetas personales)

* **Editar reportes/tableros propios**

* **Editar reportes/tableros de otros**

* **Eliminar reportes/tableros**

* **Duplicar reportes/tableros**

**Permiso eliminado:**

* **Administrar categorías / carpetas / organización de reportes/tableros**  
  (Eliminado totalmente; no existe en ningún nivel)

---

**5.5 Configuración**

* Acceder al módulo Configuración

* Gestionar servicios y precios

* Gestionar plantillas de ficha clínica

* Ver usuarios (solo datos generales)

* Crear usuarios (si el flujo lo permite)

* Gestionar integraciones (solo si el Admin General lo autoriza)

---

**5.6 Integraciones**

* Ver integraciones (WhatsApp, email, etc.)

* Configurar integraciones técnicas (solo Admin General normalmente)

---

**5.7 Automatizaciones**

* Acceder a Automatizaciones

* Crear automatizaciones

* Editar automatizaciones

* Activar / desactivar automatizaciones

* Ver historial de ejecución

---

**6\. Plantillas de permisos (perfiles base)**

*(Solo el Administrador General puede crearlas o editarlas)*

* **Administrador General** (todas las casillas)

* **Administrador** (operación, no permisos)

* **Médico**

* **Asistente**

* **Enfermera / TENS**

* **Externo**

Cada plantilla es solo un punto de partida:  
el Administrador General puede personalizar casillas por usuario.

---

**7\. Beneficios del modelo**

* Máxima seguridad.

* Permisos claros, modulares y controlados por una sola autoridad.

* Módulo de Estadísticas perfectamente ordenado:

  * Crear/editar/tableros se controla por permisos.

  * Ver tableros depende del propio tablero.

  * No existe complejidad innecesaria en permisos de carpetas.

* Escalable a múltiples sedes y grandes equipos.

* Flujo claro y fácil de entender por todos.


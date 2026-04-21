**📄 AGENDA MÉDICA — DOCUMENTO MAESTRO**

**Versión:** 1.7  
**Fecha:** 4 de diciembre de 2025  
**Plataforma:** Mi-Paciente.com  
**Tipo:** Documento Final Consolidado

---

**1\) Objetivo General**

La Agenda Médica gestiona:

* Programación de citas

* Vistas operativas (día, semana, mes)

* Confirmaciones con estados independientes

* Estados operativos, financieros y administrativos

* Recursos humanos y materiales por sede

* Roles clínicos asignables por procedimiento

* Duraciones variables por servicio

* Procedimientos múltiples y concurrentes

* Bloqueos y excepciones por profesional

* Sincronización visual con Google Calendar

* Cálculo automático de honorarios

* Cierre express de procedimientos

* Auditoría integral

* Generación de datos necesarios para el módulo de Estadísticas MP

La agenda es la fuente única y oficial de disponibilidad y honorarios.

---

**2\) Permisos (referencia externa)**

La Agenda no define permisos en este documento.  
Toda la gestión de accesos está en:

→ Configuración de Permisos — Mi-Paciente.com

---

**3\) Catálogo de Servicios — Service Builder Dinámico**

**3.1 Servicio Base**

* Nombre

* Categoría

* Activo

* Roles sugeridos

**3.2 Configuración Dinámica (Prestador \+ Sede)**

Incluye:

1. Identidad (prestador, sede, alias)

2. Precios por previsión

3. Tiempos (duración, buffers)

4. Recursos (sala, equipos)

5. Roles clínicos

6. Honorarios

7. Validaciones (si se activan)

8. Visibilidad (notas, título privado GCal)

**3.3 Comportamiento**

La agenda usa solo configuraciones activas.  
Citas históricas mantienen su versión.

---

**4\) Recursos y Sedes**

Cada sede administra:

* Prestadores

* Arsenaleras

* Ayudantes

* Anestesistas

* Encargada de pabellón

* Salas

* Insumos

* Equipamiento

* Configuraciones por prestador

---

**5\) Estados de la Cita**

Tres ejes independientes:

**5.1 Eje Operativo**

* Agendada

* Realizada

* No realizada (presente)

* No asistió

* Cancelada por clínica

* Cancelada por paciente dentro de plazo

* Cancelada por paciente fuera de plazo

**5.2 Eje Confirmación**

* No confirmada

* Confirmada

**5.3 Eje Pago**

* No pagado

* Pago parcial

* Pago total

* Cortesía

* Reembolsado ?

---

**6\) Google Calendar**

* Es solo visualizador.

* Eventos provienen exclusivamente desde la agenda.

* Cambios en Google Calendar no modifican la agenda.

* Bloqueos y horarios se gestionan solo en Mi-Paciente.com.

---

**7\) Asignación del Equipo Clínico**

Roles seleccionables al cerrar:

* Cirujano

* Ayudante

* Anestesista

* Arsenalera

* Encargada de pabellón

No se validan solapamientos ni habilitaciones.

---

**8\) Honorarios Generales**

La agenda calcula honorarios por:

* Procedimiento

* Rol

* Previsión

* Sede

* Prestador

* Unidad (caso/bloque/hora)

* % en “No realizada”

* Fee por cancelación tardía

Los honorarios quedan fijados e inmutables.

---

**9\) Flujo EXPRESS de Cierre**

1. Marcar estado Realizada

2. Abrir panel de cierre

3. Asignar roles

4. Revisar honorarios

5. Ajustes opcionales

6. Fijar honorarios

7. Registrar auditoría

---

**10\) Estados Financieros**

Registra:

* Pagos

* Abonos

* Reembolsos

* Saldos

---

**11\) Auditoría**

Registra:

* Cambios de estado

* Cambios de roles

* Honorarios generados

* Usuario

* Motivo

* Fecha y hora

* Versión de configuración usada

---

**12\) Relación con Módulo de Estadísticas**

La Agenda:

* Genera honorarios individuales

* Registra cálculos finales

* Produce auditoría

* Provee datos listos para consolidación

El módulo **Estadísticas MP** se encarga de:

* Consolidación

* Sumatorias

* Segmentación

* Exportaciones

* KPIs operativos y financieros

* Informes administrativos

La Agenda no genera planillas ni reportes.

---

**13\) Reportes y KPIs (versión reemplazada)**

**Todos los indicadores derivados del uso de la agenda (confirmación, no asistencia, cancelaciones, ocupación, tiempos reales, etc.) se calculan y visualizan exclusivamente en el módulo de Estadísticas MP.**

La Agenda no contiene reportes ni paneles analíticos.

---

**14\) API y Automatizaciones**

Incluye endpoints para:

* Servicios

* Configuraciones

* Citas

* Cambios de estado

* Cierre

* Honorarios

Webhooks:

* Cierre completado

* Honorarios generados

* Cambios críticos en citas

---

**15\) Síntesis del Modelo Final**

1. Servicio base define lo clínico

2. Configuraciones definen operación por prestador

3. Agenda aplica configuraciones en tiempo real

4. Honorarios se calculan en agenda

5. Tres ejes de estado

6. GCal es solo visualizador

7. Roles sin validaciones técnicas

8. Auditoría completa

9. Estadísticas consolida y reporta

---

**16\) Modelos de Honorarios por Prestador**

**16.1 Tipos**

a) Sueldo fijo  
b) Bloque \+ procedimiento  
c) Cirugía general \+ rol adicional

**16.2 Configuración**

* modelo\_honorarios

* monto\_bloque

* modo\_bloque

* monto\_por\_cirugia\_general

* honorarios\_por\_rol

**16.3 Honorario por Bloque**

* Se genera una vez por día/bloque

* Puede ser automático o requerir confirmación

**16.4 Cálculo por Procedimiento**

Incluye honorario general, por rol, por procedimiento y por bloque.

**16.5 Ejemplos**

* Jaime: 137.500 \+ 3×250.000

* Elizabeth: 10.000 por cirugía \+ 35.000 por arsenalera

---

**17\) Vista de Agenda**

**17.1 Modos de Vista**

* Día

* Semana

* Mes

**17.2 Filtros**

* Sede

* Profesional(es)

**17.3 Horarios por Profesional**

Horario base, pausas, bloque mínimo, excepciones.

**17.4 Fila Superior Fija**

Notas operativas por día o semana.

**17.5 Bloques**

* Disponibles

* No disponibles (con motivo)

* Excepciones puntuales

**17.6 Contenido por Cita**

Servicio, estados, paciente, duración.

---

**18\) Duraciones Variables y Procedimientos Múltiples**

**18.1 Bloque Base**

10/15/20 min configurable.

**18.2 Duración por Servicio**

Incluye buffers.

**18.3 Procedimientos Múltiples**

Admite:

* Concurrentes

* Secuenciales

Reglas:

* No exceder duración disponible

* Respetar restricciones de concurrencia

* Advertencias si hay conflicto

Visualización diferenciada.

---

**19\) Gestión de Citas**

**19.1 Acciones**

Crear, editar, mover (drag & drop), cancelar.

**19.2 Datos Requeridos**

Sede, hora, profesional, servicio, paciente.

**19.3 Paciente**

Buscar o crear en modal.

**19.4 Relación Servicio ↔ Profesional**

Solo servicios permitidos según configuración.

**19.5 Múltiples Pacientes**

Permite múltiples pacientes en un mismo horario según reglas del servicio.


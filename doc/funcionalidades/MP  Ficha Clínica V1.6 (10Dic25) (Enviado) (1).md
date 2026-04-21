**Vista de Contacto – Ficha Clínica**

**Versión 1.6 — 10 de diciembre de 2025**

---

**Descripción general**

La **Vista de Contacto – Ficha Clínica** es el módulo donde el equipo clínico accede y edita toda la información médica del paciente.

Esta vista se organiza en:

* Encabezado del paciente (definido en “Vista de Contacto Integrada”)

* Bloque amarillo de alertas

* Tres columnas clínicas:

  1. Columna izquierda: tabs clínicos

  2. Columna central: visitas / procedimientos

  3. Columna derecha: detalle clínico (deslizable)

La ficha clínica tiene **autosave**, edición fluida y está diseñada para minimizar clics.

---

**1\. Encabezado del Paciente**

El encabezado es **fijo y siempre visible**.  
Su estructura completa está definida en el documento:

**“Vista de Contacto Integrada – Encabezado del Paciente”.**

La ficha clínica opera **debajo de ese encabezado**.

---

**2\. Bloque amarillo – Alertas y comentarios**

Inmediatamente bajo el encabezado.  
Funciona como una zona de información crítica.

**2.1 Contenido**

**Alertas clínicas (automáticas \+ editables)**

* Alergias

* Diagnósticos principales

* Medicamentos críticos (si aplica)

* Cirugías recientes o relevantes

* Peso / Talla

**Alertas operativas**

* Citas no asistidas

* Comentarios operativos para el equipo clínico

**Comentario libre**

Ejemplo: “No responde llamadas.”

**Reglas**

* Al marcar un diagnóstico como principal → aparece aquí.

* Editar alergias aquí actualiza la tab Alergias.

* Siempre visible en la ficha clínica.

---

**3\. Estructura general de columnas**

**3.1 Columna Izquierda – Tabs clínicos**

7 tabs clínicos:

1. Diagnósticos

2. Medicamentos

3. Cirugías

4. Alergias

5. Plantillas

6. Documentos  
   **(Tareas ya no está, se gestiona en la Vista Integrada del Paciente)**

**3.2 Columna Central – Visitas / Procedimientos**

Línea de tiempo clínica del paciente.

**3.3 Columna Derecha – Detalle clínico (deslizable)**

Aparece al seleccionar una visita.

---

**4\. Columna Izquierda – Tabs Clínicos (detallado)**

Todas las tabs permiten edición **inline** y botones de acción rápida.

---

**4.1 Diagnósticos**

**Columnas**

Diagnóstico | Lateralidad | Estado | 🔝 | ⭐ | 🗒️ | 🗑️

**Acciones rápidas**

* 🔝 **Principal:** aparece en bloque amarillo.

* ⭐ **Favorito:** aparece primero en búsquedas del catálogo.

* 🗒️ **Nota tipo Kindle:**

  * Campo flotante editable

  * Hover muestra nota

* 🗑️ Eliminar

**Reglas**

* Diagnósticos solo desde catálogo **CIE-10**.

* Edición inline.

**Crear / editar diagnóstico**

* Lateralidad

* Estado (activo/inactivo)

* Marcar principal

* Marcar favorito

---

**4.2 Medicamentos**

**Columnas**

Medicamento | Estado | 🔝 | ⭐ | 🗒️ | 🗑️

**Reglas y funciones**

* Solo desde catálogo.

* Estado editable inline.

* Botones rápidos igual que Diagnósticos.

---

**4.3 Cirugías**

Dividida en dos secciones internas:

1. **Cirugías Urbamed**

2. **Cirugías No Urbamed**

---

**4.3.1 Cirugías Urbamed**

**Columnas**

Cirugía | Estado de cirugía | Estado de confirmación | Estado de pago | Fecha | Cirujano | 🔝 | ⭐ | 🗒️ | 🗑️

**Reglas clave**

* Los tres estados (cirugía, confirmación, pago) se sincronizan con **Agenda Médica**.

* La ficha no define los estados, solo los muestra y edita en coherencia con agenda.

**Formas de creación**

* Automática al agendar cirugía.

* Manual desde la ficha clínica (cirugías potenciales).

**Acciones rápidas**

* 🔝 Principal

* ⭐ Favorita

* 🗒️ Nota tipo Kindle

* 🗑️ Eliminar

---

**4.3.2 Cirugías No Urbamed**

**Columnas**

Cirugía | Fecha | Profesional / Lugar | 🔝 | ⭐ | 🗒️ | 🗑️

**Reglas**

* No tienen estados.

* Se consideran **realizadas**.

* Información histórica relevante.

---

**4.4 Alergias**

**Columnas**

Sustancia | Reacción | Severidad | 🔝 | ⭐ | 🗒️ | 🗑️

**Reglas**

* Todas se muestran en el bloque amarillo.

* Solo desde catálogo.

* Nota tipo Kindle disponible.

---

**4.5 Plantillas**

**Tipos de casillas**

* Texto corto

* Texto largo

* Listas

* Checkboxes

* Opción única

* Multiples opciones

* Fecha/hora

* Valores numéricos

* Casilla de cálculo

* Campos vinculados (diagnósticos, medicamentos, etc.)

**Funciones**

* Arrastrar plantilla a la columna derecha.

* Reemplazar plantilla manteniendo datos coincidentes.

* Frases rápidas (biblioteca institucional y personal).

* Versionado automático.

**Generación de documentos**

* Plantilla completada → documento PDF o texto.

* Documento queda guardado en la tab Documentos.

---

**4.6 Documentos**

**Funciones**

* Listado de documentos asociados.

* Vista previa completa dentro de la columna izquierda.

* Permite ver documento y escribir en la columna derecha simultáneamente.

* Documentos pueden ser subidos o generados.

---

**5\. Columna Central – Visitas / Procedimientos**

**Contenido visible por fila**

* Fecha

* Tipo de visita / procedimiento

* Profesional

* Estado (proveniente de Agenda)

**Comportamiento**

* Clic → abre columna derecha con detalle clínico.

---

**6\. Columna Derecha – Detalle clínico (deslizable)**

**Funciones**

* Presenta plantilla por defecto para ese tipo de visita.

* Permite cambiar plantilla manteniendo datos coincidentes.

* Campos típicos: motivo, historia, examen físico, plan, indicaciones, exámenes, medicamentos.

* Autosave.

* Permite generar documento clínico.

**Comportamiento**

* Se desliza sobre la columna central.

* Se puede cerrar para volver a las visitas.


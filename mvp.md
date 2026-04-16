# DOCUMENTO FINAL MVP MI-PACIENTE.COM

**CONFIDENCIAL, SUJETO A NDA**  
*13 de Enero de 2026*

## Documento Marco — MVP Mi-Paciente

**Audiencia:** Desarrollo tecnológico

### 1. Qué es el MVP

- Sistema integrado que contiene **CRM, Agenda y Ficha Clínica**, con IA operativa como capa transversal.
- Conecta captación → gestión → agenda → procedimiento en un flujo continuo.
- Incluye estadísticas diseñadas para demostrar el impacto real de la IA, separándolo explícitamente de la gestión humana.
- No es software administrativo; es una herramienta de ejecución diaria orientada a probar una hipótesis.
- Existe conocimiento y seguimiento de todos los contactos, incluso aquellos que no llegan inicialmente a atención humana.
- El sistema recupera contactos para gestión humana que, sin IA, quedarían fuera del proceso.

### 2. Objetivo del MVP

- Aumentar el volumen de procedimientos sin aumentar inversión en marketing.
- Lograrlo mediante:
  - Captura y visibilidad del 100% de los contactos.
  - Seguimiento persistente (IA).
  - Recuperación activa de contactos hacia atención humana.
  - Mayor conversión a agendamiento y cirugías.

### 3. Para qué está hecho

- Clínicas ambulatorias con múltiples canales de entrada y procedimientos repetibles.
- Contextos donde el límite no es la demanda, sino la capacidad de gestión y seguimiento.

### 4. Hipótesis central

Un MVP integrado con CRM, Agenda, Ficha Clínica e IA operativa aumenta el número de procedimientos realizados al asegurar conocimiento, seguimiento y recuperación de todos los contactos que ingresan por distintos canales.

### 5. Métricas — Demostración de impacto real de la IA

El MVP incorpora métricas que no existen en la mayoría de las clínicas y que constituyen su núcleo de valor.

**Baseline actual**

- Solo se mide lo que llega a atención humana.
- El resto de los contactos queda fuera del análisis.

**Con el MVP se conoce**

- Total de contactos que ingresan.
- Contactos en gestión humana.
- Contactos en gestión por IA (sin intervención humana actual).

**Métricas clave**

- **Volumen recuperado por IA:** gestión humana que no existiría sin IA.
- **Agendamientos generados por IA:** citas originadas desde contactos recuperados.
- **Procedimientos atribuibles a IA:** casos que no habrían ocurrido sin IA.

**Clasificación obligatoria**

- Procedimiento humano puro.
- Procedimiento humano + IA.
*Esto permite atribución real basada en datos.*

### 6. Qué significa para el desarrollo

Todo debe ser:

- Medible.
- Trazable.
- Atribuible.

### 7. Criterio de éxito

El MVP es exitoso si:

- Se demuestra aumento de procedimientos con la misma base de contactos.
- Se puede identificar qué parte del resultado es atribuible a la IA.
- Existe visibilidad completa y seguimiento de todos los contactos.

---

## A. Módulo CRM — MVP Versión 2.1

### Definición semántica base

- **Contacto:** Persona que interactúa sin intervención humana (formularios, bots, mensajes automáticos). Pertenece a capas de captación/IA. No forma parte del CRM operativo.
- **Prospecto:** Persona que está o ha estado en conversación con una especialista humana. Es el objeto gestionado por el CRM para seguimiento, conversión y agendamiento.

### 1. Objetivo del módulo CRM

- Gestionar prospectos con conversación humana activa o histórica.
- Asegurar orden, velocidad operativa y cero pérdida de información.
- Cubrir desde el primer contacto humano hasta el cierre (ganado/perdido).
- Foco: ejecución diaria de las asistentes.

### 2. Objeto central: Prospecto

- **Definición:** Persona que contacta por cualquier canal y entra en conversación con una especialista humana.
- **Alcance:** El CRM contiene solo prospectos con gestión humana. Interacciones 100% automáticas quedan fuera del CRM.

### 3. Creación de prospectos (entrada)

- **Origen:** Formularios web (al asignarse a especialista), WhatsApp (al derivarse a especialista), Creación manual por asistente.
- **Campos mínimos:**
  - Nombre y apellido
  - Teléfono (único)
  - Canal de origen (WhatsApp / Formulario / Manual)
  - Fecha y hora de ingreso (automática)
  - Servicio(s) de interés (lista cerrada, permite múltiples)
- **Regla:** Un contacto ingresa al CRM solo cuando existe asignación a especialista humana o creación manual.

### 4. Pipeline de estados (embudo)

- **Definición:** Embudo por servicio. Un mismo prospecto puede tener múltiples servicios. Cada servicio recorre su propio pipeline, sin duplicar contacto ni conversación.
- **Estados (por servicio):**
    1. Nuevo
    2. Tratando de contactar
    3. En seguimiento
    4. Interesado
    5. Agendado

### 5. Asignación de prospectos

- Funcionalidad: Asignación manual a una asistente.
- Regla: Todo prospecto del CRM debe tener un responsable humano asignado.

### 6. Vistas obligatorias del CRM

1. **Vista de Embudo (Pipeline):** Visualización por estados y por servicio. Volumen por estado. Soporte a priorización del trabajo diario.
2. **Vista de Contacto (Ficha del prospecto):** Vista principal de trabajo operativo. Diseño en 3 columnas fijas. Acciones de cierre explícitas.
3. **Vista de Actividades:** Lista de acciones pendientes por prospecto y servicio. Vista “Mis actividades”.

### 7. Vista de Contacto — Diseño en 3 columnas

#### 7.1 Columna izquierda — Datos del contacto

- Nombre y apellido
- Teléfono
- Canal de origen
- Servicio(s) asociados
- Estado por servicio
- Responsable
- Fecha de ingreso
- **Acciones visibles:** Botón **Ganar** / Botón **Perder**

#### 7.2 Columna central — Ventana conversacional

- Conversación tipo chat (única por prospecto).
- **Incluye:** Mensajes entrantes/salientes, Orden cronológico, Timestamp, Identificación del usuario.
- **Acciones:** Agregar mensaje manual (registro), Copiar texto, Registrar “mensaje enviado”.

#### 7.3 Columna derecha — Panel de gestión interna (intercambiable)

- **Bitácora del contacto:** Cambios de estado, responsable, agendamientos, decisiones relevantes, eventos Ganar/Perder.
- **Actividades y tareas:** Tipo (Llamar, Responder WhatsApp, etc.), Servicio asociado, Fecha objetivo, Responsable, Estado (pendiente/completada).
- **Archivos adjuntos (versión mínima):** Adjuntar archivos simples, Nombre, Fecha de carga.

### 8. Acciones de cierre: Ganar / Perder

- **Botón Ganar:** Marca servicio como ganado. Requiere servicio asociado. Efecto: Cierre del servicio, registro en bitácora, sale del trabajo activo.
- **Botón Perder:** Marca servicio como perdido. Requiere selección de motivo (No responde, Precio, Se atendió en otro lugar, No cumple criterios, Otro). Efecto: Cierre del servicio y registro del motivo.

### 9. Relación conversación – actividades – estados

Cada prospecto debe permitir identificar claramente:

- Estado por servicio
- Responsable
- Próxima acción por servicio
- Resultado final (Ganado / Perdido)

### 10. Fuera de alcance del MVP

Automatizaciones, IA de respuesta, Bots, Envío directo de mensajes, Correos integrados, Reportes avanzados, Integración automática con agenda, Información clínica.

### 11. Checklist de validación MVP

- [ ] CRM gestiona solo prospectos con intervención humana
- [ ] Pipeline operativo por servicio
- [ ] Vista de embudo filtrable por servicio
- [ ] Vista de contacto en 3 columnas
- [ ] Botones Ganar / Perder visibles
- [ ] Motivos de pérdida normalizados
- [ ] Bitácora registra cierres por servicio
- [ ] Actividades asociadas a servicio

---

## B. Módulo Agenda — MVP Versión 1.5

### 1. Estructura base

- Agenda por profesional, con vista día y semana. Operación multi-médico.
- Bloques de agenda por rango horario (ej. 08:30–13:30).
- Bloques mixtos: un mismo bloque puede incluir múltiples servicios con duraciones distintas.

### 2. Servicios

- Catálogo único de servicios a nivel clínica (consulta, VSB, ZSR, control, etc.).
- Cada servicio tiene duración estándar.
- Servicios habilitados por profesional.
- **Precio:** No está definido en el servicio. Se registra manualmente por cita (MVP).

### 3. Agendamiento

- Agendamiento por hora específica elegida por la especialista.
- **Validaciones automáticas:** Minutos consecutivos disponibles, no solapamiento, no exceder rango horario del bloque.

### 4. Visualización (criterio clave)

- Vista principal por **listado de procedimientos**, no por grilla horaria fija (soporta duraciones no estándar).
- **Vista por profesional / día:** Muestra bloques del día y dentro de cada bloque, lista ordenada de citas con hora real.
- **Cada cita muestra:**
  - Hora de inicio
  - Servicio y duración
  - Paciente
  - Previsión
  - Estado de confirmación
  - Estado de cita
  - Estado de pago
  - Precio acordado (CLP)
  - Monto pagado (CLP)
  - Fecha último pago (opcional)
  - Notas internas

### 5. Ejemplo visual (conceptual)

**Bloque: Miércoles AM (08:30–13:30)**

- 08:30 — Consulta (30’)
- 09:00 — VSB (40’)
- 09:40 — Consulta (30’)
- 10:10 — Control (20’)
- 10:30 — VSB (40’)

### 6. Estados de la cita

- **Eje Operativo:** Agendada, Realizada, No asistió, Cancelada.
- **Eje Confirmación:** Confirmada / No confirmada.
- **Eje de Pago:** No pagado, Pago parcial, Pago total, Cortesía.

---

## C. Ficha Clínica — MVP Versión 3.0

### Descripción general

Módulo de registro y edición de información médica. Diseñada para uso clínico diario, edición rápida, minimizar clics y mantener trazabilidad.

### Estructura general

1. **Encabezado del paciente** (común para toda la plataforma).
2. **Tres columnas clínicas:**
    - Izquierda: Alertas clínicas + Tabs clínicos.
    - Central: Visitas / Procedimientos.
    - Derecha: Detalle clínico (panel deslizable).
*Incluye autosave y edición fluida.*

### 1. Encabezado del Paciente

Fijo y siempre visible. Acceso a identificación, datos generales y botón/listado global de documentos (recetas, exámenes, protocolos, PDFs).

### 2. Columna izquierda — Alertas clínicas y tabs

#### 2.1 Bloque de alertas clínicas

Zona prioritaria visible siempre.

- **Contenido:** Alergias registradas, Diagnósticos marcados como principales (con lateralidad), Medicamentos destacados, Cirugías In-Site/Outside marcadas como principales.
- **Comentario libre:** Campo editable para observaciones relevantes.

#### 2.2 Tabs clínicos

Bajo el bloque de alertas. Permiten edición inline.

1. **Diagnósticos** (Selección desde catálogo CIE-10)
2. **Medicamentos** (Estado: activo/suspendido, Destacado)
3. **Cirugías** (In-Site: con fecha/profesional; Outside: registro histórico)
4. **Alergias** (Registro por sustancia)
5. **Plantillas** (Nota clínica, Protocolo operatorio - Drag & drop hacia detalle clínico)

### 3. Columna central — Visitas / Procedimientos

Vista cronológica descendente de atenciones.

- **Contenido por fila:** Fecha/Hora, Tipo (Visita/Procedimiento), Profesional, Estado (Editable/Cerrado 24h), Íconos de documentos generados.
- **Comportamiento:** Click en fila abre Detalle clínico. Click en documento abre vista previa PDF.

### 4. Columna derecha — Detalle clínico

Panel deslizable para documentación.

- **Documentación:** Un único cuadro de texto libre con autosave.
- **Generación de PDFs:** PDF clínico, Receta médica, Orden de exámenes, Protocolo operatorio.
- **Regla de edición:** Editable hasta 24 horas post-creación. Luego cerrado (solo anotaciones posteriores fechadas).

---

## D. MVP — Asistente IA Versión 2.6

### Definiciones base

- **Contacto:** Interactúa sin intervención humana directa. No está en CRM.
- **Prospecto:** En conversación con un humano. Está en CRM.

### 1. Objetivo del asistente de IA

Asegurar que ningún prospecto valioso se pierda por latencia u olvido, maximizando el contacto humano efectivo sin aumentar la carga humana.

### 2. Funciones del asistente de IA (MVP)

- Captura omnicanal automática.
- Gestión autónoma de contactos.
- Seguimiento post interacción humana (retoma prospectos perdidos).
- Reactivación inteligente basada en reglas.
- Derivación a contacto humano solo ante señales reales.
- Exclusión consciente del sistema (opt-out).

### 3. Captura total de contactos

Registro automático del 100% de contactos entrantes.

### 4. Creación automática de prospecto en el CRM

- Cumpliendo criterios operativos.
- Fuera de horario hábil: IA gestiona como contacto y crea prospecto al inicio del horario hábil.

### 5. Atención inmediata y continua

- Respuesta automática inmediata a contactos.
- Prospectos quedan bajo gestión humana exclusiva.
- IA retoma interacción si prospecto es calificado como **perdido**.

### 6. Clasificación operativa del contacto

Criterios para decidir creación de prospecto, prioridad e intervención humana: Tipo de interés, Nivel de intención, Estado de interacción.

### 7. Reactivación automática

- **Aplica a:** Contactos calificados como perdidos tras inactividad.
- **Reglas por motivo de pérdida:**
  - *Sí Reactivar:* No responde, Precio, Evaluado en otro lugar.
  - *No Reactivar:* Procedimiento realizado en otro lugar, No cumple criterios.

### 8. Métricas del Asistente IA (Dashboard)

- **Capa Existencia:** Prospectos totales, por canal (WhatsApp, RRSS, Formularios, Manual).
- **Capa Clasificación:** Contacto humano inicial, En gestión por IA, Reactivados por IA, Rescatados por IA, Gestionados solo por IA, Eliminados.
- **Capa Outcomes:** Agenda tomada, Operado (Corto/Mediano/Largo plazo), Descarte explícito.
- **Capa Valor Agregado:** Prospectos con contacto humano inicial vs. Rescatados/Reactivados por IA.

### Checklist MVP — Asistente IA

- [ ] Captura omnicanal activa.
- [ ] Distinción clara Contacto vs Prospecto.
- [ ] Creación automática de prospectos bajo criterios.
- [ ] Seguimiento IA post interacción humana.
- [ ] Reactivación basada en razones de pérdida.
- [ ] Métricas visibles y atribuibles directamente a IA.

---

## E. MVP — Vista de Contacto Integrada (Versión 3.4)

### 1. Objetivo de la Vista

Centralizar toda la información relevante de un contacto (prospecto o paciente) para ejecución continua entre CRM, Agenda y Ficha Clínica sin pérdida de foco.

### 2. Estructura General

1. **Encabezado fijo del contacto.**
2. **Tabs superiores de navegación.**

### 3. Encabezado Fijo del Contacto

- **Datos mostrados:** Nombre (editable), ID/RUT, Teléfono, Email, Previsión, Estado (Prospecto/Paciente), Fuente.
- **Acciones rápidas:** Llamar, WhatsApp, Agendar cita, Crear actividad, **Documentos (ícono)** .
- **Edición contextual:** Permite corregir Nombre, Teléfono, Email, Previsión sin cambiar de tab.

### 4. Documentos — Acceso y Manejo (MVP)

- **Punto único:** Botón en encabezado fijo. Abre panel lateral.
- **Visualización:** Lista agrupada por Tipo (Exámenes, Recetas, Comprobantes, Consentimientos, Otros) ordenada por fecha descendente.
- **Subida de documentos:** Seleccionar archivo -> Elegir Tipo -> Nota opcional -> Confirmar.
- **Origen del documento:** Sistema, Paciente, Equipo.

### 5. Tabs Superiores — MVP

Orden fijo:

1. **Datos del Contacto:** Edición completa demográfica.
2. **CRM:** Gestión comercial, vista lectura WhatsApp (con botón "Guardar en Documentos" para adjuntos).
3. **Agenda:** Gestión de citas y estados operativos.
4. **Ficha Clínica:** Continuidad clínica y documentos por episodio.

### 6. Navegación Global vs Contextual

- **Barra Superior Global:** Agenda (Hoy), CRM (Pipeline), **Buscador Global** (Mecanismo primario de acceso a Pacientes/Prospectos. Los Contactos NO son buscables).
- **Modo Contacto:** Al entrar a una persona operable, siempre abre la **Vista de Contacto Integrada**.

### 7. Regla para Desarrollo y QA

Desde cualquier punto de entrada (buscador, agenda, pipeline): **Siempre se abre la Vista de Contacto Integrada.** Aplica solo a Pacientes y Prospectos.

---

## F. Estadísticas — MVP Version 1.2

### 1. Principio estructural

Flujo real: **Contacto → Prospecto → Trato → Agenda → Procedimiento → Ingreso**

### 2. Definiciones semánticas base

- **Contacto:** Interacción sin humano.
- **Prospecto:** Intervención humana (CRM).
- **Trato:** Unidad de gestión por servicio.
- **Procedimiento realizado:** Hecho clínico en Agenda. (Gatilla automático Trato Ganado en CRM).

### 3. Capas del Dashboard

| Capa | Objetivo | Métricas Clave |
| :-- | :-- | :-- |
| **1. Existencia (IA)** | Captura total | Contactos totales, por canal (WA, RRSS, Form, Manual) |
| **2. Clasificación (IA)** | Gestión del sistema | Humano inicial, En gestión IA, Reactivados, Rescatados, Eliminados |
| **3. Outcomes** | Resultados observables | Agenda tomada, Atendido/Operado (<=30d, 31-60d, >60d) |
| **4. Gestión Comercial (CRM)** | Desempeño real | Prospectos creados, Tratos ingresados/agendados/ganados/perdidos, % Conversión |
| **5. Ejecución Clínica** | Cumplimiento operativo | Realizadas, Cancelaciones, No-show, **Re-agendamientos** (conteo) |
| **6. Ingresos** | Cierre económico | Ingreso realizado, Ingreso futuro agendado, **Ingreso agendado sin pago** |
| **7. Valor IA** | Atribución de impacto | Procedimientos e Ingresos atribuibles a IA |

### 4. Visual central recomendado (MVP)

Embudo / Tabla de flujo:

1. Contactos totales
2. Prospectos
3. Tratos ingresados
4. Tratos agendados
5. Procedimientos realizados
6. Ingreso realizado
*(Con % de conversión entre etapas)*

---

## G. Usuarios, permisos y manejo de precios — MVP versión 1.2

### Principios estructurales (congelados)

- **Separación estricta:** CRM (sin dinero), Agenda (hecho clínico + precios), Ficha Clínica (acto médico).
- **Precio del servicio:** Base e inmutable. Excepciones solo vía **Descuento por cita**.

### Modelo de precios (regla dura)

- **Precio del servicio:** Definido por Admin. Único y consistente. No se edita por cita.
- **Descuento por cita:** Campo explícito. Precio final = Precio base - Descuento.

### Roles y permisos

| Rol | CRM | Agenda | Ficha Clínica | Precios/Descuentos | Estadísticas |
| :-- | :-- | :-- | :-- | :-- | :-- |
| **Administrador** | Completo | Completa | Completa | Crear/Editar Precios Base | Dashboard completo (Financiero) |
| **Gerente / Coord.** | Ver todos | Ver completa | Lectura | Ver precios, Aplicar descuentos | Desempeño operativo equipo (sin $) |
| **Asistente** | Gestionar propios | Crear/Modificar citas | Solo lectura | Ver precios, Aplicar descuentos | Casos ganados/agendados propios |
| **Médico** | Sin acceso | Solo agenda propia | Crear/Editar fichas propias | Sin acceso | Solo cirugías propias realizadas |
| **Usuario IA / Sistema** | Crear Prospectos | Sin agendar definitivo | Sin acceso | Sin acceso | N/A (Solo trazabilidad técnica) |

---

## H. Diseño pantalla de entrada Versión 1.2

### 1. Objetivo

Llevar al usuario directo a ejecución según su rol. No es un "home", es un control de accesos primario.

### 2. Modelo de navegación principal

Íconos de alto nivel:

- **Agenda** (Hecho clínico diario)
- **CRM** (Gestión prospectos)
- **Estadísticas** (Contenido filtrado por rol)

### 3. Comportamiento por rol

| Rol | Pantalla de entrada | Íconos visibles | Acceso inicial |
| :-- | :-- | :-- | :-- |
| **Médico** | No ve pantalla. Redirect automático. | Agenda, Estadísticas | Agenda del día (Médico propio) |
| **Asistente** | Ve pantalla simple. | Agenda, CRM, Estadísticas | Click en módulo correspondiente |
| **Administrador** | Ve pantalla completa. | Agenda, CRM, Estadísticas | Alterna entre operación y dashboard completo |

### 4. Matriz final de visibilidad (Íconos)

| Rol | Agenda | CRM | Estadísticas |
| :-- | :--: | :--: | :--: |
| Médico | ✅ (Limitado) | ❌ | ✅ (Limitado) |
| Asistente | ✅ | ✅ | ✅ (Limitado) |
| Admin | ✅ | ✅ | ✅ (Completo) |

---

## J. Principios clave de la Ley 21.719 (Protección de Datos)

### 1. Estrategia general recomendada

Cumplir por capas: **Legal mínimo ahora, arquitectura correcta desde el día 1.**

### 2. Qué hacer en el MVP (Cumplimiento mínimo defensivo)

1. **Delimitación de roles:** Clínica = Responsable del tratamiento. Mi-Paciente = Encargado del tratamiento (Cláusula contractual).
2. **Consentimiento informado funcional:** Checkbox + Timestamp + IP + Versión del texto. Trazabilidad del evento.
3. **Minimización de datos:** No recolectar datos sin uso operativo inmediato (Ej: Si no se usa RUT, no pedirlo).
4. **Seguridad básica explícita:** Accesos con usuario/rol, Logs de acceso a ficha clínica, Backups automáticos.
5. **Política de privacidad breve y honesta.**

### 3. Arquitectura que DEBE existir desde el MVP

- Separación lógica de datos (Clínicos ≠ Comerciales).
- Control de acceso granular (Médico ≠ Asistente ≠ Admin).
- Auditoría (Toda acción relevante loggeable en backend).

### 4. Resumen ejecutivo (Para decisión rápida)

- **MVP:** Consentimiento trazable, Roles claros, Minimización, Seguridad básica, Arquitectura preparada.
- **Producto Final:** Derechos ARCO automatizados, DPO, Gestión de incidentes, Contratos robustos.

# Reglas Críticas de Negocio

La integridad técnica del proyecto Mi-Paciente recae en una serie estricta de directrices establecidas tanto en lógica de base de datos como en Server Actions. Violentar estas reglas impacta gravemente en el funcionamiento multi-tenant y la seguridad transaccional del CRM clínico.

## Limitaciones Críticas (Back-end y DB)

| Regla de Negocio | Implementación Mecánica |
|------------------|-------------------------|
| **Aislamiento Multi-Tenant (RLS)** | Todas las políticas en Supabase usan `empresa_id = get_my_empresa_id()`. Esta función está aislada por seguridad de subconsultas pesadas. Adicionalmente, cuenta con el "NULL guard" (`AND empresa_id IS NOT NULL`) en cada política. |
| **Integridad de Bloques del Médico** | Imposible que un médico posea dos citas a la misma hora en el sistema. Controlado desde BD utilizando *Constraints* nativas: `EXCLUDE USING gist (medico_id WITH =, rango_tiempo WITH &&)` |
| **Inmutabilidad Clínica tras 24h** | La tabla `mpaci_fichas_clinicas` expira edición pasadas las 24 horas (`EXTRACT(EPOCH FROM (now() - creado_en)) <= 86400`). Posterior a eso, toda actualización va por *insert-only* de `mpaci_anotaciones_clinicas`. |
| **Logs CRM Inmutables** | Las bitácoras comerciales de un CRM (`mpaci_bitacora` y `mpaci_anotaciones_clinicas`) poseen triggers nativos `FOR UPDATE USING (false)` y `FOR DELETE USING (false)` para cancelar toda modificación y borrado. |
| **Slug Restricciones** | URL empresarial única, garantizada con `CHECK constraint` base (`slug = lower(slug)` y Regex contra caracteres especiales). Evita exploits web o colisiones de rutas. |
| **Protección Server Actions** | Todas las mutaciones suceden bajo *Server Actions*, en bloques `try/catch` rigurosos, emitiendo respuestas parseadas y filtradas bajo un esquema de validación constante apoyándose en la librería **Zod**. |
| **Visibilidad Delegada (Asistentes)** | Un usuario con rol `asistente` solo puede ver/gestionar la agenda de los médicos definidos en `mpaci_asignaciones_medico`. El permiso `agenda.ver_completa` (usualmente solo para Admins) es el único que bypassa esta restricción. |

## Reglas Críticas de Agentes de Inteligencia Artificial

La Inteligencia Artificial (IA) en Mi-Paciente no tiene dominio absoluto, sino que está constreñida como un ayudante humanoide:

1. **AI Tools y Prompts Seguro:**
   Cada Tool de la IA cuenta con un **Schema Zod Fuerte**. Impide la inyección por alucinaciones (`SQL Injection` de parámetros por IA) a la Server Action de Supabase.
2. **Propuesta con Control Humano:**
   Las herramientas IA respetan el flujo: "La IA propone, el Asistente Aprueba". Por ejemplo, Vercel AI SDK emitirá un *ToolCall*, este invoca un UI element the confirmación (*Confirmation component*) dentro del Chat, en el que el asistente clickea "Procesar/Agenda" para efectivamente inyectar la cita real.
3. **Trazabilidad Mandatoria (Langfuse):**
   Toda respuesta u orquestación de Agente dentro de `streamText`, `generateText`, etc debe ser rastreada por concepto de telemetría de negocio y monitoreo de costos. Obligatorio utilizar el wrapper interno `observeNext( async() => {} )` provisto en el proyecto y setear los sessionId.

## PDFs Corporativos

Por decisión de arquitectura: no dependemos de un renderizador Javascript como *react-pdf* o *Puppeteer*. La emisión corre mandando un objeto de variables parseado (JSON Payload) mediante conexión externa a través de la REST API (Stirling PDF); recogiendo el ArrayBuffer (documento resultante) y cargando el final sobre *Supabase Storage*, todo desde backend.

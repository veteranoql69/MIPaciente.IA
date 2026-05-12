---
title: "Control Centralizado de IA con Langfuse"
description: "Arquitectura y paso a paso para desacoplar el control de la IA, gestión de prompts y observabilidad usando Langfuse sin tocar código."
---

# Control Centralizado de IA con Langfuse

Este documento detalla la arquitectura y el paso a paso para gestionar **todas las integraciones de IA** (WhatsApp, Chat interno, OCR, etc.) en **Mi-Paciente.com** utilizando **Langfuse** como plano de control principal (Control Plane). 

El objetivo es **desacoplar** la lógica y la configuración de la IA del código fuente de Next.js, permitiendo que la "sintonía fina" (fine-tuning), el manejo de prompts, y la selección de modelos se realicen enteramente desde la plataforma de Langfuse.

---

## 1. Ventajas de la Arquitectura Desacoplada

1. **Gestión de Prompts sin Despliegues (Zero-Deploy Updates):** Puedes cambiar las instrucciones del asistente de WhatsApp o del OCR al vuelo desde Langfuse. Los cambios se reflejan inmediatamente en la aplicación sin necesidad de subir código nuevo a Vercel/servidor.
2. **Control Multimodelo y Multi-Proveedor por Tenant (`empresa_id`):** Permite configurar que la Clínica A use `gpt-4o` (OpenAI) y la Clínica B use `gemini-1.5-pro` (Google) basado en costos o preferencias.
3. **Observabilidad Completa:** Cada conversación (WhatsApp, Chat interno) y cada inferencia (OCR) genera una "Traza" (Trace). Puedes ver exactamente qué entró, qué salió, la latencia y el costo por token.
4. **Intervención Humana (Human-in-the-loop):** A través de Langfuse, el equipo puede revisar conversaciones, evaluarlas (Scoring) e identificar en qué punto el asistente requiere que un humano tome el control.
5. **Aislamiento del Código:** El código en `src/modules/ai-agent` se vuelve genérico. Solo se encarga de recibir llamadas, pedirle el prompt y la configuración a Langfuse, ejecutar la IA con Vercel AI SDK, y reportar el resultado a Langfuse.

---

## 2. Puntos de Configuración en el Código

Actualmente, el módulo `src/modules/ai-agent` está vacío (reservado para Sprints 8-10). Cuando se implemente, la regla de oro es: **Ningún prompt debe estar hardcodeado en el código fuente.**

### A. Archivo de Entorno (`.env.local`)
Debemos asegurar las credenciales de Langfuse.
```env
LANGFUSE_PUBLIC_KEY="pk-lf-..."
LANGFUSE_SECRET_KEY="sk-lf-..."
LANGFUSE_HOST="https://cloud.langfuse.com" # o tu instancia self-hosted
```

### B. El Wrapper `observeNext`
Como exige el documento de reglas de negocio (`03_business_rules.md`), toda ejecución de IA estará envuelta.
El código genérico que utilizaremos para cualquier caso (Chat, OCR) se verá así:

```typescript
import { Langfuse } from "langfuse";
import { generateText } from "ai";

const langfuse = new Langfuse();

export async function executeAIAgent({ sessionId, userId, empresaId, actionType, input }) {
  // 1. Iniciar traza en Langfuse
  const trace = langfuse.trace({
    name: actionType, // Ej: "whatsapp_chat", "ocr_exam"
    sessionId: sessionId,
    userId: userId,
    tags: [`empresa_${empresaId}`]
  });

  // 2. Obtener el prompt y la configuración del modelo DESDE Langfuse
  const langfusePrompt = await langfuse.getPrompt(actionType, { 
    label: "production",
    cacheTtlSeconds: 60 
  });
  
  // 3. Ejecutar modelo (Vercel AI SDK)
  const result = await generateText({
    model: customModelProvider(langfusePrompt.config.modelName), 
    system: langfusePrompt.compile({ empresaId }), // Inyecta variables al prompt
    prompt: input,
  });

  // 4. Registrar resultado en Langfuse y cerrar
  trace.generation({
    name: "ai_generation",
    input: input,
    output: result.text,
    model: langfusePrompt.config.modelName,
  });

  await langfuse.flushAsync();
  return result.text;
}
```

---

## 3. Control de Funcionalidades Específicas desde Langfuse

### 3.1. Chat de WhatsApp y Chat Interno
- **En Langfuse (Gestión de Prompts):** Creas un prompt llamado `whatsapp_assistant`.
  - *Mensaje del sistema:* "Eres el asistente de la clínica {{empresa_nombre}}. El objetivo es derivar al paciente a agendar una cita..."
  - *Config JSON:* `{"modelName": "gemini-1.5-pro", "temperature": 0.3}`
- **Observabilidad:** En la pestaña "Sessions" de Langfuse verás la conversación completa del número de WhatsApp `+569XXXXXXX` agrupadita como un hilo de chat continuo.
- **Intervención Humana:** Puedes crear una alerta en Langfuse (o usar métricas de puntuación automática) cuando el sentimiento del usuario sea negativo o pida "hablar con un humano". Esto puede gatillar un webhook que detenga el bot y notifique a la secretaria en el CRM.

### 3.2. OCR de IA para Exámenes (Imágenes/PDFs)
- **En Langfuse:** Creas un prompt llamado `ocr_clinical_extraction`.
  - *Mensaje del sistema:* "Extrae del siguiente documento los niveles de PSA, glucosa y colesterol. Retorna en formato JSON estricto."
  - *Config JSON:* `{"modelName": "gpt-4o", "temperature": 0.0}` (Baja temperatura para alta precisión en OCR).
- **Control:** Si notas que el OCR está fallando en un tipo de examen, entras a Langfuse, actualizas el prompt indicándole cómo leer ese formato específico, le das "Promote to Production", y el próximo OCR ya usará las nuevas reglas sin tocar código.

---

## 4. Control Multi-Modelo y Multi-Proveedor (`empresa_id`)

Si quieres que las clínicas premium usen el mejor modelo de OpenAI y las clínicas básicas usen un modelo más económico, la mejor práctica es:

1. **Variables de Configuración en el Prompt de Langfuse:** 
   El objeto JSON de configuración que se adjunta a cada prompt en Langfuse puede determinar el modelo (ej. `gpt-4o` vs `gemini-1.5-flash`). 
2. **Tablas Base de Datos (Alternativa Híbrida):** 
   En `mpaci_empresas` puedes añadir un campo `ai_tier` (Básico, Pro). El código Next.js lee el `ai_tier` y luego le pide a Langfuse el prompt etiquetado como `production_basic` o `production_pro`.
3. **Control Total en Langfuse:** 
   Puedes crear diferentes prompts en Langfuse (`whatsapp_clinica_A`, `whatsapp_clinica_B`) y desde la base de datos solo guardas el "nombre del prompt de Langfuse" que esa empresa utiliza.

---

## 5. Paso a Paso: Flujo de Trabajo (Sintonía Fina)

Cuando el sistema esté en producción (Sprints 8-10), tu flujo de trabajo como administrador de la IA será:

1. **Identificar un Problema:** El médico de la Clínica X se queja de que el bot de WhatsApp está dando precios equivocados.
2. **Rastrear en Langfuse:** 
   - Entras a Langfuse -> Traces.
   - Filtras por la etiqueta `empresa_X` y buscas la sesión.
   - Ves exactamente qué contexto le pasó el backend al bot (qué servicios estaban disponibles) y qué respondió el modelo.
3. **Ajustar el Prompt:** 
   - Te das cuenta de que la IA se confunde cuando hay múltiples precios por previsiones.
   - Vas a Langfuse -> Prompts -> Seleccionas `whatsapp_assistant`.
   - Modificas las instrucciones: *"Regla estricta: Siempre pregunta la previsión antes de dar el precio."*
4. **Probar (Playground):** 
   - En el mismo Langfuse usas la función "Playground" o "Test" con los mismos datos que fallaron.
   - Verificas que la IA ahora responde correctamente.
5. **Desplegar (Deploy):** 
   - Guardas la nueva versión del prompt en Langfuse.
   - Le asignas la etiqueta `production`.
6. **Resolución:** Inmediatamente, la siguiente persona que escriba por WhatsApp a la Clínica X será atendida con el nuevo comportamiento. Cero líneas de código alteradas.

---

## 6. Integración y Validaciones Extra en Base de Datos (Supabase)

Para complementar la flexibilidad de Langfuse y mantener la integridad comercial y operativa del sistema Multi-Tenant, la base de datos (PostgreSQL/Supabase) debe controlar **quién puede usar la IA y cuándo**, dejando que Langfuse controle **qué dice y cómo piensa**.

### 6.1. Tabla de Configuración IA por Empresa (`mpaci_empresas_config_ai`)
En lugar de codificar los nombres de los prompts o los modelos en el backend, la base de datos actúa como el orquestador principal. Puede ser una tabla nueva o un campo JSONB en `mpaci_empresas`:

* **`ai_activa` (boolean):** Switch maestro. Permite apagar instantáneamente la IA de una clínica en caso de falta de pago o anomalías, bloqueando la conexión a Langfuse.
* **`ai_tier_modelo` (text):** Define la categoría del modelo (ej. `"basico"` para Gemini 1.5 Flash, `"pro"` para GPT-4o) basándose en el plan de suscripción.
* **`ai_prompt_whatsapp` (text):** Guarda el **nombre exacto del prompt** en Langfuse (ej: `wa_prompt_pediatria_v2`). El código consulta este campo y le pide a Langfuse dinámicamente ese prompt.
* **`limite_tokens_mensual` (int):** Límite estricto de seguridad para evitar sobrecostos por abusos.

### 6.2. Control de Estado de Conversación (Human-in-the-loop)
Para gestionar de forma segura el paso de control entre el Bot y las Secretarias en el módulo CRM, la tabla de contactos (`mpaci_contactos` o su equivalente de chat) debe incluir:

* **`estado_atencion` (Enum):**
  * `'BOT_ACTIVO'`: La IA responde automáticamente (La UI del CRM desactiva el input de texto para el staff humano y muestra "Bot respondiendo...").
  * `'REQUIERE_HUMANO'`: Estado gatillado por la IA cuando detecta que no puede resolver un problema o el paciente pide hablar con una persona. Pausa el webhook de IA y levanta una alerta en el CRM.
  * `'HUMANO_ACTIVO'`: El personal clínico toma el control absoluto; los mensajes de WhatsApp van directo a la UI y evitan el Vercel AI SDK.
* **`langfuse_session_id` (text):** Guarda el ID de la sesión actual. Permite colocar un enlace de "Debug" en la vista del CRM para que el administrador pueda saltar directamente al Trace de Langfuse asociado a ese chat.

### 6.3. Restricción de "Tools" por Plan de Suscripción
Respetando el esquema Zod y la seguridad de las Server Actions, las herramientas (Tools) de la IA deben validar contra la base de datos antes de ejecutarse:

* **Mecanismo:** Si la IA intenta llamar a la Tool `analizar_examen_ocr`, la Server Action verifica en `mpaci_empresas` si el plan actual incluye el módulo OCR.
* **Respuesta Controlada:** Si no está incluido, el backend devuelve un error controlado a la IA. El prompt base en Langfuse debe tener la instrucción: *"Si recibes un error de permisos en una herramienta, indícale amablemente al paciente que ese servicio no está habilitado."*

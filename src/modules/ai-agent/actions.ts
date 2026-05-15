'use server'

import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { getModel, telemetry, lastUserMessage, usageSummary } from './lib/model'
import { propagateAttributes, langfuseSpanProcessor } from './lib/tracing'
import type { ModelMessage } from 'ai'

// ── generateClinicalSummary ──────────────────────────────────────────────────
// Generates a short clinical summary for a patient given recent messages.
// Every call is traced end-to-end in Langfuse with session + user context.
// The AI SDK emits OTel spans automatically; LangfuseSpanProcessor forwards them.
export async function generateClinicalSummary(
  messages: ModelMessage[],
  opts: { sessionId: string; contactoId: string }
): Promise<{ text: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { text: '', error: 'No autenticado' }

  try {
    let resultText = ''

    await propagateAttributes(
      {
        traceName: 'clinical-summary',
        sessionId: opts.sessionId,
        userId: user.id,
        // contacto_id propagates to all child spans as metadata
        metadata: { contacto_id: opts.contactoId, input_preview: lastUserMessage(messages).slice(0, 200) },
      },
      async () => {
        const { text, usage } = await generateText({
          model: getModel(),
          messages,
          system:
            'Eres un asistente médico. Genera un resumen clínico breve y estructurado en español.',
          ...telemetry({
            traceName: 'clinical-summary',
            sessionId: opts.sessionId,
            userId: user.id,
            metadata: { contacto_id: opts.contactoId },
          }),
        })
        resultText = text
        // Attach token counts to parent span after the call completes.
        await propagateAttributes({ metadata: usageSummary(usage) }, async () => {})
      }
    )

    // forceFlush is critical in serverless — traces will not export without it.
    await langfuseSpanProcessor.forceFlush()

    return { text: resultText }
  } catch (err) {
    await langfuseSpanProcessor.forceFlush()
    return { text: '', error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}

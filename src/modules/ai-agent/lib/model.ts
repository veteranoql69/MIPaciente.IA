import { google } from '@ai-sdk/google'
import type { ModelMessage, LanguageModelUsage } from 'ai'

// Default model for all clinical AI interactions.
export const DEFAULT_MODEL_ID = 'gemini-2.0-flash'

export function getModel(modelId = DEFAULT_MODEL_ID) {
  return google(modelId)
}

// Telemetry config to attach to every AI SDK call so spans are picked up by
// the LangfuseSpanProcessor registered in src/instrumentation.ts.
export function telemetry(opts?: {
  traceName?: string
  sessionId?: string
  userId?: string
  metadata?: Record<string, string>
}) {
  return {
    experimental_telemetry: {
      isEnabled: true,
      functionId: opts?.traceName,
      metadata: {
        ...(opts?.sessionId ? { sessionId: opts.sessionId } : {}),
        ...(opts?.userId ? { userId: opts.userId } : {}),
        ...opts?.metadata,
      },
    },
  } as const
}

// Utility: extract text from the last user message for trace input logging.
export function lastUserMessage(messages: ModelMessage[]): string {
  const last = [...messages].reverse().find(m => m.role === 'user')
  if (!last) return ''
  if (typeof last.content === 'string') return last.content
  return (last.content as Array<{ type: string; text?: string }>)
    .filter(p => p.type === 'text')
    .map(p => p.text ?? '')
    .join(' ')
}

// Utility: format token counts for trace output metadata.
export function usageSummary(usage: LanguageModelUsage): Record<string, string> {
  return {
    input_tokens: String(usage.inputTokens ?? 0),
    output_tokens: String(usage.outputTokens ?? 0),
    total_tokens: String((usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)),
  }
}

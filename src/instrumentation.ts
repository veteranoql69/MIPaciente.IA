import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { LangfuseSpanProcessor } from '@langfuse/otel'

export const langfuseSpanProcessor = new LangfuseSpanProcessor()

export async function register() {
  // Only run on the server (not in Edge runtime or browser)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const provider = new NodeTracerProvider({
      spanProcessors: [langfuseSpanProcessor],
    })
    provider.register()
  }
}

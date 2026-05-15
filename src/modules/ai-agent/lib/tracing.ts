// Re-export the span processor singleton initialized in instrumentation.ts.
// Import this in server actions / route handlers to call forceFlush() after
// streaming or fire-and-forget operations complete (required in serverless).
export { langfuseSpanProcessor } from '@/instrumentation'

export { observe, propagateAttributes } from '@langfuse/tracing'

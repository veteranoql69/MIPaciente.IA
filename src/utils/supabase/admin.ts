import { createClient } from '@supabase/supabase-js'

// Cliente con service role — bypasa RLS. Solo usar en Server Actions/Route Handlers.
// NUNCA exponer al cliente (no NEXT_PUBLIC).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

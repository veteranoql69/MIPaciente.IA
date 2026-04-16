import { createBrowserClient } from "@supabase/ssr"
import { Database } from "@/lib/database.types"

// Ensure we only have a single instance of the Supabase client
let supabase: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (supabase) return supabase

  supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabase
}

import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// For client-side usage (with auth)
let supabaseClient: ReturnType<typeof createClientWithAuth>

function createClientWithAuth() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Get the client on the client-side (singleton pattern)
export function getSupabaseClient() {
  if (typeof window === "undefined") {
    // Server-side - create a new client
    return createClientWithAuth()
  }

  // Client-side - reuse the client
  if (!supabaseClient) {
    supabaseClient = createClientWithAuth()
  }

  return supabaseClient
}

// For server-side usage (with service role)
export function getSupabaseAdmin() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

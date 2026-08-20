import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"

/**
 * Supabase client built with the secret key — it bypasses RLS, so it must
 * never reach the browser. App code imports `@/db` (guarded by `server-only`);
 * this module exists separately so Node scripts (e.g. scripts/seed.ts) can use
 * the same client outside Next.js.
 *
 * Created lazily so importing the module (e.g. during `next build`) doesn't
 * require credentials — only actually querying does.
 */
let client: SupabaseClient<Database> | null = null

export function getSupabase(): SupabaseClient<Database> {
  if (client) return client

  const url = process.env.SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!url || !secretKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Copy .env.example to .env.local and fill in your Supabase keys."
    )
  }

  client = createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}

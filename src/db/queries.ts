import type { PageConfig } from "@/components/builder/types"

import { getSupabase } from "./client"
import type { Page, User } from "./types"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * There is no auth in this app: every page belongs to a single default user.
 * Upserting on the fixed email makes this self-healing even if seeding never ran.
 */
const DEFAULT_USER = { name: "Demo User", email: "demo@salon.local" }

async function upsertDefaultUser(): Promise<User> {
  const { data, error } = await getSupabase()
    .from("users")
    .upsert(DEFAULT_USER, { onConflict: "email" })
    .select()
    .single()
  if (error) throw new Error(`Failed to get default user: ${error.message}`)
  return data as User
}

/**
 * The default user is fixed, so the upsert result is cached for the lifetime
 * of the server instance — page creation skips a DB round-trip. A failed
 * attempt clears the cache so the next call retries.
 */
let defaultUserPromise: Promise<User> | null = null

export function getDefaultUser(): Promise<User> {
  if (!defaultUserPromise) {
    defaultUserPromise = upsertDefaultUser().catch((error) => {
      defaultUserPromise = null
      throw error
    })
  }
  return defaultUserPromise
}

export async function listPages(limit = 50): Promise<Page[]> {
  const { data, error } = await getSupabase()
    .from("pages")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit)
  if (error) throw new Error(`Failed to list pages: ${error.message}`)
  return (data ?? []) as Page[]
}

export async function getPage(id: string): Promise<Page | null> {
  if (!UUID_PATTERN.test(id)) return null
  const { data, error } = await getSupabase()
    .from("pages")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(`Failed to load page ${id}: ${error.message}`)
  return data as Page | null
}

export async function createPage(input: {
  name: string
  template: string
  config: PageConfig
  userId?: string
}): Promise<Page> {
  const userId = input.userId ?? (await getDefaultUser()).id
  const { data, error } = await getSupabase()
    .from("pages")
    .insert({
      name: input.name,
      template: input.template,
      config: input.config,
      user_id: userId,
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create page: ${error.message}`)
  return data as Page
}

export async function updatePage(
  id: string,
  patch: { name?: string; config?: PageConfig }
): Promise<Page> {
  const { data, error } = await getSupabase()
    .from("pages")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(`Failed to update page ${id}: ${error.message}`)
  return data as Page
}

export async function deletePage(id: string): Promise<void> {
  const { error } = await getSupabase().from("pages").delete().eq("id", id)
  if (error) throw new Error(`Failed to delete page ${id}: ${error.message}`)
}

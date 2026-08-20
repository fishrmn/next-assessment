import type { PageConfig } from "@/components/builder/types"

import type { Tables } from "./database.types"

/**
 * Row types derived from the generated Supabase types (src/db/database.types.ts).
 * Regenerate after schema changes: `supabase gen types typescript --linked`.
 * `config` is narrowed from `Json` to the app-level `PageConfig`.
 */
export type User = Tables<"users">

export type Page = Omit<Tables<"pages">, "config"> & {
  config: PageConfig
}

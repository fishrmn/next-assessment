/**
 * Seeds Supabase with the default user and one example page (only if the
 * pages table is empty, so it's safe to run repeatedly).
 * Run with `npm run db:seed` — it loads env vars from .env.local.
 */
import { getSupabase } from "../src/db/client"
import type { PageConfig } from "../src/components/builder/types"

const exampleConfig: PageConfig = [
  {
    type: "text",
    text: "Hello from Supabase",
    level: "h1",
    align: "center",
  },
  {
    type: "text",
    text: "This element config was read from the pages table and rendered by TextElement.",
    level: "p",
    align: "center",
  },
]

async function main() {
  const supabase = getSupabase()

  const { data: user, error: userError } = await supabase
    .from("users")
    .upsert({ name: "Demo User", email: "demo@salon.local" }, { onConflict: "email" })
    .select()
    .single()

  if (userError) {
    throw new Error(`Failed to upsert default user: ${userError.message}`)
  }

  const { count, error: countError } = await supabase
    .from("pages")
    .select("id", { count: "exact", head: true })

  if (countError) {
    throw new Error(`Failed to count pages: ${countError.message}`)
  }

  if ((count ?? 0) > 0) {
    console.log(`Database already has ${count} page(s) — skipping seed.`)
    return
  }

  const { error } = await supabase.from("pages").insert({
    user_id: user.id,
    name: "Example page",
    template: "starter",
    config: exampleConfig,
  })

  if (error) {
    throw new Error(`Failed to seed example page: ${error.message}`)
  }

  console.log("Seeded 1 example page.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

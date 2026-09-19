"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { db } from "@/db"
import { blueprints } from "@/db/schema"
import { emptyBlueprint, normalizeBlueprint } from "@/lib/blueprint/model"

/**
 * Creates an empty Blueprint and opens its chat. There is no form on purpose: asking for a
 * name first is a step the agent makes unnecessary. It asks for the name itself.
 */
export async function createBlueprint() {
  const row = db
    .insert(blueprints)
    .values({ name: "Untitled brand", data: emptyBlueprint() })
    .returning({ id: blueprints.id })
    .get()

  revalidatePath("/", "layout")
  redirect(`/blueprints/${row.id}`)
}

/**
 * Autosave target. `input` comes from the browser, so it is normalized before
 * it is stored: an invalid field is dropped, never written.
 */
export async function saveBlueprint(
  id: number,
  input: unknown
): Promise<{ ok: boolean; message: string }> {
  const data = normalizeBlueprint(input)
  const result = db
    .update(blueprints)
    .set({
      name: data.business.name || "Untitled brand",
      data,
      updatedAt: new Date(),
    })
    .where(eq(blueprints.id, id))
    .run()

  if (result.changes === 0) return { ok: false, message: "This blueprint no longer exists." }
  // The sidebar (in the layout) shows names and section progress.
  revalidatePath("/", "layout")
  return { ok: true, message: "Saved" }
}

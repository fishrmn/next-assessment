"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { db } from "@/db"
import { blueprints } from "@/db/schema"
import { emptyBlueprint, normalizeBlueprint } from "@/lib/blueprint/model"
import { failed, type FormState } from "@/lib/form-state"

/** Creates a Blueprint from the "New blueprint" dialog and opens its workspace. */
export async function createBlueprint(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80)
  if (!name) return failed("Give the brand a name to start.")

  const row = db
    .insert(blueprints)
    .values({ name, data: emptyBlueprint(name) })
    .returning({ id: blueprints.id })
    .get()

  revalidatePath("/", "layout")
  // Arriving at the workspace is the confirmation, so no toast.
  redirect(`/blueprints/${row.id}`)
}

/**
 * Autosave target. `input` comes from the browser, so it is normalized before
 * it is stored: an invalid field is dropped, never written.
 */
export async function saveBlueprint(id: number, input: unknown): Promise<FormState> {
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

  if (result.changes === 0) return failed("This blueprint no longer exists.")
  // The sidebar (in the layout) shows names and section progress.
  revalidatePath("/", "layout")
  return { ok: true, message: "Saved" }
}

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

/**
 * Deletes a Blueprint with its chat history. There is no undo, so the UI asks first
 * (`components/delete-blueprint.tsx`). From inside the Blueprint's own workspace the person is
 * sent to the list, because the screen they were on no longer exists.
 */
export async function deleteBlueprint(
  id: number,
  from: "workspace" | "list"
): Promise<{ ok: boolean; message: string }> {
  const result = db.delete(blueprints).where(eq(blueprints.id, id)).run()
  revalidatePath("/", "layout")
  if (from === "workspace") redirect("/")
  return result.changes > 0
    ? { ok: true, message: "Blueprint deleted" }
    : { ok: false, message: "This blueprint was already deleted." }
}

/**
 * Remembers which of the agent's changes the person undid, so a reload still shows them as
 * "Undone". The undo itself is already in the Blueprint, saved by the autosave.
 */
export async function saveUndone(id: number, toolCallIds: string[]): Promise<void> {
  const undone = [...new Set(toolCallIds.filter((item) => typeof item === "string"))].slice(-200)
  db.update(blueprints).set({ undone }).where(eq(blueprints.id, id)).run()
}

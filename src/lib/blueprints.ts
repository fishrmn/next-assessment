import { desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { blueprints } from "@/db/schema"
import { normalizeBlueprint, type Blueprint } from "@/lib/blueprint/model"

/** A stored Blueprint with its document already validated. Server-side only. */
export type BlueprintRecord = {
  id: number
  name: string
  data: Blueprint
  /** Stored chat messages, not yet validated. See `loadChat` in `src/agents/blueprint-history.ts`. */
  messages: unknown[]
  updatedAt: Date
}

function toRecord(row: typeof blueprints.$inferSelect): BlueprintRecord {
  return {
    id: row.id,
    name: row.name,
    data: normalizeBlueprint(row.data),
    messages: Array.isArray(row.messages) ? row.messages : [],
    updatedAt: row.updatedAt,
  }
}

export function listBlueprints(): BlueprintRecord[] {
  return db
    .select()
    .from(blueprints)
    .orderBy(desc(blueprints.updatedAt), desc(blueprints.id))
    .all()
    .map(toRecord)
}

export function getBlueprint(id: number): BlueprintRecord | null {
  if (!Number.isInteger(id)) return null
  const row = db.select().from(blueprints).where(eq(blueprints.id, id)).get()
  return row ? toRecord(row) : null
}

/** Stores the conversation of one Blueprint. Touches only the `messages` column, never `data`. */
export function saveMessages(id: number, messages: unknown[]): void {
  if (!Number.isInteger(id)) return
  db.update(blueprints).set({ messages }).where(eq(blueprints.id, id)).run()
}

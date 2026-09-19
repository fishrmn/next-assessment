import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

/**
 * One row per client. `data` holds the whole Blueprint document as JSON
 * (shape: `Blueprint` in `src/lib/blueprint/model.ts`). Always read it through
 * `normalizeBlueprint`, never trust the stored shape directly.
 */
export const blueprints = sqliteTable("blueprints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Brand name, duplicated from `data.business.name` so lists need no JSON parsing. */
  name: text("name").notNull(),
  data: text("data", { mode: "json" }).notNull(),
  /**
   * The conversation with the agent, in the AI SDK's UI message format. Written by the chat
   * route when a turn ends. It is history for the person, not state: the Blueprint in `data`
   * already contains every change these messages describe.
   */
  messages: text("messages", { mode: "json" }).notNull().default(sql`'[]'`),
  /**
   * Ids of the agent's tool calls the person undid. The Blueprint in `data` already reflects
   * the undo; this only lets the restored conversation show those changes as "Undone".
   */
  undone: text("undone", { mode: "json" }).notNull().default(sql`'[]'`),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

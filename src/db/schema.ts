import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import type { BrandExpression, BusinessContext } from "@/services/blueprint.types"

export const blueprints = sqliteTable("blueprints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientName: text("client_name").notNull(),
  status: text("status", { enum: ["draft", "complete"] }).notNull().default("draft"),
  currentStep: integer("current_step").notNull().default(0),
  businessContext: text("business_context", { mode: "json" }).$type<BusinessContext>(),
  brandExpression: text("brand_expression", { mode: "json" }).$type<BrandExpression>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

export type BlueprintRow = typeof blueprints.$inferSelect
export type NewBlueprintRow = typeof blueprints.$inferInsert

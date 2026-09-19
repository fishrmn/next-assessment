import { eq } from "drizzle-orm"

import { db } from "@/db"
import { blueprints, type BlueprintRow } from "@/db/schema"
import { NotFoundError } from "@/lib/errors"
import {
  validateBrandExpression,
  validateBusinessContext,
} from "@/lib/validation/blueprint-validation"
import type { Blueprint, UpdateBlueprintPatch } from "@/services/blueprint.types"

export interface BlueprintRepository {
  insert(clientName: string): Promise<Blueprint>
  findById(id: number): Promise<Blueprint | null>
  update(id: number, patch: UpdateBlueprintPatch): Promise<Blueprint>
  delete(id: number): Promise<void>
}

function toBlueprint(row: BlueprintRow): Blueprint {
  return {
    id: row.id,
    clientName: row.clientName,
    status: row.status,
    currentStep: row.currentStep,
    businessContext: row.businessContext ?? null,
    brandExpression: row.brandExpression ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class DrizzleBlueprintRepository implements BlueprintRepository {
  async insert(clientName: string): Promise<Blueprint> {
    const [row] = await db.insert(blueprints).values({ clientName }).returning()
    return toBlueprint(row)
  }

  async findById(id: number): Promise<Blueprint | null> {
    const row = await db.select().from(blueprints).where(eq(blueprints.id, id)).get()
    return row ? toBlueprint(row) : null
  }

  /** Writes only the keys present in `patch`. `currentStep` is deliberately never written. */
  async update(id: number, patch: UpdateBlueprintPatch): Promise<Blueprint> {
    const current = await this.findById(id)
    if (!current) {
      throw new NotFoundError(`Blueprint ${id} not found`)
    }

    const merged = { ...current, ...patch }
    const complete =
      validateBusinessContext(merged.businessContext).valid &&
      validateBrandExpression(merged.brandExpression).valid

    const [row] = await db
      .update(blueprints)
      .set({ ...patch, status: complete ? "complete" : "draft", updatedAt: new Date() })
      .where(eq(blueprints.id, id))
      .returning()

    return toBlueprint(row)
  }

  async delete(id: number): Promise<void> {
    await db.delete(blueprints).where(eq(blueprints.id, id))
  }
}

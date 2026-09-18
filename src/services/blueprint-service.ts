import { NotFoundError, ValidationError } from "@/lib/errors"
import { sanitizeList, sanitizeText } from "@/lib/security/sanitize"
import {
  validateBrandExpressionShape,
  validateBusinessContextShape,
  validateSection,
} from "@/lib/validation/blueprint-validation"
import {
  DrizzleBlueprintRepository,
  type BlueprintRepository,
} from "@/repositories/blueprint-repository"

import type {
  Blueprint,
  BrandExpression,
  BusinessContext,
  UpdateBlueprintPatch,
  UpdateSectionInput,
} from "./blueprint.types"

function sanitizeBusinessContext(data: BusinessContext): BusinessContext {
  return {
    industry: sanitizeText(data.industry),
    audience: sanitizeText(data.audience),
    competitors: sanitizeList(data.competitors),
    differentiators: sanitizeText(data.differentiators),
  }
}

function sanitizeBrandExpression(data: BrandExpression): BrandExpression {
  return {
    visualStyle: sanitizeText(data.visualStyle),
    colorDirection: sanitizeText(data.colorDirection),
    typographyDirection: sanitizeText(data.typographyDirection),
    toneOfVoice: sanitizeText(data.toneOfVoice),
    personality: sanitizeList(data.personality),
  }
}

export function createBlueprintService(repo: BlueprintRepository) {
  async function getById(id: number): Promise<Blueprint> {
    const blueprint = await repo.findById(id)
    if (!blueprint) {
      throw new NotFoundError(`Blueprint ${id} not found`)
    }
    return blueprint
  }

  /**
   * Field-level save path. Every key is optional and independently validated;
   * empty values are allowed, so a half-filled section still persists.
   */
  async function update(id: number, patch: UpdateBlueprintPatch): Promise<Blueprint> {
    const errors: string[] = []
    const sanitized: UpdateBlueprintPatch = {}

    if ("clientName" in patch) {
      if (typeof patch.clientName !== "string") {
        errors.push("clientName must be a string")
      } else {
        sanitized.clientName = sanitizeText(patch.clientName)
      }
    }

    if ("businessContext" in patch) {
      const result = validateBusinessContextShape(patch.businessContext)
      if (!result.valid) {
        errors.push(...result.errors)
      } else {
        sanitized.businessContext = sanitizeBusinessContext(patch.businessContext as BusinessContext)
      }
    }

    if ("brandExpression" in patch) {
      const result = validateBrandExpressionShape(patch.brandExpression)
      if (!result.valid) {
        errors.push(...result.errors)
      } else {
        sanitized.brandExpression = sanitizeBrandExpression(patch.brandExpression as BrandExpression)
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Invalid blueprint data", errors)
    }
    if (Object.keys(sanitized).length === 0) {
      throw new ValidationError("Invalid blueprint data", [
        "patch must contain at least one of: clientName, businessContext, brandExpression",
      ])
    }

    await getById(id)

    return repo.update(id, sanitized)
  }

  /** Whole-section update: strict (no empty fields). Adapter over `update`. */
  async function updateSection(id: number, input: UpdateSectionInput): Promise<Blueprint> {
    const result = validateSection(input.section, input.data)
    if (!result.valid) {
      throw new ValidationError("Invalid section data", result.errors)
    }

    return update(
      id,
      input.section === "businessContext"
        ? { businessContext: input.data as BusinessContext }
        : { brandExpression: input.data as BrandExpression },
    )
  }

  async function deleteBlueprint(id: number): Promise<void> {
    await getById(id)
    await repo.delete(id)
  }

  return {
    createDraft: (clientName: string) => repo.insert(clientName),
    getById,
    update,
    updateSection,
    deleteBlueprint,
  }
}

export type BlueprintService = ReturnType<typeof createBlueprintService>

export const blueprintService = createBlueprintService(new DrizzleBlueprintRepository())

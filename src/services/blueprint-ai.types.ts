import type { BrandExpression, BusinessContext } from "@/services/blueprint.types"

export type AiEditMode = "generate" | "revise"

export type AiEditResult = {
  businessContext: BusinessContext
  brandExpression: BrandExpression
}

export type BusinessContext = {
  industry: string
  audience: string
  competitors: string[]
  differentiators: string
}

export type BrandExpression = {
  visualStyle: string
  colorDirection: string
  typographyDirection: string
  toneOfVoice: string
  personality: string[]
}

export type BlueprintStatus = "draft" | "complete"

export type Blueprint = {
  id: number
  clientName: string
  status: BlueprintStatus
  currentStep: number
  businessContext: BusinessContext | null
  brandExpression: BrandExpression | null
  createdAt: Date
  updatedAt: Date
}

export type BlueprintSection = "businessContext" | "brandExpression"

export type SectionData<S extends BlueprintSection> = S extends "businessContext"
  ? BusinessContext
  : BrandExpression

/** Body shape for PATCH /api/blueprints/:id */
export type UpdateBlueprintPatch = {
  clientName?: string
  businessContext?: BusinessContext
  brandExpression?: BrandExpression
}

/**
 * Section-scoped update. Kept as a thin adapter over `UpdateBlueprintPatch` so
 * `blueprint-ai-service.ts` — which writes whole, validated sections — needs no
 * change. New callers should use the patch shape.
 */
export type UpdateSectionInput = {
  section: BlueprintSection
  data: BusinessContext | BrandExpression
  currentStep?: number
}

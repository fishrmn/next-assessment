import { beforeEach, describe, expect, it } from "vitest"

import { AiGenerationError } from "@/lib/errors"
import {
  validateBrandExpression,
  validateBusinessContext,
} from "@/lib/validation/blueprint-validation"
import type { BlueprintRepository } from "@/repositories/blueprint-repository"

import { createBlueprintAiService, type BlueprintGenerator } from "@/services/blueprint-ai-service"
import { createBlueprintService } from "@/services/blueprint-service"
import type { AiEditResult } from "@/services/blueprint-ai.types"
import type {
  Blueprint,
  BlueprintSection,
  BrandExpression,
  BusinessContext,
} from "@/services/blueprint.types"

function createFakeRepo() {
  const store: Blueprint[] = []
  const writes: BlueprintSection[] = []
  let nextId = 1

  const repo: BlueprintRepository = {
    async insert(clientName) {
      const now = new Date()
      const blueprint: Blueprint = {
        id: nextId++,
        clientName,
        status: "draft",
        currentStep: 0,
        businessContext: null,
        brandExpression: null,
        createdAt: now,
        updatedAt: now,
      }
      store.push(blueprint)
      return { ...blueprint }
    },
    async findById(id) {
      const found = store.find((blueprint) => blueprint.id === id)
      return found ? { ...found } : null
    },
    async update(id, patch) {
      const found = store.find((blueprint) => blueprint.id === id)!
      writes.push(...(Object.keys(patch) as BlueprintSection[]))

      Object.assign(found, patch)
      found.status =
        validateBusinessContext(found.businessContext).valid &&
        validateBrandExpression(found.brandExpression).valid
          ? "complete"
          : "draft"

      return { ...found }
    },
    async delete(id) {
      const index = store.findIndex((blueprint) => blueprint.id === id)
      if (index !== -1) store.splice(index, 1)
    },
  }

  return { repo, store, writes }
}

const businessContext: BusinessContext = {
  industry: "Artisan coffee roasting",
  audience: "Independent cafés in Dublin",
  competitors: ["Roast Co"],
  differentiators: "Single-origin sourcing with same-week roasting",
}

const brandExpression: BrandExpression = {
  visualStyle: "Warm minimalist",
  colorDirection: "Terracotta and cream",
  typographyDirection: "Humanist sans with a serif accent",
  toneOfVoice: "Direct and generous",
  personality: ["Grounded", "Curious"],
}

function fakeGeneratorFactory(result: unknown) {
  const generator: BlueprintGenerator = {
    async generate() {
      return result as AiEditResult
    },
  }
  return () => generator
}

describe("blueprintAiService", () => {
  let service: ReturnType<typeof createBlueprintService>
  let writes: BlueprintSection[]

  beforeEach(() => {
    const fake = createFakeRepo()
    service = createBlueprintService(fake.repo)
    writes = fake.writes
  })

  it("persists both sections in generate mode", async () => {
    const { id } = await service.createDraft("Acme Coffee")
    const ai = createBlueprintAiService(
      fakeGeneratorFactory({ businessContext, brandExpression }),
      service,
    )

    const updated = await ai.applyInstruction(id, "generate", "A Dublin coffee roaster")

    expect(updated.businessContext).toEqual(businessContext)
    expect(updated.brandExpression).toEqual(brandExpression)
    expect(writes).toEqual(["businessContext", "brandExpression"])
  })

  it("skips the write for a section the AI left unchanged", async () => {
    const { id } = await service.createDraft("Acme Coffee")
    await service.updateSection(id, { section: "businessContext", data: businessContext })
    await service.updateSection(id, { section: "brandExpression", data: brandExpression })
    writes.length = 0

    const revised = { ...brandExpression, toneOfVoice: "Playful and irreverent" }
    const ai = createBlueprintAiService(
      fakeGeneratorFactory({ businessContext, brandExpression: revised }),
      service,
    )

    const updated = await ai.applyInstruction(id, "revise", "Make the tone playful")

    expect(writes).toEqual(["brandExpression"])
    expect(updated.brandExpression).toEqual(revised)
    expect(updated.businessContext).toEqual(businessContext)
  })

  it("rejects invalid AI output without writing", async () => {
    const { id } = await service.createDraft("Acme Coffee")
    const ai = createBlueprintAiService(
      fakeGeneratorFactory({
        businessContext: { ...businessContext, audience: undefined },
        brandExpression,
      }),
      service,
    )

    await expect(ai.applyInstruction(id, "generate", "A Dublin coffee roaster")).rejects.toBeInstanceOf(
      AiGenerationError,
    )
    expect(writes).toEqual([])
  })

  it("rejects AI output with empty-string fields without writing", async () => {
    const { id } = await service.createDraft("Acme Coffee")
    const ai = createBlueprintAiService(
      fakeGeneratorFactory({
        businessContext: { ...businessContext, industry: "", differentiators: "   " },
        brandExpression: { ...brandExpression, toneOfVoice: "" },
      }),
      service,
    )

    await expect(ai.applyInstruction(id, "generate", "A Dublin coffee roaster")).rejects.toBeInstanceOf(
      AiGenerationError,
    )
    expect(writes).toEqual([])
  })
})

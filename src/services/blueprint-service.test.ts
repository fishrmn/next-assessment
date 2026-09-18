import { beforeEach, describe, expect, it } from "vitest"

import { NotFoundError, ValidationError } from "@/lib/errors"
import {
  validateBrandExpression,
  validateBusinessContext,
} from "@/lib/validation/blueprint-validation"
import type { BlueprintRepository } from "@/repositories/blueprint-repository"

import { createBlueprintService } from "./blueprint-service"
import type { Blueprint, BrandExpression, BusinessContext } from "./blueprint.types"

function createFakeRepo() {
  const store: Blueprint[] = []
  let nextId = 1
  const deleteCalls: number[] = []

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
      const found = store.find((blueprint) => blueprint.id === id)
      if (!found) throw new NotFoundError(`Blueprint ${id} not found`)

      Object.assign(found, patch)
      found.status =
        validateBusinessContext(found.businessContext).valid &&
        validateBrandExpression(found.brandExpression).valid
          ? "complete"
          : "draft"
      found.updatedAt = new Date()

      return { ...found }
    },
    async delete(id) {
      deleteCalls.push(id)
      const index = store.findIndex((blueprint) => blueprint.id === id)
      if (index !== -1) store.splice(index, 1)
    },
  }

  return { repo, store, deleteCalls }
}

const validBusinessContext: BusinessContext = {
  industry: "  Artisan coffee roasting  ",
  audience: "Independent cafés in Dublin",
  competitors: ["Roast Co", "   ", "Bean & Co"],
  differentiators: "Single-origin sourcing with same-week roasting",
}

const validBrandExpression: BrandExpression = {
  visualStyle: "Warm minimalist",
  colorDirection: "Terracotta and cream",
  typographyDirection: "Humanist sans with a serif accent",
  toneOfVoice: "Direct and generous",
  personality: ["Grounded", "Curious"],
}

describe("blueprintService", () => {
  let service: ReturnType<typeof createBlueprintService>
  let store: Blueprint[]
  let deleteCalls: number[]

  beforeEach(() => {
    const fake = createFakeRepo()
    service = createBlueprintService(fake.repo)
    store = fake.store
    deleteCalls = fake.deleteCalls
  })

  it("creates a draft with empty sections", async () => {
    const blueprint = await service.createDraft("Acme Coffee")

    expect(blueprint).toMatchObject({
      clientName: "Acme Coffee",
      status: "draft",
      currentStep: 0,
      businessContext: null,
      brandExpression: null,
    })
  })

  it("throws NotFoundError for a missing id", async () => {
    await expect(service.getById(999)).rejects.toBeInstanceOf(NotFoundError)
  })

  it("persists sanitized section data", async () => {
    const { id } = await service.createDraft("Acme Coffee")

    const updated = await service.updateSection(id, {
      section: "businessContext",
      data: validBusinessContext,
      currentStep: 1,
    })

    expect(updated.businessContext).toEqual({
      industry: "Artisan coffee roasting",
      audience: "Independent cafés in Dublin",
      competitors: ["Roast Co", "Bean & Co"],
      differentiators: "Single-origin sourcing with same-week roasting",
    })
    // currentStep is a legacy column the canvas no longer drives, so it is never written.
    expect(updated.currentStep).toBe(0)
    expect(updated.status).toBe("draft")
  })

  it("marks the blueprint complete once both sections are filled", async () => {
    const { id } = await service.createDraft("Acme Coffee")
    await service.updateSection(id, { section: "businessContext", data: validBusinessContext })

    const updated = await service.updateSection(id, {
      section: "brandExpression",
      data: validBrandExpression,
    })

    expect(updated.status).toBe("complete")
  })

  it("rejects invalid section data without mutating the store", async () => {
    const { id } = await service.createDraft("Acme Coffee")

    await expect(
      service.updateSection(id, {
        section: "businessContext",
        data: { ...validBusinessContext, industry: "" },
      }),
    ).rejects.toBeInstanceOf(ValidationError)

    expect(store[0].businessContext).toBeNull()
  })

  it("rejects an update to a missing blueprint before writing", async () => {
    await expect(
      service.updateSection(42, { section: "businessContext", data: validBusinessContext }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it("persists a partially filled section", async () => {
    const { id } = await service.createDraft("Acme Coffee")

    const updated = await service.update(id, {
      businessContext: { industry: "Coffee", audience: "", competitors: [], differentiators: "" },
    })

    expect(updated.businessContext).toEqual({
      industry: "Coffee",
      audience: "",
      competitors: [],
      differentiators: "",
    })
    expect(updated.status).toBe("draft")
    expect(store[0].businessContext?.industry).toBe("Coffee")
  })

  it("updates the client name on its own", async () => {
    const { id } = await service.createDraft("Acme Coffee")

    const updated = await service.update(id, { clientName: "  Acme Roasters  " })

    expect(updated.clientName).toBe("Acme Roasters")
    expect(updated.businessContext).toBeNull()
  })

  it("rejects an empty patch", async () => {
    const { id } = await service.createDraft("Acme Coffee")

    await expect(service.update(id, {})).rejects.toBeInstanceOf(ValidationError)
  })

  it("rejects a malformed patch without mutating the store", async () => {
    const { id } = await service.createDraft("Acme Coffee")

    await expect(
      service.update(id, {
        businessContext: { ...validBusinessContext, competitors: "not-an-array" as never },
      }),
    ).rejects.toBeInstanceOf(ValidationError)

    expect(store[0].businessContext).toBeNull()
  })

  it("rejects a non-string client name", async () => {
    const { id } = await service.createDraft("Acme Coffee")

    await expect(service.update(id, { clientName: 42 as never })).rejects.toBeInstanceOf(
      ValidationError,
    )

    expect(store[0].clientName).toBe("Acme Coffee")
  })

  it("derives status from the merged record in both directions", async () => {
    const { id } = await service.createDraft("Acme Coffee")

    const halfFilled = await service.update(id, {
      businessContext: validBusinessContext,
      brandExpression: { ...validBrandExpression, toneOfVoice: "" },
    })
    expect(halfFilled.status).toBe("draft")

    const complete = await service.update(id, { brandExpression: validBrandExpression })
    expect(complete.status).toBe("complete")

    const cleared = await service.update(id, {
      businessContext: { ...validBusinessContext, industry: "" },
    })
    expect(cleared.status).toBe("draft")
  })

  it("rejects a patch for a missing blueprint", async () => {
    await expect(service.update(999, { clientName: "Ghost" })).rejects.toBeInstanceOf(NotFoundError)
  })

  it("deletes a blueprint after confirming it exists", async () => {
    const { id } = await service.createDraft("Acme Coffee")

    await service.deleteBlueprint(id)

    expect(deleteCalls).toEqual([id])
    expect(store.find((blueprint) => blueprint.id === id)).toBeUndefined()
  })

  it("rejects deleting a missing blueprint without calling the repository", async () => {
    await expect(service.deleteBlueprint(999)).rejects.toBeInstanceOf(NotFoundError)

    expect(deleteCalls).toEqual([])
  })
})

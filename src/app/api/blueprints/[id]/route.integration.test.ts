import { describe, expect, it } from "vitest"

import { blueprintService } from "@/services/blueprint-service"
import type { BrandExpression, BusinessContext } from "@/services/blueprint.types"

import { DELETE, GET, PATCH } from "./route"

const businessContext: BusinessContext = {
  industry: "Coffee roasting",
  audience: "Independent cafes",
  competitors: ["Acme Beans", "Roast Co"],
  differentiators: "Single-origin, direct trade",
}

const brandExpression: BrandExpression = {
  visualStyle: "Warm minimalism",
  colorDirection: "Terracotta and cream",
  typographyDirection: "Humanist sans",
  toneOfVoice: "Friendly and direct",
  personality: ["earthy", "considered"],
}

/** A section as the canvas sends it before any field has been filled in. */
const emptyBusinessContext: BusinessContext = {
  industry: "",
  audience: "",
  competitors: [],
  differentiators: "",
}

const emptyBrandExpression: BrandExpression = {
  visualStyle: "",
  colorDirection: "",
  typographyDirection: "",
  toneOfVoice: "",
  personality: [],
}

function ctx(id: string | number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

function patchRequest(body: unknown) {
  return new Request("http://localhost/api/blueprints/1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

async function draft(clientName: string) {
  return blueprintService.createDraft(clientName)
}

/** Arrange helper: a blueprint with both sections fully filled in (status complete). */
async function completed(clientName: string) {
  const created = await draft(clientName)
  return blueprintService.update(created.id, { businessContext, brandExpression })
}

describe("GET /api/blueprints/:id", () => {
  it("returns the blueprint for an existing id", async () => {
    const created = await draft("Get Co")
    const response = await GET(new Request("http://localhost"), ctx(created.id))
    const json = (await response.json()) as { id: number; clientName: string; status: string }

    expect(response.status).toBe(200)
    expect(json.id).toBe(created.id)
    expect(json.clientName).toBe("Get Co")
    expect(json.status).toBe("draft")
  })

  it("returns 404 for a missing id", async () => {
    const response = await GET(new Request("http://localhost"), ctx(999_999))
    expect(response.status).toBe(404)
  })

  it("returns 400 for a non-numeric id", async () => {
    const response = await GET(new Request("http://localhost"), ctx("abc"))
    expect(response.status).toBe(400)
  })
})

describe("PATCH /api/blueprints/:id", () => {
  it("persists a section with only one field filled in", async () => {
    const created = await draft("Patch One Field")
    const partial: BusinessContext = { ...emptyBusinessContext, industry: "Coffee roasting" }

    const response = await PATCH(patchRequest({ businessContext: partial }), ctx(created.id))
    expect(response.status).toBe(200)

    const stored = await blueprintService.getById(created.id)
    expect(stored.businessContext).toEqual(partial)
    expect(stored.brandExpression).toBeNull()
    expect(stored.status).toBe("draft")
  })

  it("persists a clientName-only patch without disturbing either section", async () => {
    const created = await completed("Old Name")

    const response = await PATCH(patchRequest({ clientName: "New Name" }), ctx(created.id))
    expect(response.status).toBe(200)

    const stored = await blueprintService.getById(created.id)
    expect(stored.clientName).toBe("New Name")
    expect(stored.businessContext).toEqual(businessContext)
    expect(stored.brandExpression).toEqual(brandExpression)
    expect(stored.status).toBe("complete")
  })

  it("writes a section whole, replacing the previous value", async () => {
    const created = await completed("Patch Whole")
    const edited: BusinessContext = { ...businessContext, industry: "Tea blending" }

    const response = await PATCH(patchRequest({ businessContext: edited }), ctx(created.id))
    expect(response.status).toBe(200)

    const stored = await blueprintService.getById(created.id)
    expect(stored.businessContext).toEqual(edited)
  })

  it("ignores currentStep and any other unrecognised key", async () => {
    const created = await draft("Patch Extra Keys")

    const response = await PATCH(
      patchRequest({ businessContext, currentStep: 3, nonsense: true }),
      ctx(created.id),
    )
    expect(response.status).toBe(200)

    const stored = await blueprintService.getById(created.id)
    expect(stored.businessContext).toEqual(businessContext)
    expect(stored.currentStep).toBe(0)
  })

  it("returns 400 for a body with none of the patch keys", async () => {
    const created = await draft("Patch Empty Body")
    const response = await PATCH(patchRequest({}), ctx(created.id))
    expect(response.status).toBe(400)
  })

  it("returns 400 when only unrecognised keys are sent", async () => {
    const created = await draft("Patch Only Unknown")
    const response = await PATCH(patchRequest({ currentStep: 2 }), ctx(created.id))
    expect(response.status).toBe(400)
  })

  it("rejects a malformed section and leaves the stored record unchanged", async () => {
    const created = await completed("Patch Malformed")

    const response = await PATCH(
      patchRequest({ businessContext: { ...businessContext, competitors: "not-an-array" } }),
      ctx(created.id),
    )
    expect(response.status).toBe(400)

    const stored = await blueprintService.getById(created.id)
    expect(stored.businessContext).toEqual(businessContext)
    expect(stored.brandExpression).toEqual(brandExpression)
    expect(stored.status).toBe("complete")
  })

  it("rejects the whole patch when one of several keys is malformed", async () => {
    const created = await completed("Patch Partly Malformed")

    const response = await PATCH(
      patchRequest({
        clientName: "Should Not Be Written",
        brandExpression: { ...brandExpression, personality: "not-an-array" },
      }),
      ctx(created.id),
    )
    expect(response.status).toBe(400)

    const stored = await blueprintService.getById(created.id)
    expect(stored.clientName).toBe("Patch Partly Malformed")
    expect(stored.brandExpression).toEqual(brandExpression)
  })

  it("returns 404 when patching a missing id", async () => {
    const response = await PATCH(patchRequest({ clientName: "Ghost" }), ctx(999_997))
    expect(response.status).toBe(404)
  })

  it("returns 400 when patching a non-numeric id", async () => {
    const response = await PATCH(patchRequest({ clientName: "Ghost" }), ctx("abc"))
    expect(response.status).toBe(400)
  })
})

describe("PATCH /api/blueprints/:id status", () => {
  it("stays draft while either section is still partial", async () => {
    const created = await draft("Status Partial")

    const first = await PATCH(patchRequest({ businessContext }), ctx(created.id))
    expect(((await first.json()) as { status: string }).status).toBe("draft")

    const second = await PATCH(
      patchRequest({ brandExpression: { ...brandExpression, toneOfVoice: "" } }),
      ctx(created.id),
    )
    expect(((await second.json()) as { status: string }).status).toBe("draft")
    expect((await blueprintService.getById(created.id)).status).toBe("draft")
  })

  it("flips to complete once every field of both sections is filled in", async () => {
    const created = await draft("Status Complete")

    await PATCH(patchRequest({ businessContext }), ctx(created.id))
    const response = await PATCH(patchRequest({ brandExpression }), ctx(created.id))

    expect(response.status).toBe(200)
    expect(((await response.json()) as { status: string }).status).toBe("complete")

    const stored = await blueprintService.getById(created.id)
    expect(stored.status).toBe("complete")
    expect(stored.businessContext).toEqual(businessContext)
    expect(stored.brandExpression).toEqual(brandExpression)
  })

  it("falls back to draft when a previously filled field is cleared", async () => {
    const created = await completed("Status Cleared")
    expect(created.status).toBe("complete")

    const cleared: BusinessContext = { ...businessContext, differentiators: "" }
    const response = await PATCH(patchRequest({ businessContext: cleared }), ctx(created.id))

    expect(response.status).toBe(200)
    expect(((await response.json()) as { status: string }).status).toBe("draft")

    const stored = await blueprintService.getById(created.id)
    expect(stored.status).toBe("draft")
    expect(stored.businessContext).toEqual(cleared)
  })

  it("stays draft when both sections are saved empty", async () => {
    const created = await draft("Status Empty Sections")

    const response = await PATCH(
      patchRequest({
        businessContext: emptyBusinessContext,
        brandExpression: emptyBrandExpression,
      }),
      ctx(created.id),
    )
    expect(response.status).toBe(200)

    const stored = await blueprintService.getById(created.id)
    expect(stored.status).toBe("draft")
    expect(stored.businessContext).toEqual(emptyBusinessContext)
    expect(stored.brandExpression).toEqual(emptyBrandExpression)
  })
})

describe("DELETE /api/blueprints/:id", () => {
  it("deletes an existing blueprint", async () => {
    const created = await draft("Delete Me")

    const response = await DELETE(new Request("http://localhost"), ctx(created.id))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: created.id })

    const after = await GET(new Request("http://localhost"), ctx(created.id))
    expect(after.status).toBe(404)
  })

  it("returns 404 for an already-missing id", async () => {
    const response = await DELETE(new Request("http://localhost"), ctx(999_998))
    expect(response.status).toBe(404)
  })
})

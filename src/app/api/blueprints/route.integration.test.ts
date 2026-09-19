import { describe, expect, it } from "vitest"

import { blueprintService } from "@/services/blueprint-service"

import { POST } from "./route"

function postRequest(body: unknown) {
  return new Request("http://localhost/api/blueprints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/blueprints", () => {
  it("creates a draft blueprint and returns its id", async () => {
    const response = await POST(postRequest({ clientName: "Test Co" }), {})
    const json = (await response.json()) as { id: number }

    expect(response.status).toBe(201)
    expect(typeof json.id).toBe("number")

    const blueprint = await blueprintService.getById(json.id)
    expect(blueprint.clientName).toBe("Test Co")
    expect(blueprint.status).toBe("draft")
    expect(blueprint.currentStep).toBe(0)
    expect(blueprint.businessContext).toBeNull()
    expect(blueprint.brandExpression).toBeNull()
  })

  it("rejects a missing clientName", async () => {
    const response = await POST(postRequest({}), {})
    expect(response.status).toBe(400)
  })

  it("rejects an empty clientName", async () => {
    const response = await POST(postRequest({ clientName: "   " }), {})
    expect(response.status).toBe(400)
  })
})

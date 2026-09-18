import { describe, expect, it } from "vitest"

import { blueprintService } from "@/services/blueprint-service"

import { POST } from "./route"

function postRequest(body: unknown) {
  return new Request("http://localhost/api/blueprints/1/ai-edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/blueprints/:id/ai-edit (no OPENAI_API_KEY)", () => {
  it("returns 502 AiGenerationError and leaves the blueprint untouched", async () => {
    const draft = await blueprintService.createDraft("Test Co")

    const response = await POST(
      postRequest({ instruction: "make the tone more playful", mode: "generate" }),
      { params: Promise.resolve({ id: String(draft.id) }) },
    )
    const json = (await response.json()) as { error: string }

    expect(response.status).toBe(502)
    expect(json.error).toBe("AI could not generate a Blueprint update")

    const blueprint = await blueprintService.getById(draft.id)
    expect(blueprint.businessContext).toBeNull()
    expect(blueprint.brandExpression).toBeNull()
  })
})

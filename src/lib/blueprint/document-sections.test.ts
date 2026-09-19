import { describe, expect, it } from "vitest"

import { editSlot, isEdited, resetSlot, slotText } from "./document-sections"
import { normalizeBlueprint } from "./model"

const blueprint = normalizeBlueprint({
  business: { name: "Acme", offer: "run payroll", audience: "small teams", differentiator: "skip the sales call" },
})

describe("document slots", () => {
  it("prints generated text until a person edits it", () => {
    expect(slotText(blueprint, "apart", "title")).toBe("What sets them apart")
    expect(slotText(blueprint, "apart", "body")).toBe("We skip the sales call.")
    expect(slotText(blueprint, "hero", "body")).toBe("We run payroll for small teams.")
    expect(isEdited(blueprint, "apart", "title")).toBe(false)
  })

  it("prints nothing for a body whose answers are missing", () => {
    expect(slotText(blueprint, "headed", "body")).toBe("")
  })

  it("stores an edit over the generated text, and leaves the answers alone", () => {
    const edited = editSlot(blueprint, "apart", "title", "Why us")

    expect(slotText(edited, "apart", "title")).toBe("Why us")
    expect(isEdited(edited, "apart", "title")).toBe(true)
    expect(edited.business).toEqual(blueprint.business)
    expect(slotText(edited, "apart", "body")).toBe("We skip the sales call.")
  })

  it("treats text typed back to the generated wording, or blanked, as no edit", () => {
    const edited = editSlot(blueprint, "apart", "title", "Why us")

    expect(editSlot(edited, "apart", "title", "What sets them apart").copy).toEqual({})
    expect(editSlot(edited, "apart", "title", "   ").copy).toEqual({})
  })

  it("resets one slot without touching the section's other edit", () => {
    const both = editSlot(editSlot(blueprint, "apart", "title", "Why us"), "apart", "body", "No sales calls. Ever.")
    const reset = resetSlot(both, "apart", "title")

    expect(reset.copy).toEqual({ apart: { body: "No sales calls. Ever." } })
    expect(slotText(reset, "apart", "title")).toBe("What sets them apart")
  })

  it("survives the input gate", () => {
    const edited = editSlot(blueprint, "voice", "title", "How we talk")
    expect(normalizeBlueprint(JSON.parse(JSON.stringify(edited)))).toEqual(edited)
  })
})

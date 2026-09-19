import { describe, expect, it } from "vitest"

import { fieldGuide } from "./field-guide"
import { FIELDS, missingFields } from "./fields"
import { FONT_PAIRINGS, TRAITS, emptyBlueprint, normalizeBlueprint } from "./model"

describe("fieldGuide", () => {
  it("lists every trait, font and scale the Blueprint accepts", () => {
    const guide = fieldGuide()
    for (const trait of TRAITS) expect(guide).toContain(trait)
    for (const font of FONT_PAIRINGS) expect(guide).toContain(`- ${font}:`)
    expect(guide).toContain("tone.humor: 1 = Serious")
    expect(guide).toContain("visual.density: 1 = Minimal")
  })
})

describe("missingFields", () => {
  it("lists every field of an empty Blueprint", () => {
    expect(missingFields(emptyBlueprint())).toHaveLength(FIELDS.length)
  })

  it("does not count a fact the person left open", () => {
    const blueprint = normalizeBlueprint({ skipped: ["business.comparables"] })
    const paths = missingFields(blueprint).map((field) => field.path)
    expect(paths).not.toContain("business.comparables")
    expect(paths).toContain("business.goal")
  })

  it("drops a field once it holds a value", () => {
    const blueprint = normalizeBlueprint({
      business: { name: "Acme", comparables: ["Gusto"] },
      expression: { tone: { humor: 3 } },
    })
    const paths = missingFields(blueprint).map((field) => field.path)

    expect(paths).not.toContain("business.name")
    expect(paths).not.toContain("business.comparables")
    expect(paths).not.toContain("expression.tone.humor")
    expect(paths).toContain("business.audience")
    expect(paths).toHaveLength(FIELDS.length - 3)
  })
})

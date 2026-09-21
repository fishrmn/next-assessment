import { describe, expect, it } from "vitest"

import { emptyBlueprint, normalizeBlueprint } from "./model"
import { completion, stageOf } from "./fields"
import { applyPatch } from "./patch"
import { describeColor, describeScale, scaleField } from "./registry"

describe("normalizeBlueprint", () => {
  it("turns anything into a valid, empty Blueprint", () => {
    expect(normalizeBlueprint(null)).toEqual(emptyBlueprint())
    expect(normalizeBlueprint("nonsense")).toEqual(emptyBlueprint())
  })

  it("keeps valid fields and drops invalid ones", () => {
    const result = normalizeBlueprint({
      business: { name: "Acme", industry: "Not an industry", comparables: ["Gusto", "", 7] },
      expression: {
        personality: ["Bold", "Bold", "Invented", "Warm", "Calm", "Expert"],
        tone: { formality: 4, humor: 9 },
        color: { palette: { primary: "red", secondary: "#000000", accent: "#000000", background: "#ffffff" } },
        typography: { pairing: "comic-sans" },
      },
    })

    expect(result.business.name).toBe("Acme")
    expect(result.business.industry).toBe("")
    expect(result.business.comparables).toEqual(["Gusto"])
    expect(result.expression.personality).toEqual(["Bold", "Warm", "Calm"])
    expect(result.expression.tone.formality).toBe(4)
    expect(result.expression.tone.humor).toBeNull()
    expect(result.expression.color.palette).toBeNull()
    expect(result.expression.typography.pairing).toBeNull()
  })
})

describe("normalizeBlueprint copy layer", () => {
  it("keeps edits of known sections and drops everything else", () => {
    const result = normalizeBlueprint({
      copy: {
        voice: { title: "How we talk", body: "   " },
        hero: { title: 42 },
        invented: { title: "Nope" },
        color: { body: "x".repeat(900) },
      },
    })

    expect(result.copy.voice).toEqual({ title: "How we talk" })
    expect(result.copy.hero).toBeUndefined()
    expect(Object.keys(result.copy)).toEqual(["voice", "color"])
    expect(result.copy.color?.body).toHaveLength(400)
  })
})

describe("facts left open on purpose", () => {
  it("keeps known, still-empty facts and drops the rest", () => {
    const result = normalizeBlueprint({
      business: { goal: "grow in Europe" },
      skipped: ["business.comparables", "business.goal", "business.name", "expression.tone.humor", "business.comparables"],
    })
    // goal has a value, the name cannot be skipped, humor is not a fact, and duplicates collapse.
    expect(result.skipped).toEqual(["business.comparables"])
  })
})

describe("direction and review", () => {
  it("keeps the agent's direction and the person's confirmation", () => {
    const result = normalizeBlueprint({
      direction: { headline: "A close, everyday brand", rationale: 7 },
      review: { confirmed: "yes" },
    })
    expect(result.direction).toEqual({ headline: "A close, everyday brand", rationale: "" })
    // Only a real `true` counts as confirmed.
    expect(result.review.confirmed).toBe(false)
    expect(normalizeBlueprint({ review: { confirmed: true } }).review.confirmed).toBe(true)
  })

  it("stays at the start until there is something worth showing", () => {
    expect(stageOf(emptyBlueprint("Patio"))).toBe("start")
    expect(stageOf(normalizeBlueprint({ business: { name: "Patio", industry: "Food & beverage" } }))).toBe("start")
    expect(stageOf(normalizeBlueprint({ business: { offer: "serve coffee" } }))).toBe("proposal")
    expect(stageOf(normalizeBlueprint({ expression: { tone: { humor: 4 } } }))).toBe("proposal")
  })
})

describe("registry", () => {
  it("describes a scale position in words", () => {
    const humor = scaleField("humor")
    expect(describeScale(humor, null)).toBeNull()
    expect(describeScale(humor, 1)).toBe("Very serious")
    expect(describeScale(humor, 4)).toBe("Leans playful")
    expect(describeScale(humor, 3)).toBe("Between serious and playful")
  })

  it("counts filled fields", () => {
    const { blueprint } = applyPatch(emptyBlueprint("Acme"), { expression: { visual: { density: 2 } } })
    expect(completion(emptyBlueprint())).toBe(0)
    // "Acme" and one scale: 2 of 18 fields.
    expect(completion(blueprint)).toBe(11)
  })

  it("reads the color direction off the primary color", () => {
    const palette = { secondary: "#000000", accent: "#000000", background: "#ffffff" }
    expect(describeColor(null)).toBeNull()
    expect(describeColor({ ...palette, primary: "#c2410c" })).toBe("Warm and vivid")
    expect(describeColor({ ...palette, primary: "#47607a" })).toBe("Cool and muted")
    expect(describeColor({ ...palette, primary: "#18181b" })).toBe("Neutral and muted")
  })
})

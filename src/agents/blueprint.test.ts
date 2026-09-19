import { describe, expect, it } from "vitest"

import { emptyBlueprint, normalizeBlueprint } from "@/lib/blueprint/model"

import { buildInstructions, createWorkingCopy } from "./blueprint"

describe("createWorkingCopy", () => {
  it("builds each patch of a turn on the one before it", () => {
    const working = createWorkingCopy(emptyBlueprint("Acme"))

    const first = working.update({ expression: { tone: { humor: 2 } } })
    const second = working.update({ expression: { tone: { humor: 4 } } })

    expect(first.applied[0]).toMatchObject({ from: "—", to: "Leans serious" })
    expect(second.applied[0]).toMatchObject({ from: "Leans serious", to: "Leans playful" })
    expect(working.current.expression.tone.humor).toBe(4)
  })

  it("hands rejections back so the model can correct itself", () => {
    const working = createWorkingCopy(emptyBlueprint("Acme"))
    const { applied, rejected } = working.update({
      expression: { typography: { pairing: "comic-sans" } },
    })

    expect(applied).toEqual([])
    expect(rejected[0].reason).toContain("modern")
    expect(working.current.expression.typography.pairing).toBeNull()
  })
})

describe("a turn about one part", () => {
  it("lets the tool change only that part", () => {
    const working = createWorkingCopy(emptyBlueprint("Acme"), ["expression.tone", "copy.voice"])
    const { applied, rejected } = working.update({
      expression: { tone: { humor: 4 }, personality: ["Bold"] },
    })
    expect(applied.map((change) => change.path)).toEqual(["expression.tone.humor"])
    expect(rejected.map((item) => item.path)).toEqual(["expression.personality"])
  })

  it("tells the agent which part, and only when there is one", () => {
    expect(buildInstructions(emptyBlueprint("Acme"))).not.toContain("THIS TURN IS ABOUT ONE PART")
    const scoped = buildInstructions(emptyBlueprint("Acme"), { about: "color" })
    expect(scoped).toContain('The person pointed at "Color"')
    expect(scoped).toContain("expression.color, copy.color")
  })
})

describe("buildInstructions", () => {
  it("carries the current Blueprint and what is still missing", () => {
    const blueprint = normalizeBlueprint({
      business: { name: "Acme", audience: "small teams" },
      expression: { tone: { humor: 4 } },
    })
    const instructions = buildInstructions(blueprint)

    expect(instructions).toContain(JSON.stringify(blueprint))
    expect(instructions).toMatch(/Business facts: .*Industry/)
    expect(instructions).not.toMatch(/Business facts: .*Who they serve/)
    expect(instructions).not.toMatch(/Brand expression: .*Humor/)
  })

  it("says nothing is missing for a complete Blueprint", () => {
    const blueprint = normalizeBlueprint({
      direction: { headline: "Payroll without the drama", rationale: "They said: no sales call." },
      business: { name: "Acme", industry: "Finance", offer: "run payroll", audience: "small teams", goal: "grow", comparables: ["Gusto"], differentiator: "skip the sales call" },
      expression: {
        personality: ["Bold"],
        tone: { formality: 3, humor: 3, attitude: 3, energy: 3 },
        visual: { density: 3, era: 3 },
        color: { palette: { primary: "#111111", secondary: "#222222", accent: "#333333", background: "#ffffff" } },
        typography: { pairing: "modern" },
      },
    })
    const instructions = buildInstructions(blueprint)

    expect(instructions).toContain("Business facts: none")
    expect(instructions).toContain("Brand expression: none")
  })
})

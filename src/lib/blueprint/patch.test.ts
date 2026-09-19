import { describe, expect, it } from "vitest"

import { emptyBlueprint, normalizeBlueprint } from "./model"
import { applyPatch, revertChanges } from "./patch"
import { patchFromToolInput, patchSchema } from "./patch-schema"

const acme = normalizeBlueprint({
  business: { name: "Acme", offer: "run payroll" },
  expression: { tone: { humor: 2 }, personality: ["Bold"] },
})

describe("applyPatch", () => {
  it("changes only what the patch names, and reports before and after in words", () => {
    const { blueprint, applied, rejected } = applyPatch(acme, { expression: { tone: { humor: 4 } } })

    expect(blueprint.expression.tone.humor).toBe(4)
    expect(blueprint.business).toEqual(acme.business)
    expect(rejected).toEqual([])
    expect(applied).toEqual([
      {
        path: "expression.tone.humor",
        label: "Humor",
        from: "Leans serious",
        to: "Leans playful",
        before: 2,
        after: 4,
      },
    ])
  })

  it("reports nothing for a value that is already there", () => {
    expect(applyPatch(acme, { expression: { tone: { humor: 2 } } }).applied).toEqual([])
  })

  it("rejects an invalid value with its rule, and still applies the valid ones", () => {
    const { blueprint, applied, rejected } = applyPatch(acme, {
      business: { audience: "small teams" },
      expression: { tone: { energy: 9 }, typography: { pairing: "comic-sans" } },
    })

    expect(blueprint.business.audience).toBe("small teams")
    expect(blueprint.expression.tone.energy).toBeNull()
    expect(applied.map((change) => change.path)).toEqual(["business.audience"])
    expect(rejected.map((item) => item.path)).toEqual([
      "expression.tone.energy",
      "expression.typography.pairing",
    ])
    expect(rejected[0].reason).toContain("1 to 5")
  })

  it("treats the palette as one field: all four colors or nothing", () => {
    const partial = applyPatch(acme, { expression: { color: { palette: { primary: "#c2410c" } } } })
    expect(partial.blueprint.expression.color.palette).toBeNull()
    expect(partial.rejected[0].path).toBe("expression.color.palette")

    const full = applyPatch(acme, {
      expression: { color: { palette: { primary: "#c2410c", secondary: "#7c2d12", accent: "#f59e0b", background: "#fff7ed" } } },
    })
    expect(full.applied[0].to).toBe("Warm and vivid (#c2410c)")

    const darker = applyPatch(full.blueprint, { expression: { color: { palette: { primary: "#7c2d12" } } } })
    expect(darker.rejected).toEqual([])
    expect(darker.blueprint.expression.color.palette?.primary).toBe("#7c2d12")
    expect(darker.blueprint.expression.color.palette?.accent).toBe("#f59e0b")
  })

  it("rejects a bad hex color instead of storing it", () => {
    const { blueprint, rejected } = applyPatch(acme, {
      expression: { color: { palette: { primary: "red", secondary: "#000000", accent: "#000000", background: "#ffffff" } } },
    })
    expect(blueprint.expression.color.palette).toBeNull()
    expect(rejected[0].reason).toContain("#rrggbb")
  })

  it("refuses a fourth trait and keeps the traits it had", () => {
    const { blueprint, applied, rejected } = applyPatch(acme, {
      expression: { personality: ["Bold", "Warm", "Calm", "Expert"] },
    })
    expect(blueprint.expression.personality).toEqual(["Bold"])
    expect(applied).toEqual([])
    expect(rejected[0].path).toBe("expression.personality")
  })

  it("never lets a rejected value destroy the value that was there", () => {
    const palette = { primary: "#c2410c", secondary: "#7c2d12", accent: "#f59e0b", background: "#fff7ed" }
    const colored = applyPatch(acme, { expression: { color: { palette } } }).blueprint

    const { blueprint, applied, rejected } = applyPatch(colored, {
      expression: { color: { palette: { primary: "sunset" } }, tone: { humor: 9 } },
    })
    expect(blueprint.expression.color.palette).toEqual(palette)
    expect(blueprint.expression.tone.humor).toBe(2)
    expect(applied).toEqual([])
    expect(rejected.map((item) => item.path)).toEqual(["expression.color.palette", "expression.tone.humor"])
  })

  it("rewords document text, and null restores the generated text", () => {
    const reworded = applyPatch(acme, { copy: { voice: { title: "How we talk" } } })
    expect(reworded.applied[0]).toMatchObject({ label: "Voice · Title", from: "—", to: "How we talk" })

    const restored = applyPatch(reworded.blueprint, { copy: { voice: null } })
    expect(restored.blueprint.copy).toEqual({})
    expect(restored.rejected).toEqual([])
  })

  it("clears a field with null", () => {
    const { blueprint, applied, rejected } = applyPatch(acme, {
      business: { offer: null },
      expression: { tone: { humor: null }, personality: null },
    })
    expect(blueprint.business.offer).toBe("")
    expect(blueprint.expression.tone.humor).toBeNull()
    expect(blueprint.expression.personality).toEqual([])
    expect(applied).toHaveLength(3)
    expect(rejected).toEqual([])
  })

  it("ignores fields that do not exist", () => {
    const { blueprint, applied, rejected } = applyPatch(acme, { business: { revenue: "1M" } })
    expect(blueprint).toEqual(acme)
    expect(applied).toEqual([])
    expect(rejected[0].path).toBe("business.revenue")
  })
})

describe("revertChanges", () => {
  it("undoes exactly the changes of one patch", () => {
    const first = applyPatch(acme, { expression: { tone: { humor: 4, formality: 5 } }, business: { audience: "small teams" } })
    const second = applyPatch(first.blueprint, { business: { goal: "grow in Europe" } })

    const undone = revertChanges(second.blueprint, first.applied)
    expect(undone.expression.tone).toEqual(acme.expression.tone)
    expect(undone.business.audience).toBe("")
    expect(undone.business.goal).toBe("grow in Europe")
  })
})

describe("patchSchema", () => {
  it("accepts a typical patch from the model", () => {
    const patch = {
      business: { industry: "Finance", audience: "small businesses" },
      expression: { tone: { formality: 4, humor: 2 }, personality: ["Trustworthy", "Down-to-earth"] },
    }
    expect(patchSchema.safeParse(patch).success).toBe(true)
    expect(applyPatch(emptyBlueprint(), patch).rejected).toEqual([])
  })

  it("refuses values outside the Blueprint's lists", () => {
    expect(patchSchema.safeParse({ expression: { personality: ["Invented"] } }).success).toBe(false)
    expect(patchSchema.safeParse({ expression: { tone: { humor: 7 } } }).success).toBe(false)
  })
})

describe("patchFromToolInput", () => {
  // What the model really sends for "more playful": a value for one field, null for all the rest.
  const morePlayful = {
    business: { name: null, industry: null, offer: null, audience: null, goal: null, comparables: null, differentiator: null },
    expression: {
      personality: null,
      tone: { formality: null, humor: 4, attitude: null, energy: null },
      visual: { density: null, era: null },
      color: { palette: null },
      typography: { pairing: null },
    },
    copy: { hero: null, voice: null },
    clear: null,
  }

  it("reads null as 'leave alone', so a small request cannot wipe the Blueprint", () => {
    expect(patchSchema.safeParse(morePlayful).success).toBe(true)
    expect(patchFromToolInput(morePlayful)).toEqual({ expression: { tone: { humor: 4 } } })

    const { blueprint, applied } = applyPatch(acme, patchFromToolInput(morePlayful))
    expect(applied.map((change) => change.path)).toEqual(["expression.tone.humor"])
    expect(blueprint.business).toEqual(acme.business)
    expect(blueprint.expression.personality).toEqual(["Bold"])
  })

  it("clears only the fields named in `clear`", () => {
    const patch = patchFromToolInput({ clear: ["business.offer", "copy.voice.title"] })
    expect(patch).toEqual({ business: { offer: null }, copy: { voice: { title: null } } })

    const reworded = applyPatch(acme, { copy: { voice: { title: "How we talk", body: "Like this." } } }).blueprint
    const { blueprint, applied } = applyPatch(reworded, patch)
    expect(blueprint.business.offer).toBe("")
    expect(blueprint.copy).toEqual({ voice: { body: "Like this." } })
    expect(applied).toHaveLength(2)
  })

  it("refuses to clear a path that is not a field", () => {
    expect(patchSchema.safeParse({ clear: ["business.revenue"] }).success).toBe(false)
  })
})

import { describe, expect, it } from "vitest"

import {
  validateBrandExpression,
  validateBrandExpressionShape,
  validateBusinessContext,
  validateBusinessContextShape,
  validateSection,
} from "./blueprint-validation"
import type { BrandExpression, BusinessContext } from "@/services/blueprint.types"

const validBusinessContext = {
  industry: "Artisan coffee roasting",
  audience: "Independent cafés in Dublin",
  competitors: ["Roast Co", "Bean & Co"],
  differentiators: "Single-origin sourcing with same-week roasting",
}

const validBrandExpression = {
  visualStyle: "Warm minimalist",
  colorDirection: "Terracotta and cream",
  typographyDirection: "Humanist sans with a serif accent",
  toneOfVoice: "Direct and generous",
  personality: ["Grounded", "Curious"],
}

describe("validateBusinessContext", () => {
  it("accepts a fully valid object", () => {
    expect(validateBusinessContext(validBusinessContext)).toEqual({ valid: true })
  })

  it("rejects a missing required field", () => {
    const incomplete: Partial<BusinessContext> = { ...validBusinessContext }
    delete incomplete.audience
    const result = validateBusinessContext(incomplete)

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors).toContain("audience must be a non-empty string")
  })

  it("rejects an empty-string required field", () => {
    const result = validateBusinessContext({ ...validBusinessContext, industry: "" })

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors).toContain("industry must be a non-empty string")
  })

  it("rejects the wrong type for competitors", () => {
    const result = validateBusinessContext({ ...validBusinessContext, competitors: "Roast Co" })

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors[0]).toMatch(/competitors must be an array of strings/)
  })

  it("rejects competitors exceeding the max item count", () => {
    const result = validateBusinessContext({
      ...validBusinessContext,
      competitors: Array.from({ length: 21 }, (_, i) => `Competitor ${i}`),
    })

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors[0]).toMatch(/max 20/)
  })
})

describe("validateBrandExpression", () => {
  it("accepts a fully valid object", () => {
    expect(validateBrandExpression(validBrandExpression)).toEqual({ valid: true })
  })

  it("rejects a missing required field", () => {
    const incomplete: Partial<BrandExpression> = { ...validBrandExpression }
    delete incomplete.toneOfVoice
    const result = validateBrandExpression(incomplete)

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors).toContain("toneOfVoice must be a non-empty string")
  })

  it("rejects an empty-string required field", () => {
    const result = validateBrandExpression({ ...validBrandExpression, toneOfVoice: "" })

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors).toContain("toneOfVoice must be a non-empty string")
  })

  it("rejects the wrong type for personality", () => {
    const result = validateBrandExpression({ ...validBrandExpression, personality: "Grounded" })

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors[0]).toMatch(/personality must be an array of strings/)
  })

  it("rejects personality exceeding the max item count", () => {
    const result = validateBrandExpression({
      ...validBrandExpression,
      personality: Array.from({ length: 21 }, (_, i) => `Trait ${i}`),
    })

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors[0]).toMatch(/max 20/)
  })
})

describe("validateBusinessContextShape", () => {
  it("accepts a fully valid object", () => {
    expect(validateBusinessContextShape(validBusinessContext)).toEqual({ valid: true })
  })

  it("accepts an all-empty object", () => {
    const empty = { industry: "", audience: "", competitors: [], differentiators: "" }
    expect(validateBusinessContextShape(empty)).toEqual({ valid: true })
  })

  it("accepts a partially-filled object", () => {
    const partial = { industry: "Artisan coffee roasting", audience: "", competitors: [], differentiators: "" }
    expect(validateBusinessContextShape(partial)).toEqual({ valid: true })
  })

  it("rejects a missing key", () => {
    const incomplete: Partial<BusinessContext> = { ...validBusinessContext }
    delete incomplete.audience
    const result = validateBusinessContextShape(incomplete)

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors).toContain("audience must be a string")
  })

  it("rejects the wrong type for competitors", () => {
    const result = validateBusinessContextShape({ ...validBusinessContext, competitors: "Roast Co" })

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors[0]).toMatch(/competitors must be an array of strings/)
  })

  it("rejects the wrong type for industry", () => {
    const result = validateBusinessContextShape({ ...validBusinessContext, industry: 123 })

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors).toContain("industry must be a string")
  })

  it("rejects over-length text", () => {
    const result = validateBusinessContextShape({ ...validBusinessContext, industry: "a".repeat(2001) })

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors).toContain("industry must be a string")
  })

  it("rejects competitors exceeding the max item count", () => {
    const result = validateBusinessContextShape({
      ...validBusinessContext,
      competitors: Array.from({ length: 21 }, (_, i) => `Competitor ${i}`),
    })

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors[0]).toMatch(/max 20/)
  })

  it("rejects a non-object", () => {
    expect(validateBusinessContextShape(null).valid).toBe(false)
    expect(validateBusinessContextShape("not an object").valid).toBe(false)
  })
})

describe("validateBrandExpressionShape", () => {
  it("accepts a fully valid object", () => {
    expect(validateBrandExpressionShape(validBrandExpression)).toEqual({ valid: true })
  })

  it("accepts an all-empty object", () => {
    const empty = {
      visualStyle: "",
      colorDirection: "",
      typographyDirection: "",
      toneOfVoice: "",
      personality: [],
    }
    expect(validateBrandExpressionShape(empty)).toEqual({ valid: true })
  })

  it("accepts a partially-filled object", () => {
    const partial = {
      visualStyle: "Warm minimalist",
      colorDirection: "",
      typographyDirection: "",
      toneOfVoice: "",
      personality: [],
    }
    expect(validateBrandExpressionShape(partial)).toEqual({ valid: true })
  })

  it("rejects a missing key", () => {
    const incomplete: Partial<BrandExpression> = { ...validBrandExpression }
    delete incomplete.toneOfVoice
    const result = validateBrandExpressionShape(incomplete)

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors).toContain("toneOfVoice must be a string")
  })

  it("rejects the wrong type for personality", () => {
    const result = validateBrandExpressionShape({ ...validBrandExpression, personality: "Grounded" })

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors[0]).toMatch(/personality must be an array of strings/)
  })

  it("rejects over-length text", () => {
    const result = validateBrandExpressionShape({
      ...validBrandExpression,
      toneOfVoice: "a".repeat(2001),
    })

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors).toContain("toneOfVoice must be a string")
  })

  it("rejects personality exceeding the max item count", () => {
    const result = validateBrandExpressionShape({
      ...validBrandExpression,
      personality: Array.from({ length: 21 }, (_, i) => `Trait ${i}`),
    })

    expect(result.valid).toBe(false)
    expect((result as { errors: string[] }).errors[0]).toMatch(/max 20/)
  })

  it("rejects a non-object", () => {
    expect(validateBrandExpressionShape(null).valid).toBe(false)
    expect(validateBrandExpressionShape("not an object").valid).toBe(false)
  })
})

describe("validateSection", () => {
  it("delegates businessContext to validateBusinessContext", () => {
    expect(validateSection("businessContext", validBusinessContext)).toEqual(
      validateBusinessContext(validBusinessContext),
    )
    expect(validateSection("businessContext", { ...validBusinessContext, industry: "" }).valid).toBe(false)
  })

  it("delegates brandExpression to validateBrandExpression", () => {
    expect(validateSection("brandExpression", validBrandExpression)).toEqual(
      validateBrandExpression(validBrandExpression),
    )
    expect(validateSection("brandExpression", { ...validBrandExpression, toneOfVoice: "" }).valid).toBe(false)
  })
})

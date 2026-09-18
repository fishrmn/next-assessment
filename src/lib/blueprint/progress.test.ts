import { describe, expect, it } from "vitest"

import {
  ALL_FIELDS,
  DOCUMENT_SECTIONS,
  emptyBrandExpression,
  emptyBusinessContext,
  type BlueprintValues,
} from "@/lib/blueprint/field-config"

import { computeProgress, countSectionFields, firstUnfilledField } from "./progress"

function emptyValues(): BlueprintValues {
  return {
    businessContext: { ...emptyBusinessContext },
    brandExpression: { ...emptyBrandExpression },
  }
}

function filledValues(): BlueprintValues {
  return {
    businessContext: {
      industry: "Logistics technology",
      audience: "Fleet operators",
      competitors: ["Acme", "Globex"],
      differentiators: "Real-time tracking",
    },
    brandExpression: {
      visualStyle: "Modern",
      colorDirection: "Blue and white",
      typographyDirection: "Sans-serif",
      toneOfVoice: "Direct and warm",
      personality: ["Bold", "Warm"],
    },
  }
}

describe("computeProgress", () => {
  it("reports zero filled and zero pct for an all-empty BlueprintValues", () => {
    expect(computeProgress(emptyValues())).toEqual({ filled: 0, total: 9, pct: 0 })
  })

  it("reports all filled and 100 pct for a fully-filled BlueprintValues", () => {
    expect(computeProgress(filledValues())).toEqual({ filled: 9, total: 9, pct: 100 })
  })

  it("treats whitespace-only text as unfilled", () => {
    const values = emptyValues()
    values.businessContext.industry = "   "

    expect(computeProgress(values).filled).toBe(0)
  })

  it("treats an empty chip array as unfilled and a non-empty one as filled", () => {
    const values = emptyValues()
    expect(computeProgress(values).filled).toBe(0)

    values.businessContext.competitors = ["x"]
    expect(computeProgress(values).filled).toBe(1)
  })

  it("rounds pct (1 of 9 filled -> 11)", () => {
    const values = emptyValues()
    values.businessContext.industry = "Logistics technology"

    expect(computeProgress(values)).toEqual({ filled: 1, total: 9, pct: 11 })
  })

  it("has a total matching ALL_FIELDS length", () => {
    expect(computeProgress(emptyValues()).total).toBe(ALL_FIELDS.length)
  })
})

describe("countSectionFields", () => {
  it("counts filled/total per section", () => {
    const values = emptyValues()
    values.businessContext.industry = "Logistics technology"
    values.businessContext.audience = "Fleet operators"

    const [businessContext] = DOCUMENT_SECTIONS

    expect(countSectionFields(values, businessContext)).toEqual({ filled: 2, total: 4 })
  })

  it("counts zero filled for an empty section", () => {
    const [businessContext] = DOCUMENT_SECTIONS

    expect(countSectionFields(emptyValues(), businessContext)).toEqual({ filled: 0, total: 4 })
  })

  it("counts all filled for a fully-filled section", () => {
    const [businessContext] = DOCUMENT_SECTIONS

    expect(countSectionFields(filledValues(), businessContext)).toEqual({ filled: 4, total: 4 })
  })
})

describe("firstUnfilledField", () => {
  it("returns the first gap in the section", () => {
    const values = emptyValues()
    values.businessContext.industry = "Logistics technology"

    const [businessContext] = DOCUMENT_SECTIONS

    expect(firstUnfilledField(values, businessContext).key).toBe("audience")
  })

  it("falls back to the section's first field when everything is filled", () => {
    const [businessContext] = DOCUMENT_SECTIONS

    expect(firstUnfilledField(filledValues(), businessContext).key).toBe("industry")
  })
})

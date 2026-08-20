import { describe, expect, it } from "vitest"

import { validateBrandProfile, validateDirections } from "./brand-validate"

const validProfile = {
  salonName: "Maison Belle",
  services: ["Cuts", "Color", "Bridal"],
  idealClients: "Busy professionals who want a premium experience",
  vibeWords: ["modern", "premium", "feminine"],
  personality: { modernClassic: "modern", luxuryApproachable: "luxury" },
  palette: {
    primary: "#b3854d",
    secondary: "#f5eee6",
    accent: "#2e211b",
    background: "#faf7f0",
  },
  paletteReasoning: "Warm golds echo the logo's metallic accents.",
}

const validDirection = (id: string, baseTemplateId = "elegance") => ({
  id,
  name: "Luxury Spa",
  baseTemplateId,
  visualDescription: "Ivory and gold, airy spacing",
  layoutApproach: "Centered hero, plans, testimonial",
  typography: "High-contrast serif headings",
  colorUsage: "Gold CTAs on ivory backgrounds",
  heroConcept: "Side image of a calm treatment room",
})

describe("validateBrandProfile", () => {
  it("accepts a complete profile", () => {
    expect(validateBrandProfile(validProfile)).toEqual({ ok: true })
  })

  it("accepts contact fields and rejects non-string ones", () => {
    expect(
      validateBrandProfile({
        ...validProfile,
        phone: "+1 555 0100",
        email: "hello@maisonbelle.test",
        address: "12 Rue Belle, Old Town",
      })
    ).toEqual({ ok: true })
    expect(validateBrandProfile({ ...validProfile, phone: 5550100 }).ok).toBe(false)
  })

  it("accepts a profile without optional fields", () => {
    const { idealClients: _i, ...rest } = validProfile
    void _i
    expect(validateBrandProfile(rest)).toEqual({ ok: true })
  })

  it("rejects missing salon name and empty services", () => {
    expect(validateBrandProfile({ ...validProfile, salonName: " " }).ok).toBe(false)
    expect(validateBrandProfile({ ...validProfile, services: [] }).ok).toBe(false)
  })

  it("rejects bad personality values", () => {
    const result = validateBrandProfile({
      ...validProfile,
      personality: { modernClassic: "futuristic", luxuryApproachable: "luxury" },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain("modernClassic")
  })

  it("rejects non-hex palette colors", () => {
    const result = validateBrandProfile({
      ...validProfile,
      palette: { ...validProfile.palette, accent: "gold" },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain("palette.accent")
  })

  it("rejects non-objects", () => {
    expect(validateBrandProfile(null).ok).toBe(false)
    expect(validateBrandProfile("profile").ok).toBe(false)
  })
})

describe("validateDirections", () => {
  it("accepts exactly three valid directions", () => {
    expect(
      validateDirections([
        validDirection("a"),
        validDirection("b", "moderna"),
        validDirection("c", "lush"),
      ])
    ).toEqual({ ok: true })
  })

  it("rejects fewer or more than three", () => {
    expect(validateDirections([validDirection("a")]).ok).toBe(false)
    expect(
      validateDirections([
        validDirection("a"),
        validDirection("b"),
        validDirection("c"),
        validDirection("d"),
      ]).ok
    ).toBe(false)
  })

  it("rejects unknown base templates", () => {
    const result = validateDirections([
      validDirection("a"),
      validDirection("b"),
      validDirection("c", "minimalist"),
    ])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain("baseTemplateId")
  })

  it("rejects duplicate ids and missing fields", () => {
    expect(
      validateDirections([
        validDirection("a"),
        validDirection("a"),
        validDirection("c"),
      ]).ok
    ).toBe(false)
    expect(
      validateDirections([
        validDirection("a"),
        validDirection("b"),
        { ...validDirection("c"), heroConcept: "" },
      ]).ok
    ).toBe(false)
  })
})

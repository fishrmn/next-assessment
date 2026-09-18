import { describe, expect, it } from "vitest"

import { deriveTypeSpecimen } from "./type-specimen"

describe("deriveTypeSpecimen", () => {
  it("classifies monospace/technical/code as Monospace", () => {
    expect(deriveTypeSpecimen("technical monospace code")).toEqual({
      label: "Monospace — technical, exact",
      stack: "'IBM Plex Mono', ui-monospace, monospace",
    })
  })

  it("classifies sans/geometric/clean/grotesk as Sans-serif", () => {
    expect(deriveTypeSpecimen("a geometric grotesk")).toEqual({
      label: "Sans-serif — clear, contemporary",
      stack: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    })
  })

  it("classifies slab as Slab serif", () => {
    expect(deriveTypeSpecimen("a slab typeface")).toEqual({
      label: "Slab serif — sturdy, editorial",
      stack: "'Rockwell', Georgia, serif",
    })
  })

  it("classifies serif/classic/editorial/book as Serif", () => {
    expect(deriveTypeSpecimen("classic editorial book")).toEqual({
      label: "Serif — considered, literary",
      stack: "'Lora', Georgia, serif",
    })
  })

  it("falls back to the house serif when nothing matches", () => {
    expect(deriveTypeSpecimen("")).toEqual({
      label: "Not specified — showing the house serif",
      stack: "var(--font-heading)",
    })
  })

  it("resolves 'clean sans-serif' to Sans-serif, not Serif (ordering trap)", () => {
    expect(deriveTypeSpecimen("clean sans-serif")).toEqual({
      label: "Sans-serif — clear, contemporary",
      stack: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    })
  })

  it("handles null/undefined input without throwing", () => {
    expect(() =>
      deriveTypeSpecimen(undefined as unknown as string)
    ).not.toThrow()
    expect(deriveTypeSpecimen(null as unknown as string).label).toBe(
      "Not specified — showing the house serif"
    )
  })
})

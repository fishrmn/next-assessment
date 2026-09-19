import { describe, expect, it } from "vitest"

import { derivePalette } from "./palette"

describe("derivePalette", () => {
  it("matches named colors in COLORS key order and appends ground + ink", () => {
    const { swatches } = derivePalette("navy and terracotta")

    expect(swatches.map((s) => s.hex)).toEqual([
      "#1f2f4d",
      "#b25c41",
      "#f3f2f2",
      "#201f1d",
    ])
  })

  it("dedupes grey/gray by shared hex", () => {
    const { swatches } = derivePalette("a grey and gray direction")

    const hexes = swatches.map((s) => s.hex)
    expect(hexes.filter((hex) => hex === "#8d8b86")).toHaveLength(1)
  })

  it("caps swatches at 6 even with many matches", () => {
    const { swatches } = derivePalette(
      "blue navy teal green sage olive gold amber orange"
    )

    expect(swatches).toHaveLength(6)
  })

  it("falls back to the house palette when nothing matches", () => {
    const { swatches, note } = derivePalette("")

    expect(swatches).toEqual([
      { name: "accent", hex: "#b68235" },
      { name: "ground", hex: "#f3f2f2" },
      { name: "ink", hex: "#201f1d" },
    ])
    expect(note).toBe("No colors named yet — showing the house palette.")
  })

  it("handles null/undefined input without throwing", () => {
    expect(() => derivePalette(undefined as unknown as string)).not.toThrow()
    expect(derivePalette(null as unknown as string).note).toBe(
      "No colors named yet — showing the house palette."
    )
  })

  it("uses the matched note when a color is found", () => {
    const { note } = derivePalette("terracotta")

    expect(note).toBe("Read from your color direction.")
  })
})

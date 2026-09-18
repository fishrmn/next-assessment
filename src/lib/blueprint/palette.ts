export type Swatch = { name: string; hex: string }
export type Palette = { swatches: Swatch[]; note: string }

const COLORS: Record<string, string> = {
  blue: "#3b5b8c",
  navy: "#1f2f4d",
  teal: "#2f6f6a",
  green: "#4a7a5c",
  sage: "#8a9a82",
  olive: "#6d7043",
  gold: "#b68235",
  amber: "#c08a2e",
  orange: "#c26a34",
  terracotta: "#b25c41",
  red: "#9c3a33",
  crimson: "#8f2d35",
  burgundy: "#6b2230",
  pink: "#c98a94",
  purple: "#6a4a7a",
  violet: "#5b4b8a",
  lavender: "#a49ac4",
  brown: "#6b4f3a",
  tan: "#c3a77f",
  cream: "#f0e7d6",
  grey: "#8d8b86",
  gray: "#8d8b86",
  charcoal: "#33322f",
  black: "#201f1d",
  white: "#faf9f7",
  yellow: "#d6b04a",
  mint: "#9ec9ae",
  turquoise: "#3c9a94",
  coral: "#d4715f",
  ivory: "#f5efe2",
}

const GROUND: Swatch = { name: "ground", hex: "#f3f2f2" }
const INK: Swatch = { name: "ink", hex: "#201f1d" }

export function derivePalette(colorDirection: string): Palette {
  const text = (colorDirection || "").toLowerCase()

  const swatches: Swatch[] = []
  const seenHex = new Set<string>()
  for (const [name, hex] of Object.entries(COLORS)) {
    if (text.includes(name) && !seenHex.has(hex)) {
      swatches.push({ name, hex })
      seenHex.add(hex)
    }
  }

  if (swatches.length === 0) {
    return {
      swatches: [{ name: "accent", hex: "#b68235" }, GROUND, INK],
      note: "No colors named yet — showing the house palette.",
    }
  }

  return {
    swatches: [...swatches, GROUND, INK].slice(0, 6),
    note: "Read from your color direction.",
  }
}

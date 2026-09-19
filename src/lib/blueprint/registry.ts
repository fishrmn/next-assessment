/**
 * The field registry: everything the app knows ABOUT the Blueprint's fields.
 *
 * The model (`model.ts`) says what is stored. This file says what each scale's two
 * poles are called and which example sentence stands for each pole, which fonts and
 * starting palettes exist, and how stored values read in words. The Blueprint document
 * and the agent's instructions both read from here, so a field is described in one place.
 *
 * Data only, no React: it must stay usable from server code and prompts.
 */
import type { Blueprint, FontPairing, Palette, ScaleValue } from "./model"

/* -------------------------------------------------------------------------- */
/* Scales                                                                     */
/* -------------------------------------------------------------------------- */

export type ScaleId =
  | "formality"
  | "humor"
  | "attitude"
  | "energy"
  | "density"
  | "era"

type Pole = {
  /** Adjective used in the document: "Formal". */
  label: string
  /** A sentence written at this pole. It teaches the agent what the pole sounds like. */
  example?: (brand: string) => string
}

export type ScaleField = {
  id: ScaleId
  group: "tone" | "visual"
  left: Pole
  right: Pole
}

export const SCALES: ScaleField[] = [
  {
    id: "formality",
    group: "tone",
    left: {
      label: "Formal",
      example: (brand) =>
        `${brand} provides dependable solutions, tailored to the needs of your organization.`,
    },
    right: {
      label: "Casual",
      example: (brand) => `Hey, we're ${brand}. Whatever you need, we've got you.`,
    },
  },
  {
    id: "humor",
    group: "tone",
    left: {
      label: "Serious",
      example: () =>
        "Getting this right matters. Here is exactly how we do it, step by step.",
    },
    right: {
      label: "Playful",
      example: () =>
        "Nobody dreams about this stuff. So we made it quick. Almost fun. Almost.",
    },
  },
  {
    id: "attitude",
    group: "tone",
    left: {
      label: "Respectful",
      example: () =>
        "There are many good options out there. We would be glad to show you ours.",
    },
    right: {
      label: "Irreverent",
      example: () => "Still doing it the old way? Bold choice. We retired that years ago.",
    },
  },
  {
    id: "energy",
    group: "tone",
    left: {
      label: "Matter-of-fact",
      example: () => "New this week: faster setup. It takes four minutes now.",
    },
    right: {
      label: "Enthusiastic",
      example: () => "It's here! Setup is SO much faster now, and you are going to love it!",
    },
  },
  {
    id: "density",
    group: "visual",
    left: { label: "Minimal" },
    right: { label: "Bold" },
  },
  {
    id: "era",
    group: "visual",
    left: { label: "Classic" },
    right: { label: "Modern" },
  },
]

export function scaleField(id: ScaleId): ScaleField {
  return SCALES.find((field) => field.id === id)!
}

export function readScale(blueprint: Blueprint, id: ScaleId): ScaleValue {
  const { tone, visual } = blueprint.expression
  return id === "density" || id === "era" ? visual[id] : tone[id]
}

/** A scale position in words: "Very casual", "Leans formal", "Balanced". Null when unanswered. */
export function describeScale(field: ScaleField, value: ScaleValue): string | null {
  if (value === null) return null
  if (value === 3) return `Between ${field.left.label.toLowerCase()} and ${field.right.label.toLowerCase()}`
  const pole = value < 3 ? field.left : field.right
  return value === 1 || value === 5 ? `Very ${pole.label.toLowerCase()}` : `Leans ${pole.label.toLowerCase()}`
}

/**
 * One sample line in the brand's voice, chosen by formality and humor (the two
 * scales that change a sentence the most). Null until one of them is answered.
 */
export function voiceSample(blueprint: Blueprint): string | null {
  const { formality, humor } = blueprint.expression.tone
  if (formality === null && humor === null) return null
  const brand = blueprint.business.name || "We"
  const offer = blueprint.business.offer || "do the hard part"
  const casual = (formality ?? 3) > 3
  const formal = (formality ?? 3) < 3
  const playful = (humor ?? 3) > 3
  const serious = (humor ?? 3) < 3

  if (casual && playful) return `${brand} here. We ${offer}, you take the credit. Deal?`
  if (casual && serious) return `We're ${brand}. We ${offer}, and we take it seriously so you don't have to.`
  if (casual) return `Hi, we're ${brand}. We ${offer}. That's pretty much it.`
  if (formal && playful) return `${brand}: we ${offer}. Impeccably. (We do allow ourselves one joke a quarter.)`
  if (formal && serious) return `${brand} will ${offer} with the rigor your organization expects.`
  if (formal) return `${brand} is pleased to ${offer} on behalf of its clients.`
  if (playful) return `${brand}: we ${offer}, and we have more fun doing it than we probably should.`
  if (serious) return `${brand}: we ${offer}. Carefully, every time.`
  return `${brand}: we ${offer}.`
}

/* -------------------------------------------------------------------------- */
/* Color                                                                      */
/* -------------------------------------------------------------------------- */

export type PalettePreset = { id: string; name: string; palette: Palette }

/** Starting points the agent can offer. Any four valid hex colors are accepted, not only these. */
export const PALETTES: PalettePreset[] = [
  { id: "ember", name: "Ember", palette: { primary: "#c2410c", secondary: "#7c2d12", accent: "#f59e0b", background: "#fff7ed" } },
  { id: "clay", name: "Clay", palette: { primary: "#9a6a4f", secondary: "#5c4033", accent: "#d4a373", background: "#faf5ef" } },
  { id: "blossom", name: "Blossom", palette: { primary: "#be4b7a", secondary: "#6d2e46", accent: "#f4a6c0", background: "#fff5f8" } },
  { id: "forest", name: "Forest", palette: { primary: "#2f5d46", secondary: "#1b3a2b", accent: "#a3b18a", background: "#f4f7f1" } },
  { id: "ink", name: "Ink", palette: { primary: "#18181b", secondary: "#52525b", accent: "#a1a1aa", background: "#fafafa" } },
  { id: "ocean", name: "Ocean", palette: { primary: "#1d4ed8", secondary: "#1e3a8a", accent: "#38bdf8", background: "#f0f7ff" } },
  { id: "fjord", name: "Fjord", palette: { primary: "#47607a", secondary: "#2b3a4a", accent: "#9db4c8", background: "#f3f6f9" } },
  { id: "electric", name: "Electric", palette: { primary: "#6d28d9", secondary: "#2e1065", accent: "#22d3ee", background: "#f7f3ff" } },
]

/** Hue (0-360) and saturation (0-1) of a #rrggbb color. */
function hueAndSaturation(hex: string): { hue: number; saturation: number } {
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  if (delta === 0) return { hue: 0, saturation: 0 }
  const lightness = (max + min) / 2
  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  const sector = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4
  return { hue: (sector * 60 + 360) % 360, saturation }
}

/**
 * The color direction in words ("Warm and vivid"), read off the primary color. It is computed,
 * never stored: whoever picks the colors (a person or the agent) cannot contradict them.
 */
export function describeColor(palette: Palette | null): string | null {
  if (!palette) return null
  const { hue, saturation } = hueAndSaturation(palette.primary)
  const vibrancy = saturation < 0.3 ? "muted" : saturation < 0.6 ? "balanced" : "vivid"
  if (saturation < 0.12) return `Neutral and ${vibrancy}`
  const temperature = hue < 75 || hue >= 300 ? "Warm" : hue >= 150 && hue < 270 ? "Cool" : "Fresh"
  return `${temperature} and ${vibrancy}`
}

/** Black or white, whichever reads better on the given hex background. */
export function readableOn(hex: string): "#ffffff" | "#0a0a0a" {
  const channel = (start: number) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
  return luminance > 0.4 ? "#0a0a0a" : "#ffffff"
}

/* -------------------------------------------------------------------------- */
/* Typography                                                                 */
/* -------------------------------------------------------------------------- */

export type FontPairingInfo = {
  id: FontPairing
  name: string
  description: string
  /** CSS font-family values. The variables are defined in `src/lib/fonts.ts`. */
  heading: string
  body: string
}

export const FONTS: FontPairingInfo[] = [
  { id: "modern", name: "Modern", description: "Clean, neutral, gets out of the way", heading: "var(--font-sans)", body: "var(--font-sans)" },
  { id: "editorial", name: "Editorial", description: "High-contrast serif headlines", heading: "var(--font-playfair)", body: "var(--font-sans)" },
  { id: "friendly", name: "Friendly", description: "Rounded and approachable", heading: "var(--font-nunito)", body: "var(--font-nunito)" },
  { id: "technical", name: "Technical", description: "Geometric, precise, engineered", heading: "var(--font-grotesk)", body: "var(--font-sans)" },
  { id: "classic", name: "Classic", description: "Bookish serif, warm and established", heading: "var(--font-lora)", body: "var(--font-lora)" },
]

export function fontInfo(id: FontPairing | null): FontPairingInfo | null {
  return FONTS.find((font) => font.id === id) ?? null
}

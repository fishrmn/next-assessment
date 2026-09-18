/**
 * The field registry: everything the app knows ABOUT the Blueprint's fields.
 *
 * The model (`model.ts`) says what is stored. This file says how each field is
 * asked, what its two poles are called, and which concrete example stands for
 * each pole. The intake form, the Blueprint document and (Phase 2) the AI
 * prompt all read from here, so a field is described in exactly one place.
 *
 * Data only, no React: it must stay usable from server code and prompts.
 */
import type { Blueprint, FontPairing, Palette, Scale, ScaleValue } from "./model"

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
  /** Example copy for this pole. Visual scales use a drawn sketch instead. */
  example?: (brand: string) => string
}

export type ScaleField = {
  id: ScaleId
  group: "tone" | "visual"
  question: (brand: string) => string
  left: Pole
  right: Pole
}

export const SCALES: ScaleField[] = [
  {
    id: "formality",
    group: "tone",
    question: (brand) => `Which sounds more like ${brand}?`,
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
    question: (brand) => `How does ${brand} handle a boring topic?`,
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
    question: (brand) => `How does ${brand} talk about the old way of doing things?`,
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
    question: (brand) => `${brand} just shipped something new. How do you announce it?`,
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
    question: (brand) => `Which page feels more like ${brand}?`,
    left: { label: "Minimal" },
    right: { label: "Bold" },
  },
  {
    id: "era",
    group: "visual",
    question: (brand) => `Which style feels more like ${brand}?`,
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

export function writeScale(blueprint: Blueprint, id: ScaleId, value: Scale): Blueprint {
  const expression = blueprint.expression
  return id === "density" || id === "era"
    ? { ...blueprint, expression: { ...expression, visual: { ...expression.visual, [id]: value } } }
    : { ...blueprint, expression: { ...expression, tone: { ...expression.tone, [id]: value } } }
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

export type PalettePreset = {
  id: string
  name: string
  temperature: Scale
  vibrancy: Scale
  palette: Palette
}

/**
 * Picking a preset writes the palette AND its direction (temperature, vibrancy)
 * in one move, so during intake the two can never disagree.
 */
export const PALETTES: PalettePreset[] = [
  { id: "ember", name: "Ember", temperature: 5, vibrancy: 5, palette: { primary: "#c2410c", secondary: "#7c2d12", accent: "#f59e0b", background: "#fff7ed" } },
  { id: "clay", name: "Clay", temperature: 4, vibrancy: 2, palette: { primary: "#9a6a4f", secondary: "#5c4033", accent: "#d4a373", background: "#faf5ef" } },
  { id: "blossom", name: "Blossom", temperature: 4, vibrancy: 3, palette: { primary: "#be4b7a", secondary: "#6d2e46", accent: "#f4a6c0", background: "#fff5f8" } },
  { id: "forest", name: "Forest", temperature: 3, vibrancy: 2, palette: { primary: "#2f5d46", secondary: "#1b3a2b", accent: "#a3b18a", background: "#f4f7f1" } },
  { id: "ink", name: "Ink", temperature: 3, vibrancy: 1, palette: { primary: "#18181b", secondary: "#52525b", accent: "#a1a1aa", background: "#fafafa" } },
  { id: "ocean", name: "Ocean", temperature: 1, vibrancy: 4, palette: { primary: "#1d4ed8", secondary: "#1e3a8a", accent: "#38bdf8", background: "#f0f7ff" } },
  { id: "fjord", name: "Fjord", temperature: 2, vibrancy: 2, palette: { primary: "#47607a", secondary: "#2b3a4a", accent: "#9db4c8", background: "#f3f6f9" } },
  { id: "electric", name: "Electric", temperature: 2, vibrancy: 5, palette: { primary: "#6d28d9", secondary: "#2e1065", accent: "#22d3ee", background: "#f7f3ff" } },
]

export function matchingPreset(palette: Palette | null): PalettePreset | null {
  if (!palette) return null
  return PALETTES.find((preset) => preset.palette.primary === palette.primary && preset.palette.accent === palette.accent) ?? null
}

const TEMPERATURE = ["Cool", "Cool-leaning", "Neutral", "Warm-leaning", "Warm"]
const VIBRANCY = ["muted", "soft", "balanced", "lively", "vivid"]

export function describeColor(color: Blueprint["expression"]["color"]): string | null {
  if (color.temperature === null || color.vibrancy === null) return null
  return `${TEMPERATURE[color.temperature - 1]} and ${VIBRANCY[color.vibrancy - 1]}`
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

/* -------------------------------------------------------------------------- */
/* Intake flow                                                                */
/* -------------------------------------------------------------------------- */

export type QuestionId = "basics" | "personality" | ScaleId | "color" | "typography"

export type Section = {
  id: string
  title: string
  layer: "Business context" | "Brand expression"
  questions: QuestionId[]
}

/** The intake, in order. One question shows at a time; sections group them in the sidebar. */
export const SECTIONS: Section[] = [
  { id: "basics", title: "Basics", layer: "Business context", questions: ["basics"] },
  { id: "personality", title: "Personality", layer: "Brand expression", questions: ["personality"] },
  { id: "voice", title: "Voice", layer: "Brand expression", questions: ["formality", "humor", "attitude", "energy"] },
  { id: "look", title: "Look", layer: "Brand expression", questions: ["density", "era"] },
  { id: "color", title: "Color", layer: "Brand expression", questions: ["color"] },
  { id: "type", title: "Typography", layer: "Brand expression", questions: ["typography"] },
]

export const QUESTIONS: QuestionId[] = SECTIONS.flatMap((section) => section.questions)

export function sectionOf(question: QuestionId): Section {
  return SECTIONS.find((section) => section.questions.includes(question))!
}

export function isQuestionId(value: string | null): value is QuestionId {
  return QUESTIONS.includes(value as QuestionId)
}

export function isAnswered(blueprint: Blueprint, question: QuestionId): boolean {
  const { business, expression } = blueprint
  switch (question) {
    case "basics":
      return Boolean(business.name && business.offer && business.audience)
    case "personality":
      return expression.personality.length > 0
    case "color":
      return expression.color.palette !== null
    case "typography":
      return expression.typography.pairing !== null
    default:
      return readScale(blueprint, question) !== null
  }
}

export type SectionStatus = "empty" | "partial" | "done"

export function sectionStatus(blueprint: Blueprint, section: Section): SectionStatus {
  const answered = section.questions.filter((question) => isAnswered(blueprint, question)).length
  if (answered === 0) return "empty"
  return answered === section.questions.length ? "done" : "partial"
}

/** Share of questions answered, 0 to 100. */
export function completion(blueprint: Blueprint): number {
  const answered = QUESTIONS.filter((question) => isAnswered(blueprint, question)).length
  return Math.round((answered / QUESTIONS.length) * 100)
}

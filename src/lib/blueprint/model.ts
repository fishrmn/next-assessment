/**
 * The Brand Blueprint model.
 *
 * One plain JSON object holds everything a client told us. It is the single
 * contract between the agent (patches it), the Blueprint document (renders it)
 * and the database (stores it).
 *
 * Two rules keep it simple:
 * - It stores inputs only. Labels, sample copy and completion are derived.
 * - Every field has an "unanswered" value, so an empty Blueprint is valid and
 *   the document can render from the first second.
 */

/** A position between two named poles. 1 = fully left, 5 = fully right, null = not answered. */
export type Scale = 1 | 2 | 3 | 4 | 5
export type ScaleValue = Scale | null

export const INDUSTRIES = [
  "Technology",
  "Finance",
  "Health & wellness",
  "Food & beverage",
  "Retail & e-commerce",
  "Education",
  "Professional services",
  "Creative & media",
  "Hospitality & travel",
  "Non-profit",
  "Other",
] as const
export type Industry = (typeof INDUSTRIES)[number]

export const TRAITS = [
  "Trustworthy",
  "Bold",
  "Warm",
  "Playful",
  "Sophisticated",
  "Rebellious",
  "Caring",
  "Expert",
  "Adventurous",
  "Calm",
  "Optimistic",
  "Down-to-earth",
] as const
export type Trait = (typeof TRAITS)[number]
export const MAX_TRAITS = 3

export const FONT_PAIRINGS = [
  "modern",
  "editorial",
  "friendly",
  "technical",
  "classic",
] as const
export type FontPairing = (typeof FONT_PAIRINGS)[number]

/** The business facts a person may leave open. The brand's name is not one of them. */
export const SKIPPABLE_FACTS = [
  "business.industry",
  "business.offer",
  "business.audience",
  "business.goal",
  "business.comparables",
  "business.differentiator",
] as const
export type SkippableFact = (typeof SKIPPABLE_FACTS)[number]

/** The sections of the Blueprint document. Each one can carry edited text (see `Blueprint.copy`). */
export const SECTION_IDS = [
  "hero",
  "apart",
  "headed",
  "against",
  "personality",
  "voice",
  "look",
  "typography",
  "color",
] as const
export type SectionId = (typeof SECTION_IDS)[number]

/** Text a person typed over the generated text of one section. A missing key means "use the generated text". */
export type SectionCopy = { title?: string; body?: string }

export type Palette = {
  primary: string
  secondary: string
  accent: string
  background: string
}

export type Blueprint = {
  version: 1
  /**
   * The proposal in one line, and why. Written by the agent with every proposal, in the
   * person's language: "A close, everyday brand" / "We started from how you know regulars by
   * name". It lets a person judge the direction before reading any detail, and tells apart
   * what the agent decided from what the person said.
   */
  direction: { headline: string; rationale: string }
  /** True once the person said the Blueprint represents them. Any later change sets it back to false. */
  review: { confirmed: boolean }
  /**
   * Business facts the person left open on purpose ("we have no competitors in mind", "I don't
   * know yet"), as field paths. They stop counting as missing, so the agent does not ask again
   * and the page does not nag. A path leaves this list by itself once its field gets a value.
   */
  skipped: SkippableFact[]
  business: {
    name: string
    industry: Industry | ""
    /** What they do, as a verb phrase: "runs payroll". */
    offer: string
    audience: string
    /** What they are trying to accomplish right now. */
    goal: string
    /** Competitors or comparable brands. */
    comparables: string[]
    differentiator: string
  }
  expression: {
    personality: Trait[]
    tone: {
      formality: ScaleValue
      humor: ScaleValue
      attitude: ScaleValue
      energy: ScaleValue
    }
    visual: {
      density: ScaleValue
      era: ScaleValue
    }
    /** Only the colors are stored. "Warm and vivid" is derived from them (`describeColor`), so the two cannot disagree. */
    color: { palette: Palette | null }
    typography: { pairing: FontPairing | null }
  }
  /**
   * Edited document text, per section. The document generates its titles and sentences from the
   * answers above; an entry here replaces one of them. Overrides are kept apart from the answers
   * so an edit is always visible as an edit and can be reset to the generated text.
   */
  copy: Partial<Record<SectionId, SectionCopy>>
}

export function emptyBlueprint(name = ""): Blueprint {
  return {
    version: 1,
    direction: { headline: "", rationale: "" },
    review: { confirmed: false },
    skipped: [],
    business: {
      name,
      industry: "",
      offer: "",
      audience: "",
      goal: "",
      comparables: [],
      differentiator: "",
    },
    expression: {
      personality: [],
      tone: { formality: null, humor: null, attitude: null, energy: null },
      visual: { density: null, era: null },
      color: { palette: null },
      typography: { pairing: null },
    },
    copy: {},
  }
}

const HEX = /^#[0-9a-f]{6}$/i

function text(value: unknown, max = 200): string {
  return typeof value === "string" ? value.slice(0, max) : ""
}

function scale(value: unknown): ScaleValue {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
    ? value
    : null
}

function oneOf<T extends string>(list: readonly T[], value: unknown): T | null {
  return list.includes(value as T) ? (value as T) : null
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {}
}

function palette(value: unknown): Palette | null {
  const p = record(value)
  const keys = ["primary", "secondary", "accent", "background"] as const
  if (!keys.every((key) => typeof p[key] === "string" && HEX.test(p[key]))) {
    return null
  }
  return {
    primary: p.primary as string,
    secondary: p.secondary as string,
    accent: p.accent as string,
    background: p.background as string,
  }
}

function copy(value: unknown): Blueprint["copy"] {
  const input = record(value)
  const result: Blueprint["copy"] = {}
  for (const id of SECTION_IDS) {
    const section = record(input[id])
    const entry: SectionCopy = {}
    // Blank text is not an override: the section falls back to its generated text.
    if (text(section.title).trim()) entry.title = text(section.title, 80)
    if (text(section.body).trim()) entry.body = text(section.body, 400)
    if (entry.title !== undefined || entry.body !== undefined) result[id] = entry
  }
  return result
}

/**
 * Turns any value into a valid Blueprint: known fields are kept when they pass
 * their check, everything else falls back to "unanswered".
 *
 * This is the only gate for untrusted input. It runs on data read from the
 * database, on data sent by the browser, and on every patch the AI agent
 * proposes, so none of those three can store a Blueprint the UI cannot render.
 */
export function normalizeBlueprint(input: unknown): Blueprint {
  const root = record(input)
  const direction = record(root.direction)
  const business = record(root.business)
  const expression = record(root.expression)
  const tone = record(expression.tone)
  const visual = record(expression.visual)
  const color = record(expression.color)
  const typography = record(expression.typography)

  const traits = Array.isArray(expression.personality)
    ? expression.personality
    : []
  const comparables = Array.isArray(business.comparables)
    ? business.comparables
    : []

  const facts = {
    name: text(business.name, 80),
    industry: oneOf(INDUSTRIES, business.industry) ?? ("" as const),
    offer: text(business.offer),
    audience: text(business.audience),
    goal: text(business.goal),
    comparables: comparables
      .map((item) => text(item, 60).trim())
      .filter(Boolean)
      .slice(0, 5),
    differentiator: text(business.differentiator),
  }
  const isEmpty = (path: SkippableFact) => {
    const value = facts[path.slice("business.".length) as keyof typeof facts]
    return Array.isArray(value) ? value.length === 0 : value === ""
  }
  const skipped = Array.isArray(root.skipped) ? root.skipped : []

  return {
    version: 1,
    direction: { headline: text(direction.headline, 120), rationale: text(direction.rationale, 400) },
    review: { confirmed: record(root.review).confirmed === true },
    // Known facts only, each once, and only while the fact is still empty.
    skipped: SKIPPABLE_FACTS.filter((path) => skipped.includes(path) && isEmpty(path)),
    business: facts,
    expression: {
      personality: [
        ...new Set(
          traits
            .map((item) => oneOf(TRAITS, item))
            .filter((item): item is Trait => item !== null)
        ),
      ].slice(0, MAX_TRAITS),
      tone: {
        formality: scale(tone.formality),
        humor: scale(tone.humor),
        attitude: scale(tone.attitude),
        energy: scale(tone.energy),
      },
      visual: { density: scale(visual.density), era: scale(visual.era) },
      color: { palette: palette(color.palette) },
      typography: { pairing: oneOf(FONT_PAIRINGS, typography.pairing) },
    },
    copy: copy(root.copy),
  }
}

import type { BrandExpression, BusinessContext } from "@/services/blueprint.types"

export const emptyBusinessContext: BusinessContext = {
  industry: "",
  audience: "",
  competitors: [],
  differentiators: "",
}

export const emptyBrandExpression: BrandExpression = {
  visualStyle: "",
  colorDirection: "",
  typographyDirection: "",
  toneOfVoice: "",
  personality: [],
}

export type FieldKind = "text" | "area" | "chips"

/**
 * A field belongs to a *storage* section (which JSON column it lives in) and to
 * a *display* section (which heading it appears under). They are not the same:
 * "Brand Expression" and "Voice & Personality" both write into
 * `brandExpression`.
 *
 * `key` is tied to its section's type, so renaming a property breaks the build
 * rather than silently decoupling the live artifacts — those bind by name
 * (`derivePalette` reads `colorDirection`, `deriveVoiceSample` reads
 * `personality` / `toneOfVoice`).
 */
export type FieldConfig =
  | {
      section: "businessContext"
      key: keyof BusinessContext
      label: string
      placeholder: string
      kind: FieldKind
    }
  | {
      section: "brandExpression"
      key: keyof BrandExpression
      label: string
      placeholder: string
      kind: FieldKind
    }

export type SectionConfig = {
  num: string
  title: string
  fields: FieldConfig[]
}

/**
 * The single declaration of the document's shape. The document body, the
 * progress count and the Jump-to nav all read from here, so a field is added
 * or reworded in exactly one place.
 */
export const DOCUMENT_SECTIONS: SectionConfig[] = [
  {
    num: "01",
    title: "Business Context",
    fields: [
      {
        section: "businessContext",
        key: "industry",
        label: "Industry",
        placeholder: "e.g. Logistics technology",
        kind: "text",
      },
      {
        section: "businessContext",
        key: "audience",
        label: "Audience",
        placeholder: "Who are you speaking to?",
        kind: "text",
      },
      {
        section: "businessContext",
        key: "competitors",
        label: "Competitors",
        placeholder: "Add and press Enter",
        kind: "chips",
      },
      {
        section: "businessContext",
        key: "differentiators",
        label: "Differentiators",
        placeholder: "What only you can claim",
        kind: "area",
      },
    ],
  },
  {
    num: "02",
    title: "Brand Expression",
    fields: [
      {
        section: "brandExpression",
        key: "visualStyle",
        label: "Visual style",
        placeholder: "e.g. Modern and intuitive, data-forward",
        kind: "text",
      },
      {
        section: "brandExpression",
        key: "colorDirection",
        label: "Color direction",
        placeholder: "Name the colors and what they should say",
        kind: "text",
      },
      {
        section: "brandExpression",
        key: "typographyDirection",
        label: "Typography",
        placeholder: "e.g. Clean sans-serif for clarity",
        kind: "text",
      },
    ],
  },
  {
    num: "03",
    title: "Voice & Personality",
    fields: [
      {
        section: "brandExpression",
        key: "toneOfVoice",
        label: "Tone of voice",
        placeholder: "How should it sound out loud?",
        kind: "area",
      },
      {
        section: "brandExpression",
        key: "personality",
        label: "Personality",
        placeholder: "Add a trait and press Enter",
        kind: "chips",
      },
    ],
  },
]

export const ALL_FIELDS: FieldConfig[] = DOCUMENT_SECTIONS.flatMap((section) => section.fields)

/** Both sections, always present — the canvas edits a fully-defaulted draft. */
export type BlueprintValues = {
  businessContext: BusinessContext
  brandExpression: BrandExpression
}

export function getFieldValue(values: BlueprintValues, field: FieldConfig): string | string[] {
  return field.section === "businessContext"
    ? values.businessContext[field.key]
    : values.brandExpression[field.key]
}

export function isFieldFilled(values: BlueprintValues, field: FieldConfig): boolean {
  const value = getFieldValue(values, field)
  return Array.isArray(value) ? value.length > 0 : value.trim().length > 0
}

/**
 * Stable DOM id for a field's control. Jump-to focuses by id rather than
 * threading a ref registry through four components — the design only used refs
 * because its canvas runtime had no stable ids to target.
 */
export function fieldDomId(field: FieldConfig): string {
  return `field-${field.key}`
}

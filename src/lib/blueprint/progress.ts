import { ALL_FIELDS, isFieldFilled, type BlueprintValues, type FieldConfig, type SectionConfig } from "@/lib/blueprint/field-config"

export type Progress = { filled: number; total: number; pct: number }

/** Global count across ALL_FIELDS. pct = Math.round((filled / total) * 100). */
export function computeProgress(values: BlueprintValues): Progress {
  const total = ALL_FIELDS.length
  const filled = ALL_FIELDS.filter((field) => isFieldFilled(values, field)).length
  return { filled, total, pct: total === 0 ? 0 : Math.round((filled / total) * 100) }
}

/** Per-section count, for the "2/4" label beside each heading and in Jump-to. */
export function countSectionFields(
  values: BlueprintValues,
  section: SectionConfig,
): { filled: number; total: number } {
  return {
    filled: section.fields.filter((field) => isFieldFilled(values, field)).length,
    total: section.fields.length,
  }
}

/**
 * The first field in the section the user has not filled — Jump-to focuses it.
 * Falls back to the section's first field when everything is filled.
 */
export function firstUnfilledField(values: BlueprintValues, section: SectionConfig): FieldConfig {
  return section.fields.find((field) => !isFieldFilled(values, field)) ?? section.fields[0]
}

/**
 * The list of things a Blueprint can hold, as flat paths ("expression.tone.humor").
 *
 * It answers two questions by code, so nobody has to guess: which fields are still
 * empty (the agent is told, and asks about them), and how complete a Blueprint is.
 *
 * `kind` carries the one rule the agent must respect: a "fact" about the business is
 * only ever written from what the person said; an "expression" field may be inferred.
 */
import type { Blueprint } from "./model"

export type FieldKind = "fact" | "expression"

export type Field = { path: string; label: string; kind: FieldKind }

export const FIELDS: Field[] = [
  { path: "business.name", label: "Brand name", kind: "fact" },
  { path: "business.industry", label: "Industry", kind: "fact" },
  { path: "business.offer", label: "What they do", kind: "fact" },
  { path: "business.audience", label: "Who they serve", kind: "fact" },
  { path: "business.goal", label: "Current goal", kind: "fact" },
  { path: "business.comparables", label: "Competitors or comparable brands", kind: "fact" },
  { path: "business.differentiator", label: "What sets them apart", kind: "fact" },
  { path: "expression.personality", label: "Personality", kind: "expression" },
  { path: "expression.tone.formality", label: "Formality", kind: "expression" },
  { path: "expression.tone.humor", label: "Humor", kind: "expression" },
  { path: "expression.tone.attitude", label: "Attitude", kind: "expression" },
  { path: "expression.tone.energy", label: "Energy", kind: "expression" },
  { path: "expression.visual.density", label: "Visual density", kind: "expression" },
  { path: "expression.visual.era", label: "Visual era", kind: "expression" },
  { path: "expression.color.palette", label: "Color palette", kind: "expression" },
  { path: "expression.typography.pairing", label: "Typography", kind: "expression" },
]

/** Reads a dotted path. Returns undefined when any step is missing. */
export function getPath(source: unknown, path: string): unknown {
  let value = source
  for (const key of path.split(".")) {
    if (typeof value !== "object" || value === null) return undefined
    value = (value as Record<string, unknown>)[key]
  }
  return value
}

export function isFilled(blueprint: Blueprint, path: string): boolean {
  const value = getPath(blueprint, path)
  if (Array.isArray(value)) return value.length > 0
  return value !== null && value !== undefined && value !== ""
}

export function missingFields(blueprint: Blueprint): Field[] {
  return FIELDS.filter((field) => !isFilled(blueprint, field.path))
}

/** Share of fields filled, 0 to 100. */
export function completion(blueprint: Blueprint): number {
  const filled = FIELDS.length - missingFields(blueprint).length
  return Math.round((filled / FIELDS.length) * 100)
}

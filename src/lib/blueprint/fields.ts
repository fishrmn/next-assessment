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
  { path: "direction.headline", label: "Brand direction", kind: "expression" },
  { path: "direction.rationale", label: "Why this direction", kind: "expression" },
]

export type Stage = "start" | "proposal"

/** "start" until there is something worth showing: what the business does, or any brand expression. */
export function stageOf(blueprint: Blueprint): Stage {
  const shown = FIELDS.some(
    (field) => field.path !== "business.name" && field.path !== "business.industry" && isFilled(blueprint, field.path)
  )
  return shown ? "proposal" : "start"
}

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

export type Status = "First proposal" | "In review" | "Reviewed with you"

/**
 * Where a Blueprint stands, in words a person understands (a percentage says nothing about
 * whether the brand feels right). `updates` is how many times the agent has changed it:
 * the first change is the proposal, every later one is review. "Reviewed with you" is never
 * inferred: only the person can say it, and any later change takes it back.
 */
export function statusOf(blueprint: Blueprint, updates: number): Status | null {
  if (stageOf(blueprint) === "start") return null
  if (blueprint.review.confirmed) return "Reviewed with you"
  return updates <= 1 ? "First proposal" : "In review"
}

/** Counts finished agent updates in stored chat messages, without trusting their shape. */
export function countUpdates(messages: unknown[]): number {
  let count = 0
  for (const message of messages) {
    const parts = (message as { parts?: unknown })?.parts
    if (!Array.isArray(parts)) continue
    for (const part of parts) {
      const { type, state } = (part ?? {}) as { type?: unknown; state?: unknown }
      if (type === "tool-updateBlueprint" && state === "output-available") count += 1
    }
  }
  return count
}

/** Business facts nobody has given yet. These are worth a line on screen; open expression is not. */
export function openFacts(blueprint: Blueprint): Field[] {
  return missingFields(blueprint).filter((field) => field.kind === "fact")
}

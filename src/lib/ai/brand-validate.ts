import { templates } from "@/lib/templates"

import type { ValidationResult } from "./validate"

const HEX_COLOR = /^#[0-9a-f]{3,8}$/i

const PALETTE_KEYS = ["primary", "secondary", "accent", "background"] as const

const PERSONALITY_AXES = {
  modernClassic: ["modern", "balanced", "classic"],
  luxuryApproachable: ["luxury", "balanced", "approachable"],
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === "string" && entry.trim() !== "")
  )
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string"
}

/** Validates the model's set_brand_profile payload. */
export function validateBrandProfile(value: unknown): ValidationResult {
  if (!isRecord(value)) return { ok: false, error: "profile must be an object" }

  if (typeof value.salonName !== "string" || !value.salonName.trim()) {
    return { ok: false, error: '"salonName" must be a non-empty string' }
  }
  if (!isStringArray(value.services)) {
    return { ok: false, error: '"services" must be a non-empty array of strings' }
  }
  if (!isStringArray(value.vibeWords)) {
    return { ok: false, error: '"vibeWords" must be a non-empty array of strings' }
  }
  for (const key of ["idealClients", "logoNotes", "instagram", "phone", "email", "address"]) {
    if (!optionalString(value[key])) {
      return { ok: false, error: `"${key}" must be a string when present` }
    }
  }

  if (!isRecord(value.personality)) {
    return { ok: false, error: '"personality" must be an object' }
  }
  for (const [axis, allowed] of Object.entries(PERSONALITY_AXES)) {
    const axisValue = value.personality[axis]
    if (!allowed.includes(axisValue as never)) {
      return {
        ok: false,
        error: `"personality.${axis}" must be one of ${allowed.map((v) => `"${v}"`).join(" | ")}`,
      }
    }
  }

  if (!isRecord(value.palette)) {
    return { ok: false, error: '"palette" must be an object' }
  }
  for (const key of PALETTE_KEYS) {
    const color = value.palette[key]
    if (typeof color !== "string" || !HEX_COLOR.test(color)) {
      return { ok: false, error: `"palette.${key}" must be a hex color like "#b3854d"` }
    }
  }

  if (typeof value.paletteReasoning !== "string" || !value.paletteReasoning.trim()) {
    return { ok: false, error: '"paletteReasoning" must be a non-empty string' }
  }

  return { ok: true }
}

const DIRECTION_STRING_FIELDS = [
  "id",
  "name",
  "visualDescription",
  "layoutApproach",
  "typography",
  "colorUsage",
  "heroConcept",
] as const

/** Validates the model's propose_directions payload (the directions array). */
export function validateDirections(value: unknown): ValidationResult {
  if (!Array.isArray(value) || value.length !== 3) {
    return { ok: false, error: "directions must be an array of exactly 3 items" }
  }
  for (const [index, direction] of value.entries()) {
    if (!isRecord(direction)) {
      return { ok: false, error: `directions[${index}] must be an object` }
    }
    for (const field of DIRECTION_STRING_FIELDS) {
      if (typeof direction[field] !== "string" || !(direction[field] as string).trim()) {
        return {
          ok: false,
          error: `directions[${index}].${field} must be a non-empty string`,
        }
      }
    }
    if (!(String(direction.baseTemplateId) in templates)) {
      return {
        ok: false,
        error: `directions[${index}].baseTemplateId must be one of ${Object.keys(templates).join(", ")}`,
      }
    }
  }
  const ids = new Set(value.map((d) => (d as Record<string, unknown>).id))
  if (ids.size !== 3) {
    return { ok: false, error: "direction ids must be unique (e.g. a, b, c)" }
  }
  return { ok: true }
}

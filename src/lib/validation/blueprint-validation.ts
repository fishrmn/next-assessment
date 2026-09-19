import type { BlueprintSection, BrandExpression, BusinessContext } from "@/services/blueprint.types"

export type ValidationResult = { valid: true } | { valid: false; errors: string[] }

const MAX_TEXT_LENGTH = 2000
const MAX_LIST_ITEMS = 20

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

/** Shape check for a single string field: present, right type, within the length cap. */
function checkStringShape(errors: string[], field: string, value: unknown): void {
  if (typeof value !== "string" || value.length > MAX_TEXT_LENGTH) {
    errors.push(`${field} must be a string`)
  }
}

/** Shape check for a list field: present, right type, within the item-count cap. */
function checkListShape(errors: string[], field: string, value: unknown): void {
  if (!isStringArray(value) || value.length > MAX_LIST_ITEMS) {
    errors.push(`${field} must be an array of strings (max ${MAX_LIST_ITEMS})`)
  }
}

export function validateBusinessContext(data: unknown): ValidationResult {
  const errors: string[] = []
  if (typeof data !== "object" || data === null) {
    return { valid: false, errors: ["businessContext must be an object"] }
  }
  const value = data as Partial<BusinessContext>

  if (!isNonEmptyString(value.industry) || value.industry.length > MAX_TEXT_LENGTH) {
    errors.push("industry must be a non-empty string")
  }
  if (!isNonEmptyString(value.audience) || value.audience.length > MAX_TEXT_LENGTH) {
    errors.push("audience must be a non-empty string")
  }
  if (!isStringArray(value.competitors) || value.competitors.length > MAX_LIST_ITEMS) {
    errors.push(`competitors must be an array of strings (max ${MAX_LIST_ITEMS})`)
  }
  if (!isNonEmptyString(value.differentiators) || value.differentiators.length > MAX_TEXT_LENGTH) {
    errors.push("differentiators must be a non-empty string")
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

export function validateBrandExpression(data: unknown): ValidationResult {
  const errors: string[] = []
  if (typeof data !== "object" || data === null) {
    return { valid: false, errors: ["brandExpression must be an object"] }
  }
  const value = data as Partial<BrandExpression>

  if (!isNonEmptyString(value.visualStyle) || value.visualStyle.length > MAX_TEXT_LENGTH) {
    errors.push("visualStyle must be a non-empty string")
  }
  if (!isNonEmptyString(value.colorDirection) || value.colorDirection.length > MAX_TEXT_LENGTH) {
    errors.push("colorDirection must be a non-empty string")
  }
  if (
    !isNonEmptyString(value.typographyDirection) ||
    value.typographyDirection.length > MAX_TEXT_LENGTH
  ) {
    errors.push("typographyDirection must be a non-empty string")
  }
  if (!isNonEmptyString(value.toneOfVoice) || value.toneOfVoice.length > MAX_TEXT_LENGTH) {
    errors.push("toneOfVoice must be a non-empty string")
  }
  if (!isStringArray(value.personality) || value.personality.length > MAX_LIST_ITEMS) {
    errors.push(`personality must be an array of strings (max ${MAX_LIST_ITEMS})`)
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Write-path validation: types and size caps only. Empty values are allowed —
 * an edit is never refused for being incomplete. Completeness is a separate
 * question, answered by validateBusinessContext/validateBrandExpression.
 */
export function validateBusinessContextShape(data: unknown): ValidationResult {
  const errors: string[] = []
  if (typeof data !== "object" || data === null) {
    return { valid: false, errors: ["businessContext must be an object"] }
  }
  const value = data as Partial<BusinessContext>

  checkStringShape(errors, "industry", value.industry)
  checkStringShape(errors, "audience", value.audience)
  checkListShape(errors, "competitors", value.competitors)
  checkStringShape(errors, "differentiators", value.differentiators)

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/** Write-path validation for brandExpression. See validateBusinessContextShape. */
export function validateBrandExpressionShape(data: unknown): ValidationResult {
  const errors: string[] = []
  if (typeof data !== "object" || data === null) {
    return { valid: false, errors: ["brandExpression must be an object"] }
  }
  const value = data as Partial<BrandExpression>

  checkStringShape(errors, "visualStyle", value.visualStyle)
  checkStringShape(errors, "colorDirection", value.colorDirection)
  checkStringShape(errors, "typographyDirection", value.typographyDirection)
  checkStringShape(errors, "toneOfVoice", value.toneOfVoice)
  checkListShape(errors, "personality", value.personality)

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

export function validateSection(section: BlueprintSection, data: unknown): ValidationResult {
  return section === "businessContext" ? validateBusinessContext(data) : validateBrandExpression(data)
}

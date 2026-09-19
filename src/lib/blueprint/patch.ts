/**
 * Applying a partial change to a Blueprint, and reporting exactly what happened.
 *
 * This is the whole "write API" of a Blueprint. The AI agent's only tool calls it, and
 * the chat's Undo calls its inverse. A patch is a partial Blueprint: only the fields to
 * change. `null` clears a field.
 *
 * The patch is never trusted. It is merged, then passed through `normalizeBlueprint`
 * (the same gate as every other input), and the result is compared with what was asked:
 * - `applied`: fields whose value really changed, with before and after.
 * - `rejected`: fields where the gate refused or altered the requested value, with the rule,
 *   so the agent can correct itself in the same turn.
 */
import { SCALES, describeColor, describeScale, fontInfo } from "./registry"
import { FIELDS, getPath } from "./fields"
import { documentSection } from "./document-sections"
import {
  FONT_PAIRINGS,
  INDUSTRIES,
  MAX_TRAITS,
  SECTION_IDS,
  TRAITS,
  normalizeBlueprint,
  type Blueprint,
  type Palette,
  type ScaleValue,
  type SectionId,
} from "./model"

type CopyPatch = { title?: string | null; body?: string | null }

export type BlueprintPatch = {
  business?: Partial<{
    [Key in keyof Blueprint["business"]]: Blueprint["business"][Key] | null
  }>
  expression?: {
    personality?: string[] | null
    tone?: Partial<Record<keyof Blueprint["expression"]["tone"], number | null>>
    visual?: Partial<Record<keyof Blueprint["expression"]["visual"], number | null>>
    color?: { palette?: Partial<Palette> | null }
    typography?: { pairing?: string | null }
  }
  copy?: Partial<Record<SectionId, CopyPatch | null>>
}

export type Change = {
  path: string
  /** "Humor", "Color palette", "Voice · Title". */
  label: string
  /** Before and after, in words a person reads: "Leans serious", "—". */
  from: string
  to: string
  /** Before and after, as stored. `before` is what Undo writes back. */
  before: unknown
  after: unknown
}

export type Rejection = { path: string; label: string; reason: string }

export type PatchResult = { blueprint: Blueprint; applied: Change[]; rejected: Rejection[] }

const PALETTE_PATH = "expression.color.palette"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function equal(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

/** The paths a patch touches. The palette counts as one field even when only one color is sent. */
function leafPaths(patch: unknown, prefix = ""): string[] {
  if (!isRecord(patch) || prefix === PALETTE_PATH) return prefix ? [prefix] : []
  return Object.entries(patch).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    // `copy.voice: null` means "clear both texts of that section".
    if (value === null && /^copy\.[a-z]+$/.test(path)) return [`${path}.title`, `${path}.body`]
    return isRecord(value) ? leafPaths(value, path) : [path]
  })
}

/** Objects merge key by key; everything else (text, numbers, lists, null) replaces. */
function merge(base: unknown, patch: unknown): unknown {
  if (!isRecord(patch)) return patch
  const result: Record<string, unknown> = isRecord(base) ? { ...base } : {}
  for (const [key, value] of Object.entries(patch)) result[key] = merge(result[key], value)
  return result
}

function setPath(target: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".")
  let node = target
  for (const key of keys.slice(0, -1)) {
    if (!isRecord(node[key])) node[key] = {}
    node = node[key] as Record<string, unknown>
  }
  node[keys[keys.length - 1]] = value
}

function labelOf(path: string): string {
  const field = FIELDS.find((item) => item.path === path)
  if (field) return field.label
  const [, section, slot] = path.split(".")
  if (path.startsWith("copy.") && SECTION_IDS.includes(section as SectionId)) {
    const info = documentSection(section as SectionId)
    return `${info.label} · ${info.slots.find((item) => item.key === slot)?.label ?? slot}`
  }
  return path
}

/** A stored value in words, for the chat's list of changes. */
function display(path: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—"
  const scale = SCALES.find((field) => path.endsWith(`.${field.id}`))
  if (scale) return describeScale(scale, value as ScaleValue) ?? "—"
  if (path === PALETTE_PATH) {
    const palette = value as Palette
    return `${describeColor(palette)} (${palette.primary})`
  }
  if (path === "expression.typography.pairing") return fontInfo(value as never)?.name ?? String(value)
  return String(value)
}

function ruleFor(path: string): string {
  if (SCALES.some((field) => path.endsWith(`.${field.id}`))) return "must be a whole number from 1 to 5, or null"
  if (path === PALETTE_PATH) return "needs all four colors (primary, secondary, accent, background), each as #rrggbb"
  if (path === "expression.typography.pairing") return `must be one of: ${FONT_PAIRINGS.join(", ")}`
  if (path === "expression.personality") return `at most ${MAX_TRAITS}, each one of: ${TRAITS.join(", ")}`
  if (path === "business.industry") return `must be one of: ${INDUSTRIES.join(", ")}`
  if (path === "business.comparables") return "a list of at most 5 short names"
  if (path.startsWith("copy.")) return "unknown section or text too long (title 80, body 400 characters)"
  if (path.startsWith("business.")) return "must be text of at most 200 characters (brand name: 80)"
  return "not a field of the Blueprint"
}

export function applyPatch(blueprint: Blueprint, patch: unknown): PatchResult {
  const wanted = merge(blueprint, patch)
  const next = normalizeBlueprint(wanted)
  const applied: Change[] = []
  const rejected: Rejection[] = []

  for (const path of new Set(leafPaths(patch))) {
    const before = getPath(blueprint, path)
    const after = getPath(next, path)
    const asked = getPath(wanted, path)
    // Clearing a field is asked with null or ""; the gate stores it as null, "" or a missing key.
    const askedToClear = asked === null || asked === ""
    const cleared = after === null || after === undefined || after === "" || equal(after, [])
    if (askedToClear ? !cleared : !equal(after, asked)) {
      rejected.push({ path, label: labelOf(path), reason: ruleFor(path) })
    }
    if (!equal(before, after)) {
      applied.push({
        path,
        label: labelOf(path),
        from: display(path, before),
        to: display(path, after),
        before: before ?? null,
        after: after ?? null,
      })
    }
  }

  return { blueprint: next, applied, rejected }
}

/** Applies changes computed elsewhere (by the agent's tool, on the server) to the browser's copy. */
export function replayChanges(blueprint: Blueprint, changes: Change[]): Blueprint {
  const patch: Record<string, unknown> = {}
  for (const change of changes) setPath(patch, change.path, change.after)
  return applyPatch(blueprint, patch).blueprint
}

/** Undo: writes every `before` value back. Goes through the same gate as any other change. */
export function revertChanges(blueprint: Blueprint, changes: Change[]): Blueprint {
  const patch: Record<string, unknown> = {}
  for (const change of changes) setPath(patch, change.path, change.before)
  return applyPatch(blueprint, patch).blueprint
}

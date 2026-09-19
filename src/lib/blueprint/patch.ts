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
 *   so the agent can correct itself in the same turn. A rejected field keeps the value it had:
 *   a bad request never destroys good data (one invalid color must not erase the palette).
 *
 * `only` narrows a patch to part of the Blueprint: paths outside it are rejected the same way.
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
  direction?: Partial<Record<keyof Blueprint["direction"], string | null>>
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
  if (path.startsWith("direction.")) return "must be text (headline at most 120 characters, rationale 400)"
  return "not a field of the Blueprint"
}

const OUT_OF_SCOPE = "outside the part the person pointed at; it was left as it is"

export type PatchOptions = {
  /** Path prefixes that may change. Every other path in the patch is rejected and keeps its value. */
  only?: string[]
}

export function applyPatch(blueprint: Blueprint, patch: unknown, { only }: PatchOptions = {}): PatchResult {
  const paths = [...new Set(leafPaths(patch))]
  const allowed = (path: string) =>
    !only || only.some((prefix) => path === prefix || path.startsWith(`${prefix}.`))
  const wanted = merge(blueprint, patch)
  const gated = normalizeBlueprint(wanted)

  const rejected: Rejection[] = []
  const restore: Record<string, unknown> = {}
  for (const path of paths) {
    if (!allowed(path)) {
      rejected.push({ path, label: labelOf(path), reason: OUT_OF_SCOPE })
      setPath(restore, path, getPath(blueprint, path) ?? null)
      continue
    }
    const asked = getPath(wanted, path)
    const result = getPath(gated, path)
    // Clearing a field is asked with null or ""; the gate stores it as null, "" or a missing key.
    const askedToClear = asked === null || asked === ""
    const cleared = result === null || result === undefined || result === "" || equal(result, [])
    if (askedToClear ? cleared : equal(result, asked)) continue
    rejected.push({ path, label: labelOf(path), reason: ruleFor(path) })
    setPath(restore, path, getPath(blueprint, path) ?? null)
  }

  // Put the previous value back wherever the request was refused.
  const next = rejected.length > 0 ? normalizeBlueprint(merge(gated, restore)) : gated

  const applied: Change[] = []
  for (const path of paths) {
    const before = getPath(blueprint, path)
    const after = getPath(next, path)
    if (equal(before, after)) continue
    applied.push({
      path,
      label: labelOf(path),
      from: display(path, before),
      to: display(path, after),
      before: before ?? null,
      after: after ?? null,
    })
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

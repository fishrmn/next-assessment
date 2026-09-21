/**
 * The input of the agent's `updateBlueprint` tool, as a Zod schema. Every list here comes
 * from `model.ts`: the model cannot be offered a trait or a font the Blueprint does not accept.
 *
 * In this input `null` means "leave this field alone". That is not a style choice: OpenAI's
 * function calling makes the model fill in every property of the schema, so it sends `null`
 * for everything it does not want to touch. Reading those nulls as "clear" wiped the whole
 * Blueprint on a request as small as "more playful". Clearing is therefore a separate,
 * explicit argument, `clear`, that the model has to name field by field.
 *
 * The schema guides the model; it is not the guard. `applyPatch` still runs every patch
 * through `normalizeBlueprint`. Hex colors are deliberately plain strings here: a bad
 * color is reported back field by field instead of failing the whole tool call.
 */
import { z } from "zod"

import { DOCUMENT_SECTIONS } from "./document-sections"
import { FIELDS } from "./fields"
import { FONT_PAIRINGS, INDUSTRIES, MAX_TRAITS, SECTION_IDS, SKIPPABLE_FACTS, TRAITS } from "./model"

/** Every path `clear` accepts: the Blueprint's fields, and each reworded text of the document. */
export const CLEARABLE_PATHS = [
  ...FIELDS.map((field) => field.path),
  ...DOCUMENT_SECTIONS.flatMap((section) => section.slots.map((item) => `copy.${section.id}.${item.key}`)),
] as [string, ...string[]]

const text = z.string().nullable().optional()
const scale = (poles: string) =>
  z.number().int().min(1).max(5).nullable().optional().describe(`1 = ${poles.split("|")[0]}, 5 = ${poles.split("|")[1]}, 3 = in between`)
const hex = z.string().describe("#rrggbb").optional()

const slot = z
  .object({
    title: z.string().max(80).nullable().optional().describe("In English"),
    body: z.string().max(400).nullable().optional().describe("In English"),
  })
  .nullable()
  .optional()

export const patchSchema = z.object({
  direction: z
    .object({
      headline: z.string().max(120).nullable().optional().describe("The brand in one line of about six words. In English, whatever language the person writes in"),
      rationale: z.string().max(400).nullable().optional().describe("One or two sentences, in English: which of the person's own words led to this direction"),
    })
    .optional(),
  business: z
    .object({
      name: text.describe("Brand name"),
      industry: z.enum(INDUSTRIES).nullable().optional(),
      offer: text.describe('In English. What they do, as a verb phrase that reads well after "We": "run payroll in minutes"'),
      audience: text.describe('In English. Who they serve: "small business owners"'),
      goal: text.describe('In English. What they want to achieve now, as a verb phrase after "we want to"'),
      comparables: z.array(z.string()).max(5).nullable().optional().describe("Competitors or comparable brands the person named"),
      differentiator: text.describe('In English. What sets them apart, as a verb phrase that reads well after "We"'),
    })
    .optional(),
  expression: z
    .object({
      personality: z.array(z.enum(TRAITS)).max(MAX_TRAITS).nullable().optional(),
      tone: z
        .object({
          formality: scale("formal|casual"),
          humor: scale("serious|playful"),
          attitude: scale("respectful|irreverent"),
          energy: scale("matter-of-fact|enthusiastic"),
        })
        .optional(),
      visual: z
        .object({
          density: scale("minimal|bold"),
          era: scale("classic|modern"),
        })
        .optional(),
      color: z
        .object({
          palette: z
            .object({ primary: hex, secondary: hex, accent: hex, background: hex })
            .nullable()
            .optional()
            .describe("Send all four colors when there is no palette yet. Otherwise send only the colors to change."),
        })
        .optional(),
      typography: z.object({ pairing: z.enum(FONT_PAIRINGS).nullable().optional() }).optional(),
    })
    .optional(),
  copy: z
    .object(Object.fromEntries(SECTION_IDS.map((id) => [id, slot])) as Record<(typeof SECTION_IDS)[number], typeof slot>)
    .optional()
    .describe("Rewording of the document's own titles and descriptions, per section."),
  suggestions: z
    .array(z.string().max(80))
    .max(3)
    .nullable()
    .optional()
    .describe(
      "Two or three short things this person might want to say next, written as they would say them and specific to this brand (\"It feels too eco-friendly\", \"I want trust to stand out\"). Never generic."
    ),
  skip: z
    .array(z.enum(SKIPPABLE_FACTS))
    .nullable()
    .optional()
    .describe(
      'Business facts the person has no answer for ("none", "I don\'t know", "not yet"), as paths such as "business.comparables". They stop counting as missing.'
    ),
  clear: z
    .array(z.enum(CLEARABLE_PATHS))
    .nullable()
    .optional()
    .describe(
      'Fields to empty, as paths such as "business.goal" or "copy.voice.title" (which restores the generated text). Only when the person asks to remove something.'
    ),
})

export type PatchInput = z.infer<typeof patchSchema>

function withoutNulls(value: unknown): unknown {
  if (Array.isArray(value) || typeof value !== "object" || value === null) return value
  const entries = Object.entries(value)
    .filter(([, item]) => item !== null)
    .map(([key, item]) => [key, withoutNulls(item)] as const)
    .filter(([, item]) => !(typeof item === "object" && item !== null && !Array.isArray(item) && Object.keys(item).length === 0))
  return Object.fromEntries(entries)
}

/**
 * Turns the tool's input into a patch for `applyPatch`, where `null` does mean "clear":
 * every null the model sent is dropped (leave alone), only the paths named in `clear`
 * become nulls, and `skip` becomes the Blueprint's `skipped` list.
 */
export function patchFromToolInput(input: PatchInput, skippedSoFar: readonly string[] = []): Record<string, unknown> {
  const { clear, skip, ...fields } = input
  const patch = withoutNulls(fields) as Record<string, unknown>
  // `suggestions` is for the chat, not for the Blueprint: the tool hands it back untouched.
  delete patch.suggestions
  // `skip` adds to the list; the gate drops a path again once its fact has a value.
  if (skip && skip.length > 0) patch.skipped = [...new Set([...skippedSoFar, ...skip])]
  for (const path of clear ?? []) {
    const keys = path.split(".")
    let node = patch
    for (const key of keys.slice(0, -1)) {
      if (typeof node[key] !== "object" || node[key] === null) node[key] = {}
      node = node[key] as Record<string, unknown>
    }
    node[keys[keys.length - 1]] = null
  }
  return patch
}

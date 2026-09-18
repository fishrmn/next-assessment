/**
 * The shape of a patch, as a Zod schema. It is what the AI model sees as the input of
 * its `updateBlueprint` tool, so every list here comes from `model.ts`: the model cannot
 * be offered a trait or a font that the Blueprint does not accept.
 *
 * The schema guides the model; it is not the guard. `applyPatch` still runs every patch
 * through `normalizeBlueprint`. Hex colors are deliberately plain strings here: a bad
 * color is reported back field by field instead of failing the whole tool call.
 */
import { z } from "zod"

import { FONT_PAIRINGS, INDUSTRIES, MAX_TRAITS, SECTION_IDS, TRAITS } from "./model"

const text = z.string().nullable().optional()
const scale = (poles: string) =>
  z.number().int().min(1).max(5).nullable().optional().describe(`1 = ${poles.split("|")[0]}, 5 = ${poles.split("|")[1]}, 3 = in between, null = not decided`)
const hex = z.string().describe("#rrggbb").optional()

const slot = z
  .object({
    title: z.string().max(80).nullable().optional(),
    body: z.string().max(400).nullable().optional(),
  })
  .nullable()
  .optional()

export const patchSchema = z.object({
  business: z
    .object({
      name: text.describe("Brand name"),
      industry: z.enum(INDUSTRIES).nullable().optional(),
      offer: text.describe('What they do, as a verb phrase that reads well after "We": "run payroll in minutes"'),
      audience: text.describe('Who they serve: "small business owners"'),
      goal: text.describe('What they want to achieve now, as a verb phrase after "we want to"'),
      comparables: z.array(z.string()).max(5).nullable().optional().describe("Competitors or comparable brands the person named"),
      differentiator: text.describe('What sets them apart, as a verb phrase that reads well after "We"'),
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
            .describe("Send all four colors when there is no palette yet. Send only the ones to change otherwise."),
        })
        .optional(),
      typography: z.object({ pairing: z.enum(FONT_PAIRINGS).nullable().optional() }).optional(),
    })
    .optional(),
  copy: z
    .object(Object.fromEntries(SECTION_IDS.map((id) => [id, slot])) as Record<(typeof SECTION_IDS)[number], typeof slot>)
    .optional()
    .describe("Rewording of the document's own titles and descriptions, per section. null restores the generated text."),
})

export type PatchInput = z.infer<typeof patchSchema>

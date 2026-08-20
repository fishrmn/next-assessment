import type { ChatCompletionTool } from "openai/resources/chat/completions"

import type { BrandDirection, BrandProfile, BrandState } from "./brand-types"
import { validateBrandProfile, validateDirections } from "./brand-validate"

/**
 * Milestone tools for the brand consultant. Schemas stay loose (objects) —
 * exact shapes are enforced by brand-validate.ts, and validation errors are
 * fed back to the model as tool results so it can self-correct, mirroring
 * the editor tools in tools.ts.
 */
export const brandTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "set_brand_profile",
      description:
        "Save the brand profile once the interview has enough signal (and after analyzing the logo, if one was shared). Call exactly once.",
      parameters: {
        type: "object",
        properties: {
          profile: {
            type: "object",
            description:
              'Brand profile: { salonName, services: string[], idealClients?, vibeWords: string[] (~3 words), personality: { modernClassic: "modern"|"balanced"|"classic", luxuryApproachable: "luxury"|"balanced"|"approachable" }, palette: { primary, secondary, accent, background } (hex colors, derived from the logo when provided), paletteReasoning, logoNotes?, instagram?, phone?, email?, address? }',
          },
        },
        required: ["profile"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_directions",
      description:
        "Propose exactly 3 distinct visual directions for the salon's website, each anchored to a base template. Call only after set_brand_profile.",
      parameters: {
        type: "object",
        properties: {
          directions: {
            type: "array",
            description:
              'Exactly 3 items: { id: "a"|"b"|"c", name, baseTemplateId: "elegance"|"moderna"|"lush", visualDescription, layoutApproach, typography, colorUsage, heroConcept }',
            items: { type: "object" },
          },
        },
        required: ["directions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_page",
      description:
        "Generate the website from the chosen direction. Call only after the user has picked one of the proposed directions.",
      parameters: {
        type: "object",
        properties: {
          directionId: {
            type: "string",
            description: "The id of the direction the user chose",
          },
          rebrandInstruction: {
            type: "string",
            description:
              "Complete instruction to rebrand the base template for this salon: rewrite ALL copy (salon name in the hero, tone-matched tagline, the owner's actual services with realistic prices and descriptions, intro copy addressed to their ideal clients, CTA labels matching the brand register, contact details or sensible placeholders) and map the brand palette onto every color field. Tell the agent to batch updates across elements.",
          },
        },
        required: ["directionId", "rebrandInstruction"],
      },
    },
  },
]

export type BrandToolOutcome = {
  state: BrandState
  /** Sent back to the model as the tool result. */
  result: string
  /** Structured payload for the UI, set on success. */
  artifact?:
    | { kind: "profile"; profile: BrandProfile }
    | { kind: "directions"; directions: BrandDirection[] }
}

function fail(state: BrandState, error: string): BrandToolOutcome {
  return { state, result: `Error: ${error}` }
}

/**
 * Applies set_brand_profile / propose_directions to the brand state.
 * generate_page is handled by the agent itself — it needs the OpenAI client.
 */
export function dispatchBrandTool(
  state: BrandState,
  name: string,
  args: unknown
): BrandToolOutcome {
  if (typeof args !== "object" || args === null) {
    return fail(state, "arguments must be a JSON object")
  }
  const { profile, directions } = args as Record<string, unknown>

  switch (name) {
    case "set_brand_profile": {
      const valid = validateBrandProfile(profile)
      if (!valid.ok) return fail(state, valid.error)
      const saved = profile as BrandProfile
      return {
        state: { ...state, profile: saved },
        result: `OK — brand profile saved for "${saved.salonName}"`,
        artifact: { kind: "profile", profile: saved },
      }
    }
    case "propose_directions": {
      if (!state.profile) {
        return fail(state, "call set_brand_profile before proposing directions")
      }
      const valid = validateDirections(directions)
      if (!valid.ok) return fail(state, valid.error)
      const saved = directions as BrandDirection[]
      return {
        state: { ...state, directions: saved },
        result: "OK — 3 directions proposed. Ask the user to choose one.",
        artifact: { kind: "directions", directions: saved },
      }
    }
    default:
      return fail(state, `unknown tool "${name}"`)
  }
}

import type { ChatCompletionTool } from "openai/resources/chat/completions"

import type { ElementConfig, PageConfig } from "@/components/builder/types"
import { editorReducer } from "@/components/editor/editor-reducer"

import { ELEMENT_TYPES, validateElement, validatePatch } from "./validate"

/**
 * Tools mirror the editor reducer actions. `patch` and `element` are kept
 * loosely typed in the JSON schema — exact fields and enums are enforced by
 * validate.ts and documented in the system prompt, and validation errors are
 * fed back to the model as tool results so it can self-correct.
 */
export const editorTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "update_element",
      description:
        "Patch fields on an existing element. Only include the fields being changed.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The element's id from the page config" },
          patch: {
            type: "object",
            description:
              'Partial element fields to change, e.g. { "backgroundColor": "#111827" }',
          },
        },
        required: ["id", "patch"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_element",
      description: "Append a new element to the end of the page.",
      parameters: {
        type: "object",
        properties: {
          element: {
            type: "object",
            description: `Full element config including "type" (one of ${ELEMENT_TYPES.join(", ")}) and all its required fields`,
          },
        },
        required: ["element"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_element",
      description: "Remove an element from the page.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The element's id from the page config" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_element",
      description: "Move an element one position up or down in the page order.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The element's id from the page config" },
          direction: { type: "string", enum: ["up", "down"] },
        },
        required: ["id", "direction"],
      },
    },
  },
]

export type ToolOutcome = {
  config: PageConfig
  /** Sent back to the model as the tool result. */
  result: string
  mutated: boolean
}

function fail(config: PageConfig, error: string): ToolOutcome {
  return { config, result: `Error: ${error}`, mutated: false }
}

function findElement(config: PageConfig, id: unknown): ElementConfig | undefined {
  return typeof id === "string" ? config.find((element) => element.id === id) : undefined
}

/** Validates the model's tool call and applies it to the config via the editor reducer. */
export function dispatchTool(
  config: PageConfig,
  name: string,
  args: unknown
): ToolOutcome {
  if (typeof args !== "object" || args === null) {
    return fail(config, "arguments must be a JSON object")
  }
  const { id, patch, element, direction } = args as Record<string, unknown>

  switch (name) {
    case "update_element": {
      const target = findElement(config, id)
      if (!target) return fail(config, `no element with id "${id}"`)
      const valid = validatePatch(target.type, patch)
      if (!valid.ok) return fail(config, valid.error)
      return {
        config: editorReducer(config, {
          type: "update",
          id: id as string,
          patch: patch as Partial<ElementConfig>,
        }),
        result: `OK — updated ${target.type} "${id}"`,
        mutated: true,
      }
    }
    case "add_element": {
      const valid = validateElement(element)
      if (!valid.ok) return fail(config, valid.error)
      const created = {
        ...(element as ElementConfig),
        id: crypto.randomUUID(),
      }
      return {
        config: editorReducer(config, { type: "add", element: created }),
        result: `OK — added ${created.type} "${created.id}"`,
        mutated: true,
      }
    }
    case "remove_element": {
      const target = findElement(config, id)
      if (!target) return fail(config, `no element with id "${id}"`)
      return {
        config: editorReducer(config, { type: "remove", id: id as string }),
        result: `OK — removed ${target.type} "${id}"`,
        mutated: true,
      }
    }
    case "move_element": {
      const target = findElement(config, id)
      if (!target) return fail(config, `no element with id "${id}"`)
      if (direction !== "up" && direction !== "down") {
        return fail(config, '"direction" must be "up" or "down"')
      }
      const next = editorReducer(config, {
        type: "move",
        id: id as string,
        direction,
      })
      if (next === config) {
        return fail(config, `cannot move "${id}" ${direction} — already at the edge`)
      }
      return { config: next, result: `OK — moved ${target.type} "${id}" ${direction}`, mutated: true }
    }
    default:
      return fail(config, `unknown tool "${name}"`)
  }
}

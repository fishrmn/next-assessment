import { validateUIMessages } from "ai"

import { createBlueprintAgent, type BlueprintMessage } from "@/agents/blueprint"
import type { Blueprint } from "@/lib/blueprint/model"

/**
 * Turns stored chat messages back into typed messages for the chat.
 *
 * Stored messages are old data: the tool's input or output shape may have changed since they
 * were written. They are validated against the agent's current tools, and a history that no
 * longer fits is dropped rather than shown broken. Dropping it loses nothing but the transcript:
 * the Blueprint itself is stored separately.
 */
export async function loadChat(stored: unknown[], blueprint: Blueprint): Promise<BlueprintMessage[]> {
  if (stored.length === 0) return []
  try {
    return await validateUIMessages<BlueprintMessage>({
      messages: stored,
      tools: createBlueprintAgent(blueprint).tools,
    })
  } catch (error) {
    console.warn("Stored chat history no longer matches the agent's tools; starting a fresh chat.", error)
    return []
  }
}

import { consumeStream, createAgentUIStreamResponse, createIdGenerator } from "ai"

import { createBlueprintAgent } from "@/agents/blueprint"
import { normalizeBlueprint } from "@/lib/blueprint/model"
import { saveMessages } from "@/lib/blueprints"

export const maxDuration = 60

/**
 * One chat turn. The browser sends the conversation and the Blueprint exactly as the person
 * sees it (it may hold edits the autosave has not stored yet), so the agent never works on a
 * stale copy. The Blueprint is untrusted input and goes through the usual gate first.
 */
export async function POST(request: Request) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json(
      { error: "The agent has no model key. Add AI_GATEWAY_API_KEY to .env.local and restart the app." },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => null)
  if (!body || !Array.isArray(body.messages)) {
    return Response.json({ error: "Expected { id, messages, blueprint }." }, { status: 400 })
  }

  return createAgentUIStreamResponse({
    agent: createBlueprintAgent(normalizeBlueprint(body.blueprint)),
    uiMessages: body.messages,
    // Stop in the chat aborts the request. Passing the signal on stops the model too, so the
    // server never produces changes the browser is no longer there to apply.
    abortSignal: request.signal,
    // Keep the conversation, so a reload brings the chat back next to the document. It stores
    // the transcript only: the Blueprint is still saved by the browser alone. `consumeStream`
    // makes `onEnd` run after an abort as well, with the messages as far as they got.
    originalMessages: body.messages,
    generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
    consumeSseStream: consumeStream,
    onEnd: ({ messages }) => saveMessages(Number(body.id), messages),
    onError: (error) => (error instanceof Error ? error.message : "The model call failed."),
  })
}

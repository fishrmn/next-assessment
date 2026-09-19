"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import type { BlueprintMessage, UpdateBlueprintOutput } from "@/agents/blueprint"
import type { Blueprint } from "@/lib/blueprint/model"
import { replayChanges, revertChanges } from "@/lib/blueprint/patch"

type BlueprintChat = {
  messages: BlueprintMessage[]
  /** A turn is running: the message was sent, or the reply is streaming. */
  busy: boolean
  /** A readable error from the last turn, or null. */
  error: string | null
  send: (text: string) => void
  stop: () => void
  retry: () => void
  /** Undo is offered for changes made in this session; `undone` holds the tool calls already undone. */
  canUndo: (toolCallId: string) => boolean
  undone: ReadonlySet<string>
  undo: (toolCallId: string, output: UpdateBlueprintOutput) => void
}

const BlueprintChatContext = createContext<BlueprintChat | null>(null)

export function useBlueprintChat(): BlueprintChat {
  const value = useContext(BlueprintChatContext)
  if (!value) throw new Error("useBlueprintChat must be used within BlueprintChatProvider")
  return value
}

/** Every finished `updateBlueprint` call in a conversation, oldest first. */
function finishedUpdates(messages: BlueprintMessage[]) {
  return messages.flatMap((message) =>
    message.parts.flatMap((part) =>
      part.type === "tool-updateBlueprint" && part.state === "output-available"
        ? [{ toolCallId: part.toolCallId, output: part.output }]
        : []
    )
  )
}

/** The route answers errors as `{ "error": "..." }`; anything else is shown as is. */
function readable(error: Error | undefined): string | null {
  if (!error) return null
  try {
    return JSON.parse(error.message).error ?? error.message
  } catch {
    return error.message
  }
}

/**
 * Connects the chat to the Blueprint the person is looking at.
 *
 * Outgoing: every message carries the Blueprint as it is on screen right now, so the agent
 * never works on a stale copy.
 * Incoming: the agent's tool returns a list of changes. As soon as one arrives (mid-stream),
 * it is applied to the on-screen Blueprint through `onBlueprintChange`, which is the same
 * function every other edit uses, so the document re-renders and the autosave stores it.
 *
 * Each tool call is applied exactly once. The chat re-renders many times while a reply
 * streams, and restored history holds calls the stored Blueprint already contains, so applied
 * call ids are remembered in a ref.
 */
export function BlueprintChatProvider({
  id,
  blueprint,
  onBlueprintChange,
  initialMessages = [],
  children,
}: {
  id: number
  blueprint: Blueprint
  onBlueprintChange: (next: Blueprint) => void
  initialMessages?: BlueprintMessage[]
  children: React.ReactNode
}) {
  const latest = useRef(blueprint)
  useEffect(() => {
    latest.current = blueprint
  }, [blueprint])

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/agents/blueprint" }), [])
  const { messages, sendMessage, regenerate, status, stop, error } = useChat<BlueprintMessage>({
    id: `blueprint-${id}`,
    transport,
    messages: initialMessages,
  })

  const applied = useRef(new Set(finishedUpdates(initialMessages).map((update) => update.toolCallId)))
  const [session, setSession] = useState<ReadonlySet<string>>(new Set())
  const [undone, setUndone] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    const fresh = finishedUpdates(messages).filter((update) => !applied.current.has(update.toolCallId))
    if (fresh.length === 0) return

    let next = latest.current
    for (const update of fresh) {
      applied.current.add(update.toolCallId)
      next = replayChanges(next, update.output.applied)
    }
    latest.current = next
    onBlueprintChange(next)
    setSession((previous) => new Set([...previous, ...fresh.map((update) => update.toolCallId)]))
  }, [messages, onBlueprintChange])

  // Not `id`: useChat puts its own chat id in the body under that name, and it would win.
  const request = useCallback(() => ({ body: { blueprintId: id, blueprint: latest.current } }), [id])

  const value = useMemo<BlueprintChat>(
    () => ({
      messages,
      busy: status === "submitted" || status === "streaming",
      error: status === "error" ? readable(error) : null,
      send: (text) => void sendMessage({ text }, request()),
      stop: () => void stop(),
      retry: () => void regenerate(request()),
      canUndo: (toolCallId) => session.has(toolCallId),
      undone,
      undo: (toolCallId, output) => {
        const next = revertChanges(latest.current, output.applied)
        latest.current = next
        onBlueprintChange(next)
        setUndone((previous) => new Set([...previous, toolCallId]))
      },
    }),
    [messages, status, error, sendMessage, stop, regenerate, request, session, undone, onBlueprintChange]
  )

  return <BlueprintChatContext.Provider value={value}>{children}</BlueprintChatContext.Provider>
}

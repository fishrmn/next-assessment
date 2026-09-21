"use client"

import { SparklesIcon } from "lucide-react"

import { useBlueprintChat } from "@/components/blueprint-chat/context"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"

/**
 * The agent, tucked away while the Blueprint has the screen. It is not only a button: it says
 * what the agent is doing or waiting for, so the agent can get the person's attention without
 * taking their screen. "Working", "3 changes", "Has a question for you", or just "Agent".
 */
export function AgentPill({ onOpen }: { onOpen: () => void }) {
  const { messages, busy, undone, canUndo } = useBlueprintChat()

  const last = messages[messages.length - 1]
  const parts = last?.role === "assistant" ? last.parts : []
  const changes = parts.reduce(
    (count, part) =>
      // Only changes made during this visit are news; restored history is not.
      part.type === "tool-updateBlueprint" &&
      part.state === "output-available" &&
      canUndo(part.toolCallId) &&
      !undone.has(part.toolCallId)
        ? count + part.output.applied.length
        : count,
    0
  )
  const asks = parts.some((part) => part.type === "text" && part.text.trim().endsWith("?"))

  const label = busy
    ? "Working on it"
    : asks
      ? "Has a question for you"
      : changes > 0
        ? `${changes} ${changes === 1 ? "change" : "changes"} made`
        : "Agent"

  return (
    <Button
      onClick={onOpen}
      size="lg"
      aria-label={`Open the agent. ${label}`}
      className="fixed right-4 bottom-4 z-30 h-11 rounded-full pr-3 pl-4 shadow-lg transition-[scale,background-color] duration-150 ease-out active:scale-[0.96] md:right-8 md:bottom-8"
    >
      {busy ? <Spinner /> : <SparklesIcon />}
      <span role="status">{label}</span>
      <Kbd className="hidden bg-primary-foreground/15 text-primary-foreground lg:inline-flex">⌘J</Kbd>
    </Button>
  )
}

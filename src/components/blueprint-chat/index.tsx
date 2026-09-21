"use client"

import { BlueprintChatInput } from "@/components/blueprint-chat/input"
import { BlueprintChatMessages, type Stage } from "@/components/blueprint-chat/messages"
import { cn } from "@/lib/utils"

export { BlueprintChatProvider, useBlueprintChat } from "@/components/blueprint-chat/context"
export { AgentPill } from "@/components/blueprint-chat/agent-pill"
export { BlueprintChatInput } from "@/components/blueprint-chat/input"

/**
 * The conversation panel: a fixed-height box with the messages scrolling inside it, so the
 * message box never leaves the screen. It must sit inside a `BlueprintChatProvider`, which the
 * workspace places higher up because the page header also reads the conversation.
 */
export function BlueprintChat({
  stage,
  toolbar,
  className,
  ...props
}: Omit<React.ComponentProps<"section">, "children"> & {
  stage: Stage | null
  /** Controls for the panel itself (expand, close). The conversation does not know about layouts. */
  toolbar?: React.ReactNode
}) {
  return (
    <section
      aria-label="Blueprint agent"
      className={cn("flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card", className)}
      {...props}
    >
      {toolbar && (
        <header className="flex shrink-0 items-center justify-between gap-2 border-b py-1.5 pr-1.5 pl-4">
          <h2 className="text-sm font-medium">Agent</h2>
          <div className="flex items-center">{toolbar}</div>
        </header>
      )}
      <div className="min-h-0 flex-1">
        <BlueprintChatMessages stage={stage} />
      </div>
      <div className="border-t p-3">
        <BlueprintChatInput />
      </div>
    </section>
  )
}

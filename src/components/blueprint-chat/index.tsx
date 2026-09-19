"use client"

import { BlueprintChatInput } from "@/components/blueprint-chat/input"
import { BlueprintChatMessages, type Stage } from "@/components/blueprint-chat/messages"
import { cn } from "@/lib/utils"

export { BlueprintChatProvider, useBlueprintChat } from "@/components/blueprint-chat/context"
export { BlueprintChatInput } from "@/components/blueprint-chat/input"

/**
 * The conversation panel: a fixed-height box with the messages scrolling inside it, so the
 * message box never leaves the screen. It must sit inside a `BlueprintChatProvider`, which the
 * workspace places higher up because the page header also reads the conversation.
 */
export function BlueprintChat({ stage, className }: { stage: Stage | null; className?: string }) {
  return (
    <section
      aria-label="Blueprint agent"
      className={cn("flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card", className)}
    >
      <div className="min-h-0 flex-1">
        <BlueprintChatMessages stage={stage} />
      </div>
      <div className="border-t p-3">
        <BlueprintChatInput />
      </div>
    </section>
  )
}

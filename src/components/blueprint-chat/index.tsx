"use client"

import type { BlueprintMessage } from "@/agents/blueprint"
import { BlueprintChatProvider } from "@/components/blueprint-chat/context"
import { BlueprintChatInput } from "@/components/blueprint-chat/input"
import { BlueprintChatMessages, type Stage } from "@/components/blueprint-chat/messages"
import type { Blueprint } from "@/lib/blueprint/model"
import { completion } from "@/lib/blueprint/fields"
import { cn } from "@/lib/utils"

/**
 * The only way to edit a Blueprint: talk to the agent. A fixed-height panel with the
 * conversation scrolling inside it, so the message box never leaves the screen.
 */
export function BlueprintChat({
  id,
  blueprint,
  onBlueprintChange,
  initialMessages,
  className,
}: {
  id: number
  blueprint: Blueprint
  onBlueprintChange: (next: Blueprint) => void
  initialMessages?: BlueprintMessage[]
  className?: string
}) {
  const percent = completion(blueprint)
  const stage: Stage = percent === 0 ? "empty" : percent < 60 ? "partial" : "filled"

  return (
    <BlueprintChatProvider
      id={id}
      blueprint={blueprint}
      onBlueprintChange={onBlueprintChange}
      initialMessages={initialMessages}
    >
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
    </BlueprintChatProvider>
  )
}

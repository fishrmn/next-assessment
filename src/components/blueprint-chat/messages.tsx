"use client"

import { CircleAlertIcon } from "lucide-react"

import { Changes } from "@/components/blueprint-chat/changes"
import { useBlueprintChat } from "@/components/blueprint-chat/context"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { Message, MessageContent } from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Spinner } from "@/components/ui/spinner"

export type Stage = "partial" | "filled"

const greetings: Record<Stage, { text: string; suggestions: string[] }> = {
  partial: {
    text: "Tell me more about the brand, or ask me what is still open. Click any part of the blueprint to talk about it.",
    suggestions: ["What is still open?"],
  },
  filled: {
    text: "Does this feel like the brand? Tell me what doesn't, in your own words, or click the part that feels off.",
    suggestions: ["Make the tone more playful", "Swap the colors for something warmer", "We're more minimal than bold"],
  },
}

/** Shown before the first message. Static text: opening the chat costs no model call. */
function Greeting({ stage }: { stage: Stage }) {
  const { send, busy } = useBlueprintChat()
  const { text, suggestions } = greetings[stage]

  return (
    <Message>
      <MessageContent>
        <Bubble variant="ghost">
          <BubbleContent>{text}</BubbleContent>
        </Bubble>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => send(suggestion)}
              className="h-auto max-w-full justify-start py-1.5 text-left whitespace-normal"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </MessageContent>
    </Message>
  )
}

/**
 * The conversation. A user message is a bubble on the right. An assistant message is drawn
 * part by part: text as plain text, and each `updateBlueprint` call as its list of changes.
 */
export function BlueprintChatMessages({ stage }: { stage: Stage | null }) {
  const { messages, busy, error, retry, canUndo, undone, undo } = useBlueprintChat()
  const last = messages[messages.length - 1]
  const waiting = busy && (last?.role !== "assistant" || last.parts.length === 0)

  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller>
        <MessageScrollerViewport aria-label="Conversation">
          <MessageScrollerContent className="gap-4 p-4">
            {stage && (
              <MessageScrollerItem>
                <Greeting stage={stage} />
              </MessageScrollerItem>
            )}

            {messages.map((message) => (
              <MessageScrollerItem key={message.id} scrollAnchor={message.role === "user"}>
                <Message align={message.role === "user" ? "end" : "start"}>
                  <MessageContent>
                    {/* The agent's words first (what and why), then what it changed. The stream
                        delivers them the other way round. */}
                    {[
                      ...message.parts.filter((part) => part.type === "text"),
                      ...message.parts.filter((part) => part.type === "tool-updateBlueprint"),
                    ].map((part, index) => {
                      if (part.type === "text") {
                        if (!part.text) return null
                        return (
                          <Bubble key={index} variant={message.role === "user" ? "default" : "ghost"}>
                            <BubbleContent className="max-w-full whitespace-pre-wrap wrap-anywhere">
                              {part.text}
                            </BubbleContent>
                          </Bubble>
                        )
                      }
                      if (part.type !== "tool-updateBlueprint") return null
                      if (part.state === "output-available") {
                        return (
                          <Changes
                            key={part.toolCallId}
                            output={part.output}
                            undone={undone.has(part.toolCallId)}
                            onUndo={
                              canUndo(part.toolCallId)
                                ? () => undo(part.toolCallId, part.output)
                                : undefined
                            }
                          />
                        )
                      }
                      if (part.state === "output-error") {
                        return (
                          <Marker key={part.toolCallId}>
                            <MarkerIcon>
                              <CircleAlertIcon />
                            </MarkerIcon>
                            <MarkerContent>The change could not be applied: {part.errorText}</MarkerContent>
                          </Marker>
                        )
                      }
                      return (
                        <Marker key={part.toolCallId}>
                          <MarkerIcon>
                            <Spinner />
                          </MarkerIcon>
                          <MarkerContent>Working on the blueprint</MarkerContent>
                        </Marker>
                      )
                    })}
                  </MessageContent>
                </Message>
              </MessageScrollerItem>
            ))}

            {waiting && (
              <MessageScrollerItem>
                <Marker role="status">
                  <MarkerIcon>
                    <Spinner />
                  </MarkerIcon>
                  <MarkerContent>Thinking</MarkerContent>
                </Marker>
              </MessageScrollerItem>
            )}

            {error && (
              <MessageScrollerItem>
                <div role="alert" className="flex flex-col items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="max-w-full wrap-anywhere">{error}</p>
                  <Button variant="outline" size="sm" onClick={retry}>
                    Try again
                  </Button>
                </div>
              </MessageScrollerItem>
            )}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton className="bottom-3" />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}

"use client"

import { ArrowUpIcon, SquareIcon, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { useBlueprintChat } from "@/components/blueprint-chat/context"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group"

/** Enter sends, Shift+Enter adds a line. While a turn runs, the send button becomes Stop. */
export function BlueprintChatInput({ placeholder }: { placeholder?: string }) {
  const { send, stop, busy, about, setAbout } = useBlueprintChat()
  const [text, setText] = useState("")
  const field = useRef<HTMLTextAreaElement>(null)
  const wasBusy = useRef(false)

  // Hand the cursor back when the agent finishes, so the person can keep talking.
  useEffect(() => {
    if (wasBusy.current && !busy) field.current?.focus()
    wasBusy.current = busy
  }, [busy])

  // Pointing at a part of the document is an invitation to type about it.
  useEffect(() => {
    if (about) field.current?.focus()
  }, [about])

  function submit() {
    const message = text.trim()
    if (!message || busy) return
    send(message)
    setText("")
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <InputGroup>
        {about && (
          <InputGroupAddon align="block-start">
            <span className="flex max-w-full items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
              <span className="truncate">About “{about.label}”</span>
              <button
                type="button"
                aria-label="Stop talking about this part"
                onClick={() => setAbout(null)}
                className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          </InputGroupAddon>
        )}
        <InputGroupTextarea
          ref={field}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
            event.preventDefault()
            submit()
          }}
          aria-label="Message to the blueprint agent"
          placeholder={about ? "What feels off here?" : (placeholder ?? "Describe the brand, or a change…")}
          className="max-h-40 min-h-12"
          autoFocus
        />
        <InputGroupAddon align="block-end" className="justify-end">
          {busy ? (
            <InputGroupButton type="button" size="icon-xs" variant="outline" aria-label="Stop" onClick={stop}>
              <SquareIcon />
            </InputGroupButton>
          ) : (
            <InputGroupButton type="submit" size="icon-xs" variant="default" aria-label="Send" disabled={!text.trim()}>
              <ArrowUpIcon />
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}

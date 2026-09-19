"use client"

import { ArrowUpIcon, SquareIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { useBlueprintChat } from "@/components/blueprint-chat/context"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group"

/** Enter sends, Shift+Enter adds a line. While a turn runs, the send button becomes Stop. */
export function BlueprintChatInput() {
  const { send, stop, busy } = useBlueprintChat()
  const [text, setText] = useState("")
  const field = useRef<HTMLTextAreaElement>(null)
  const wasBusy = useRef(false)

  // Hand the cursor back when the agent finishes, so the person can keep talking.
  useEffect(() => {
    if (wasBusy.current && !busy) field.current?.focus()
    wasBusy.current = busy
  }, [busy])

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
          placeholder="Describe the brand, or a change…"
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

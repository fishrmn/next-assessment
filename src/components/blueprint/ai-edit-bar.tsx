import { ArrowUpIcon, SparklesIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

/**
 * Phase 2 entry point: describe a change in plain language and the Blueprint updates.
 * In this prototype the bar is visible but disabled, so its place in the layout can be judged.
 * It sits under the document because it edits the document.
 */
export function AiEditBar() {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur">
      <InputGroup>
        <InputGroupAddon>
          <SparklesIcon />
        </InputGroupAddon>
        <InputGroupInput
          disabled
          aria-label="Describe a change to the blueprint"
          placeholder="Describe a change: “make the tone more playful”"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton disabled size="icon-xs" variant="default" aria-label="Apply change">
            <ArrowUpIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p className="px-1 text-xs text-muted-foreground">
        AI editing is Phase 2. It needs an <code className="font-mono">OPENAI_API_KEY</code> in{" "}
        <code className="font-mono">.env.local</code>.
      </p>
    </div>
  )
}

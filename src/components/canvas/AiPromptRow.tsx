"use client"

import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAiEdit } from "@/hooks/use-ai-edit"
import type { AiEditMode, AiEditResult } from "@/services/blueprint-ai.types"

const COPY: Record<AiEditMode, { label: string; button: string; loading: string }> = {
  generate: {
    label: "Describe your brand — AI fills the blanks",
    button: "Generate with AI",
    loading: "Generating…",
  },
  revise: {
    label: "Describe a change — AI rewrites the blueprint",
    button: "Update with AI",
    loading: "Updating…",
  },
}

export function AiPromptRow({
  blueprintId,
  mode,
  onApplied,
}: {
  blueprintId: number
  mode: AiEditMode
  onApplied: (result: AiEditResult) => void
}) {
  const { status, error, apply } = useAiEdit(blueprintId)
  const [instruction, setInstruction] = useState("")
  const fieldId = useId()
  const copy = COPY[mode]
  const isLoading = status === "loading"

  const handleSubmit = async () => {
    const result = await apply(instruction, mode)
    if (result) {
      onApplied(result)
      setInstruction("")
    }
  }

  // Stacks on a phone: side by side, the textarea loses so much width to the
  // button that the prompt scrolls after a few words.
  return (
    <div className="no-print mb-[34px] flex flex-col items-stretch gap-3 border-b border-border pb-[22px] sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <label htmlFor={fieldId} className="sr-only">
          {copy.label}
        </label>
        <textarea
          id={fieldId}
          className="bp-in w-full resize-none text-[15px] leading-[1.6] italic"
          rows={2}
          placeholder="Describe your brand in a sentence or two — AI fills the blanks."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>

      <Button
        variant="outline"
        className="flex-none whitespace-nowrap"
        onClick={handleSubmit}
        disabled={isLoading || instruction.trim().length === 0}
      >
        {isLoading ? copy.loading : copy.button}
      </Button>
    </div>
  )
}

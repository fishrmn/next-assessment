"use client"

import { Loader2, Sparkles } from "lucide-react"
import { useState, useTransition } from "react"

import { aiEditPageAction } from "@/app/actions"
import type { PageConfig } from "@/components/builder/types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function AiAssist({
  config,
  onReplace,
}: {
  config: PageConfig
  onReplace: (config: PageConfig) => void
}) {
  const [prompt, setPrompt] = useState("")
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleApply() {
    setError(null)
    setSummary(null)
    startTransition(async () => {
      const result = await aiEditPageAction(prompt, config)
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (result.data.changed) {
        onReplace(result.data.config)
        setPrompt("")
      }
      setSummary(result.data.summary)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor="ai-prompt"
        className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        <Sparkles className="size-3.5 text-primary" aria-hidden />
        AI assist
      </Label>
      <Textarea
        id="ai-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder='Describe a change, e.g. "make the hero darker and the headline bigger"'
        rows={3}
        disabled={isPending}
      />
      <Button
        size="sm"
        onClick={handleApply}
        disabled={isPending || !prompt.trim()}
      >
        {isPending ? (
          <Loader2 data-icon="inline-start" className="animate-spin" />
        ) : (
          <Sparkles data-icon="inline-start" />
        )}
        {isPending ? "Applying..." : "Apply with AI"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {summary ? (
        <p role="status" className="text-sm text-muted-foreground">
          {summary}
        </p>
      ) : null}
    </div>
  )
}

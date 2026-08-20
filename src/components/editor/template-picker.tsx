"use client"

import { Loader2 } from "lucide-react"
import { useState, useTransition } from "react"

import { createPageAction } from "@/app/actions"
import { PageRenderer } from "@/components/builder/element-renderer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { templateList, type TemplateId } from "@/lib/templates"
import { cn } from "@/lib/utils"

export function TemplatePicker() {
  const [selected, setSelected] = useState<TemplateId>(templateList[0].id)
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      const result = await createPageAction({ name, templateId: selected })
      // On success the action redirects, so a result only arrives on failure.
      if (result && !result.ok) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-3" role="radiogroup" aria-label="Template">
        {templateList.map((template) => (
          <button
            key={template.id}
            type="button"
            role="radio"
            aria-checked={selected === template.id}
            onClick={() => setSelected(template.id)}
            className={cn(
              "flex flex-col overflow-hidden rounded-xl border text-left transition-shadow",
              selected === template.id
                ? "border-primary ring-2 ring-primary"
                : "hover:border-muted-foreground/40"
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none h-44 select-none overflow-hidden border-b bg-muted"
            >
              <div className="h-[800px] w-[1000px] origin-top-left scale-[0.28]">
                <PageRenderer config={template.config} />
              </div>
            </div>
            <div className="flex flex-col gap-1 p-4">
              <span className="font-semibold">{template.name}</span>
              <span className="text-sm text-muted-foreground">
                {template.description}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <Label htmlFor="page-name">Page name</Label>
        <div className="flex gap-2">
          <Input
            id="page-name"
            value={name}
            placeholder="e.g. My salon"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate()
            }}
          />
          <Button onClick={handleCreate} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
            Create page
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  )
}

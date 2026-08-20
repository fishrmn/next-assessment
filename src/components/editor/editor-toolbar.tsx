"use client"

import {
  ArrowLeft,
  Eye,
  Loader2,
  Maximize,
  PanelLeft,
  Save,
  Scissors,
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type ViewMode = "split" | "preview" | "fullscreen"

export function EditorToolbar({
  name,
  onNameChange,
  viewMode,
  onViewModeChange,
  dirty,
  isPending,
  onSave,
}: {
  name: string
  onNameChange: (name: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  dirty: boolean
  isPending: boolean
  onSave: () => void
}) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b bg-background px-3 py-2">
      <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Scissors className="size-3.5" aria-hidden />
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Back to pages"
        render={<Link href="/" />}
      >
        <ArrowLeft />
      </Button>
      <Input
        aria-label="Page name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="h-8 w-40 sm:w-56"
      />
      {dirty ? <Badge variant="outline">Unsaved changes</Badge> : null}

      <div className="ml-auto flex items-center gap-2">
        <ToggleGroup
          className="hidden lg:flex"
          value={[viewMode]}
          onValueChange={(groupValue) => {
            const next = groupValue[0] as ViewMode | undefined
            if (next) onViewModeChange(next)
          }}
        >
          <ToggleGroupItem value="split" aria-label="Side-by-side view">
            <PanelLeft />
          </ToggleGroupItem>
          <ToggleGroupItem value="preview" aria-label="Preview view">
            <Eye />
          </ToggleGroupItem>
          <ToggleGroupItem value="fullscreen" aria-label="Full-screen view">
            <Maximize />
          </ToggleGroupItem>
        </ToggleGroup>
        <Button
          className="lg:hidden"
          variant="outline"
          size="icon-sm"
          aria-label="Full-screen view"
          onClick={() => onViewModeChange("fullscreen")}
        >
          <Maximize />
        </Button>
        <Button size="sm" onClick={onSave} disabled={isPending || !dirty}>
          {isPending ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          Save
        </Button>
      </div>
    </header>
  )
}

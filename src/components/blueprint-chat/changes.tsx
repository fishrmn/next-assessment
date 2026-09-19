"use client"

import { ArrowRightIcon, CircleAlertIcon, PencilLineIcon, Undo2Icon } from "lucide-react"

import type { UpdateBlueprintOutput } from "@/agents/blueprint"
import { Button } from "@/components/ui/button"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { cn } from "@/lib/utils"

/**
 * What one `updateBlueprint` call did, as the person should see it: one row per field with
 * before and after in words, the values the Blueprint refused, and an Undo for the whole call.
 * This is the agent's transparency: nothing changes on the document without a row here.
 */
export function Changes({
  output,
  undone,
  onUndo,
}: {
  output: UpdateBlueprintOutput
  undone: boolean
  /** Absent for changes restored from history: they are already part of the saved Blueprint. */
  onUndo?: () => void
}) {
  if (output.applied.length === 0 && output.rejected.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3">
      {output.applied.map((change) => (
        <Marker key={change.path} className={cn(undone && "line-through opacity-60")}>
          <MarkerIcon>
            <PencilLineIcon />
          </MarkerIcon>
          <MarkerContent className="flex flex-wrap items-center gap-x-1.5">
            <span className="font-medium text-foreground">{change.label}</span>
            <span className="max-w-full wrap-anywhere">{change.from}</span>
            <ArrowRightIcon className="size-3 shrink-0" aria-label="changed to" />
            <span className="max-w-full wrap-anywhere text-foreground">{change.to}</span>
          </MarkerContent>
        </Marker>
      ))}
      {output.rejected.map((item) => (
        <Marker key={item.path}>
          <MarkerIcon>
            <CircleAlertIcon />
          </MarkerIcon>
          <MarkerContent>
            <span className="font-medium text-foreground">{item.label}</span> was not set: {item.reason}.
          </MarkerContent>
        </Marker>
      ))}
      {output.applied.length > 0 && (onUndo || undone) && (
        <div className="flex justify-end">
          {undone ? (
            <span className="text-xs text-muted-foreground">Undone</span>
          ) : (
            <Button variant="ghost" size="xs" onClick={onUndo}>
              <Undo2Icon />
              Undo
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

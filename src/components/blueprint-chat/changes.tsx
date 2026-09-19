"use client"

import { ArrowRightIcon, ChevronDownIcon, CircleAlertIcon, Undo2Icon } from "lucide-react"

import type { UpdateBlueprintOutput } from "@/agents/blueprint"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { cn } from "@/lib/utils"

/**
 * What one agent update did. The agent's own sentence says what changed and why; this row sits
 * under it with the two things a person needs next: take it back, or look closer. The field by
 * field list (it can be fifteen rows) stays folded until asked for. Values the Blueprint
 * refused are never folded away.
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
  const count = output.applied.length
  if (count === 0 && output.rejected.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
      {count > 0 && (
        <Collapsible>
          <div className="flex flex-wrap items-center gap-x-1">
            <span className={cn("tabular-nums", undone && "line-through")}>
              {count === 1 ? "1 change" : `${count} changes`}
            </span>
            {undone ? (
              <span>· Undone</span>
            ) : (
              onUndo && (
                <Button variant="ghost" size="xs" onClick={onUndo}>
                  <Undo2Icon />
                  Undo
                </Button>
              )
            )}
            <CollapsibleTrigger
              render={<Button variant="ghost" size="xs" className="group/details" />}
            >
              View details
              <ChevronDownIcon className="transition-[rotate] duration-150 ease-out group-data-panel-open/details:rotate-180" />
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <ul className={cn("mt-1.5 flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3", undone && "opacity-60")}>
              {output.applied.map((change) => (
                <li key={change.path} className="flex flex-wrap items-center gap-x-1.5">
                  <span className="font-medium text-foreground">{change.label}</span>
                  <span className="max-w-full wrap-anywhere">{change.from}</span>
                  <ArrowRightIcon className="size-3 shrink-0" aria-label="changed to" />
                  <span className="max-w-full wrap-anywhere text-foreground">{change.to}</span>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
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
    </div>
  )
}

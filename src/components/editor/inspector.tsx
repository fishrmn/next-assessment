"use client"

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"

import type {
  ElementConfig,
  ElementType,
  PageConfig,
} from "@/components/builder/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { elementMeta, elementTypes } from "./element-meta"

function elementLabel(element: ElementConfig): string {
  switch (element.type) {
    case "navbar":
      return element.brandName
    case "text":
      return element.text
    case "hero":
      return element.heading
    case "services":
    case "contact":
      return element.title
    case "gallery":
      return element.title ?? "Gallery"
    case "cta":
      return element.label
  }
}

export function Inspector({
  config,
  selectedId,
  onSelect,
  onMove,
  onRemove,
  onAdd,
}: {
  config: PageConfig
  selectedId: string | null
  onSelect: (id: string) => void
  onMove: (id: string, direction: "up" | "down") => void
  onRemove: (id: string) => void
  onAdd: (type: ElementType) => void
}) {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex flex-col gap-1.5">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Layers
        </h2>
        <ul className="flex flex-col gap-1">
          {config.map((element, index) => {
            const Icon = elementMeta[element.type].icon
            return (
              <li key={element.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelect(element.id!)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    element.id === selectedId
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-60" />
                  <span className="truncate">{elementLabel(element)}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {elementMeta[element.type].name}
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move ${elementMeta[element.type].name} up`}
                  disabled={index === 0}
                  onClick={() => onMove(element.id!, "up")}
                >
                  <ChevronUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move ${elementMeta[element.type].name} down`}
                  disabled={index === config.length - 1}
                  onClick={() => onMove(element.id!, "down")}
                >
                  <ChevronDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${elementMeta[element.type].name}`}
                  onClick={() => onRemove(element.id!)}
                >
                  <Trash2 />
                </Button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Add element
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {elementTypes.map((type) => {
            const Icon = elementMeta[type].icon
            return (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => onAdd(type)}
              >
                <Icon data-icon="inline-start" />
                {elementMeta[type].name}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

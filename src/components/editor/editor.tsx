"use client"

import { Minimize, Pencil, Eye } from "lucide-react"
import { useEffect, useReducer, useState, useTransition } from "react"

import { savePageAction } from "@/app/actions"
import { ElementRenderer } from "@/components/builder/element-renderer"
import type { ElementConfig, ElementType } from "@/components/builder/types"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { Page } from "@/db/types"
import { cn } from "@/lib/utils"

import { AiAssist } from "./ai-assist"
import { editorReducer, normalizeConfig } from "./editor-reducer"
import { EditorToolbar, type ViewMode } from "./editor-toolbar"
import { ElementForm } from "./element-forms"
import { defaultElementConfig, elementName } from "./element-meta"
import { Inspector } from "./inspector"

export function Editor({ initialPage }: { initialPage: Page }) {
  const [config, dispatch] = useReducer(
    editorReducer,
    initialPage.config,
    normalizeConfig
  )
  const [name, setName] = useState(initialPage.name)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("split")
  const [mobilePane, setMobilePane] = useState<"edit" | "preview">("edit")
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const apply = (action: Parameters<typeof editorReducer>[1]) => {
    dispatch(action)
    setDirty(true)
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await savePageAction(initialPage.id, { name, config })
      if (result.ok) {
        setDirty(false)
      } else {
        setError(result.error)
      }
    })
  }

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  useEffect(() => {
    if (viewMode !== "fullscreen") return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewMode("split")
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [viewMode])

  const showInspector = viewMode === "split"
  const selected = config.find((element) => element.id === selectedId) ?? null

  return (
    <div className="flex min-h-dvh w-full flex-col">
      <EditorToolbar
        name={name}
        onNameChange={(value) => {
          setName(value)
          setDirty(true)
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        dirty={dirty}
        isPending={isPending}
        onSave={handleSave}
      />

      {error ? (
        <p role="alert" className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {showInspector ? (
        <div className="flex gap-2 border-b px-3 py-2 lg:hidden">
          <Button
            variant={mobilePane === "edit" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMobilePane("edit")}
          >
            <Pencil data-icon="inline-start" />
            Edit
          </Button>
          <Button
            variant={mobilePane === "preview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMobilePane("preview")}
          >
            <Eye data-icon="inline-start" />
            Preview
          </Button>
        </div>
      ) : null}

      <div
        className={cn(
          "flex-1",
          showInspector &&
            "lg:grid lg:grid-cols-[280px_minmax(0,1fr)_320px]"
        )}
      >
        {showInspector ? (
          <aside
            className={cn(
              "border-r bg-background lg:block lg:h-[calc(100dvh-49px)] lg:overflow-y-auto",
              mobilePane === "edit" ? "block" : "hidden"
            )}
          >
            <Inspector
              config={config}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={(id, direction) => apply({ type: "move", id, direction })}
              onRemove={(id) => {
                apply({ type: "remove", id })
                if (id === selectedId) setSelectedId(null)
              }}
              onAdd={(type: ElementType) => {
                const element = defaultElementConfig(type)
                apply({ type: "add", element })
                setSelectedId(element.id!)
              }}
            />
          </aside>
        ) : null}

        <div
          className={cn(
            "bg-muted/50 lg:h-[calc(100dvh-49px)] lg:overflow-y-auto",
            showInspector && mobilePane === "edit" ? "hidden lg:block" : "block"
          )}
        >
          <div className="mx-auto flex max-w-5xl flex-col px-4 py-6 sm:px-8">
            <div className="mb-3 flex items-center gap-2 px-1 text-xs text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                Desktop
              </span>
              <span className="truncate font-medium">{name}</span>
            </div>
            <div className="overflow-hidden rounded-xl border bg-background text-foreground shadow-lg ring-1 ring-foreground/5">
              {config.map((element: ElementConfig) => (
                <div
                  key={element.id}
                  onClick={() => setSelectedId(element.id!)}
                  className={cn(
                    "cursor-pointer ring-inset transition-shadow",
                    element.id === selectedId
                      ? "ring-2 ring-primary"
                      : "hover:ring-2 hover:ring-primary/30"
                  )}
                >
                  <ElementRenderer config={element} />
                </div>
              ))}
              {config.length === 0 ? (
                <p className="px-6 py-16 text-center text-sm text-muted-foreground">
                  This page is empty — add an element from the panel.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {showInspector ? (
          <aside
            className={cn(
              "border-t bg-background lg:block lg:h-[calc(100dvh-49px)] lg:overflow-y-auto lg:border-l lg:border-t-0",
              mobilePane === "edit" ? "block" : "hidden"
            )}
          >
            <div className="flex flex-col gap-5 p-4">
              <AiAssist
                config={config}
                onReplace={(next) => apply({ type: "replace", config: next })}
              />
              <Separator />
              {selected ? (
                <div className="flex flex-col gap-4 pb-8">
                  <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {elementName(selected.type)} settings
                  </h2>
                  <ElementForm
                    config={selected}
                    onChange={(patch) =>
                      apply({ type: "update", id: selected.id!, patch })
                    }
                  />
                </div>
              ) : (
                <p className="px-1 text-sm text-muted-foreground">
                  Select an element in the list or click it in the preview to
                  edit its settings.
                </p>
              )}
            </div>
          </aside>
        ) : null}
      </div>

      {viewMode === "fullscreen" ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
          <div className="bg-background text-foreground">
            {config.map((element) => (
              <ElementRenderer key={element.id} config={element} />
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="fixed right-4 top-4 shadow-lg"
            onClick={() => setViewMode("split")}
          >
            <Minimize data-icon="inline-start" />
            Exit full screen
          </Button>
        </div>
      ) : null}
    </div>
  )
}

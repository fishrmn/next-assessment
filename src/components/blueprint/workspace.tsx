"use client"

import { CheckIcon, MaximizeIcon, TriangleAlertIcon } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import type { BlueprintMessage } from "@/agents/blueprint"
import { saveBlueprint } from "@/actions/blueprints"
import { BlueprintChat } from "@/components/blueprint-chat"
import { BlueprintDocument } from "@/components/blueprint/blueprint-document"
import { PageHeader } from "@/components/page-header"
import { buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { completion } from "@/lib/blueprint/fields"
import type { Blueprint } from "@/lib/blueprint/model"
import { cn } from "@/lib/utils"

type SaveStatus = "saved" | "saving" | "error"

/**
 * The working screen for one Blueprint: the agent's chat on the left, the live document on
 * the right. It owns the Blueprint while the session is open.
 *
 * - The chat is the only editor. Every change the agent makes arrives through `update`, so the
 *   document re-renders immediately.
 * - Changes are saved on their own after a short pause. There is no save button, and the
 *   browser is the only writer of the Blueprint: the agent never touches the database.
 */
export function Workspace({
  id,
  initial,
  initialMessages,
}: {
  id: number
  initial: Blueprint
  initialMessages?: BlueprintMessage[]
}) {
  const [blueprint, setBlueprint] = useState(initial)
  const [status, setStatus] = useState<SaveStatus>("saved")
  const [view, setView] = useState<"chat" | "blueprint">("chat")
  const saved = useRef(initial)

  const update = useCallback((next: Blueprint) => {
    setBlueprint(next)
    setStatus("saving")
  }, [])

  useEffect(() => {
    if (blueprint === saved.current) return
    const timer = setTimeout(async () => {
      const result = await saveBlueprint(id, blueprint).catch(() => null)
      if (result?.ok) {
        saved.current = blueprint
        setStatus("saved")
      } else {
        setStatus("error")
        toast.error(result?.message ?? "Could not save. Check that the app is still running.")
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [id, blueprint])

  return (
    <>
      <PageHeader
        title={blueprint.business.name || "Untitled brand"}
        description={`${completion(blueprint)}% captured`}
        actions={
          <>
            <SaveIndicator status={status} />
            <Link href={`/blueprints/${id}/present`} className={cn(buttonVariants({ variant: "outline" }))}>
              <MaximizeIcon />
              Present
            </Link>
          </>
        }
      />

      <Tabs value={view} onValueChange={(next) => setView(next as typeof view)} className="lg:hidden">
        <TabsList className="w-full">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="blueprint">Blueprint</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* The chat keeps a fixed height and scrolls inside, so its message box stays on screen while
            the long document scrolls with the page. The numbers are the shell's header and padding,
            the page header, and (below lg) the tabs. */}
        <BlueprintChat
          id={id}
          blueprint={blueprint}
          onBlueprintChange={update}
          initialMessages={initialMessages}
          className={cn(
            "h-[calc(100svh-var(--header-height)-13.5rem)] min-h-96 lg:sticky lg:top-6 lg:flex lg:h-[calc(100svh-var(--header-height)-10.5rem)]",
            view === "chat" ? "flex" : "hidden"
          )}
        />
        <BlueprintDocument
          blueprint={blueprint}
          className={cn("lg:block", view !== "blueprint" && "hidden")}
        />
      </div>
    </>
  )
}

/** Autosave feedback next to the screen's actions: the static cue that a change is safe. */
function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <span
      role="status"
      className={cn(
        "flex items-center gap-1.5 text-sm text-muted-foreground",
        status === "error" && "text-destructive"
      )}
    >
      {status === "saving" && <Spinner />}
      {status === "saved" && <CheckIcon className="size-4" />}
      {status === "error" && <TriangleAlertIcon className="size-4" />}
      {status === "saving" ? "Saving" : status === "saved" ? "Saved" : "Not saved"}
    </span>
  )
}

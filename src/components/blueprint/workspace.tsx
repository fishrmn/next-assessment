"use client"

import { CheckIcon, MaximizeIcon, ThumbsUpIcon, TriangleAlertIcon } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import type { BlueprintMessage } from "@/agents/blueprint"
import { saveBlueprint } from "@/actions/blueprints"
import {
  BlueprintChat,
  BlueprintChatInput,
  BlueprintChatProvider,
  useBlueprintChat,
} from "@/components/blueprint-chat"
import { BlueprintDocument } from "@/components/blueprint/blueprint-document"
import { DeleteBlueprint } from "@/components/delete-blueprint"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { scopeLabel } from "@/lib/blueprint/document-sections"
import { completion, openFacts, stageOf, statusOf } from "@/lib/blueprint/fields"
import type { Blueprint } from "@/lib/blueprint/model"
import { cn } from "@/lib/utils"

type SaveStatus = "saved" | "saving" | "error"

/**
 * The working screen for one Blueprint. It owns the Blueprint while the screen is open:
 * every change lands in local state (so the document re-renders at once) and is saved on its own
 * after a short pause. The browser is the only writer of the Blueprint; the agent never saves.
 *
 * The screen is built around three moments of a person who may know nothing about branding:
 * 1. Starting: one invitation and a text box. No document full of blanks, no progress to fill.
 * 2. Judging the first proposal: the document takes the room, led by the direction the agent
 *    chose and why. The chat sits beside it.
 * 3. Asking for a correction: say it, or click the part that feels off and say it.
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
  const saved = useRef(initial)

  const update = useCallback((next: Blueprint) => {
    setBlueprint(next)
    setStatus("saving")
  }, [])

  // A change by the agent reopens the review: "this represents us" was said about another version.
  const updateFromAgent = useCallback(
    (next: Blueprint) => update({ ...next, review: { confirmed: false } }),
    [update]
  )

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
    <BlueprintChatProvider
      id={id}
      blueprint={blueprint}
      onBlueprintChange={updateFromAgent}
      initialMessages={initialMessages}
    >
      <Screen id={id} blueprint={blueprint} status={status} onChange={update} />
    </BlueprintChatProvider>
  )
}

function Screen({
  id,
  blueprint,
  status,
  onChange,
}: {
  id: number
  blueprint: Blueprint
  status: SaveStatus
  onChange: (next: Blueprint) => void
}) {
  const { messages, updates, about, setAbout, send, busy } = useBlueprintChat()
  const [view, setView] = useState<"chat" | "blueprint">("chat")
  const name = blueprint.business.name || "Untitled brand"
  const remove = <DeleteBlueprint id={id} name={name} from="workspace" />

  // Moment 1. Nothing to show yet and nothing said yet: an invitation, and little else.
  if (stageOf(blueprint) === "start" && messages.length === 0) {
    const example =
      "We're Patio, a neighborhood café. We know our regulars by name, and we'd like people to feel at home, not like they walked into a fancy place."
    return (
      <>
        <div className="flex justify-end">{remove}</div>
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 pb-24">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Let&apos;s give your brand a shape
            </h1>
            <p className="text-lg text-pretty text-muted-foreground">
              Tell me what your business does and how you&apos;d like people to feel when they come
              across it. That is enough for a first proposal, which you can then adjust.
            </p>
            <p className="text-sm text-muted-foreground italic">
              You don&apos;t need colors, fonts or perfect answers.
            </p>
          </div>
          <BlueprintChatInput placeholder="We're a…" />
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => send(example)}
            className="h-auto justify-start py-2 text-left font-normal whitespace-normal text-muted-foreground"
          >
            <span>
              <span className="font-medium text-foreground">Try an example. </span>“{example}”
            </span>
          </Button>
        </div>
      </>
    )
  }

  // Between the moments: a conversation has started but there is no proposal to show yet.
  if (stageOf(blueprint) === "start") {
    return (
      <>
        <PageHeader title={name} actions={remove} />
        <BlueprintChat
          stage={null}
          className="mx-auto h-[calc(100svh-var(--header-height)-10.5rem)] min-h-96 w-full max-w-2xl"
        />
      </>
    )
  }

  // Moments 2 and 3. The document leads; the chat accompanies the review.
  const label = statusOf(blueprint, updates)
  const open = openFacts(blueprint)
  const stillOpen =
    open.length === 0
      ? null
      : `Still open: ${open.slice(0, 3).map((field) => field.label.toLowerCase()).join(", ")}${open.length > 3 ? ` and ${open.length - 3} more` : ""}`

  return (
    <>
      <PageHeader
        title={name}
        description={stillOpen ?? undefined}
        actions={
          <>
            <SaveIndicator status={status} />
            {blueprint.review.confirmed ? (
              <Badge variant="secondary">
                <CheckIcon />
                {label}
              </Badge>
            ) : (
              <>
                <Badge variant="outline">{label}</Badge>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => onChange({ ...blueprint, review: { confirmed: true } })}
                >
                  <ThumbsUpIcon />
                  This represents us
                </Button>
              </>
            )}
            <Link href={`/blueprints/${id}/present`} className={cn(buttonVariants({ variant: "outline" }))}>
              <MaximizeIcon />
              Present
            </Link>
            {remove}
          </>
        }
      />

      <Tabs value={view} onValueChange={(next) => setView(next as typeof view)} className="lg:hidden">
        <TabsList className="w-full">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="blueprint">Blueprint</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(20rem,2fr)_minmax(0,3fr)]">
        {/* The chat keeps a fixed height and scrolls inside, so its message box stays on screen while
            the long document scrolls with the page. The numbers are the shell's header and padding,
            the page header, and (below lg) the tabs. */}
        <BlueprintChat
          stage={completion(blueprint) < 60 ? "partial" : "filled"}
          className={cn(
            "h-[calc(100svh-var(--header-height)-13.5rem)] min-h-96 lg:sticky lg:top-6 lg:flex lg:h-[calc(100svh-var(--header-height)-10.5rem)]",
            view === "chat" ? "flex" : "hidden"
          )}
        />
        <BlueprintDocument
          blueprint={blueprint}
          review={{
            confirmed: blueprint.review.confirmed,
            picked: about?.id ?? null,
            onPick: (picked) => {
              setAbout(about?.id === picked ? null : { id: picked, label: scopeLabel(picked) })
              // Below lg the input lives in the other tab.
              setView("chat")
            },
          }}
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

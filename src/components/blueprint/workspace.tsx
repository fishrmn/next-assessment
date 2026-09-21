"use client"

import {
  CheckIcon,
  Maximize2Icon,
  MaximizeIcon,
  Minimize2Icon,
  ThumbsUpIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import type { BlueprintMessage } from "@/agents/blueprint"
import { saveBlueprint } from "@/actions/blueprints"
import {
  AgentPill,
  BlueprintChat,
  BlueprintChatInput,
  BlueprintChatProvider,
  useBlueprintChat,
} from "@/components/blueprint-chat"
import { BlueprintDocument } from "@/components/blueprint/blueprint-document"
import { defaultMode, useChosenMode, type Mode } from "@/components/blueprint/mode"
import { DeleteBlueprint } from "@/components/delete-blueprint"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
 * The screen is one conversation and one document in three layouts (`mode.ts`), and the layout
 * follows the moment of a person who may know nothing about branding:
 * 1. Starting: the agent has the screen. One invitation and a text box, no document full of blanks.
 * 2. Judging and correcting a proposal: the agent is docked beside the document. Say what feels
 *    off, or click the part that does.
 * 3. A Blueprint the person confirmed: the document has the screen, the agent is a button that
 *    says what it is doing. The person's own choice of layout always wins over these defaults.
 */
export function Workspace({
  id,
  initial,
  initialMessages,
  initialUndone,
}: {
  id: number
  initial: Blueprint
  initialMessages?: BlueprintMessage[]
  initialUndone?: string[]
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
      initialUndone={initialUndone}
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
  const [chosen, choose] = useChosenMode(id)
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

  // From here on it is one tree in three layouts. The chat and the document stay mounted in all of
  // them, so switching layout never loses the conversation's scroll or a half-typed message.
  const hasProposal = stageOf(blueprint) === "proposal"
  // Until there is a proposal there is nothing to put next to the conversation.
  const mode: Mode = hasProposal ? (chosen ?? defaultMode("proposal", blueprint.review.confirmed)) : "agent"

  const label = statusOf(blueprint, updates)
  const open = openFacts(blueprint)
  const stillOpen =
    open.length === 0
      ? null
      : `Still open: ${open.slice(0, 3).map((field) => field.label.toLowerCase()).join(", ")}${open.length > 3 ? ` and ${open.length - 3} more` : ""}`

  return (
    <>
      <ModeShortcuts mode={mode} enabled={hasProposal} onChange={choose} />
      <PageHeader
        title={name}
        description={stillOpen ?? undefined}
        actions={
          <>
            {hasProposal && <SaveIndicator status={status} />}
            {hasProposal &&
              (blueprint.review.confirmed ? (
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
              ))}
            {hasProposal && (
              <Link href={`/blueprints/${id}/present`} className={cn(buttonVariants({ variant: "outline" }))}>
                <MaximizeIcon />
                Present
              </Link>
            )}
            {remove}
          </>
        }
      />

      {/* Two columns whose widths say who leads. Animating the template makes the agent push the
          document aside instead of covering it: the document is what the person came to watch. */}
      <div
        className={cn(
          "grid items-start transition-[grid-template-columns,gap] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
          mode === "document" && "gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,0fr)]",
          mode === "side" && "gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]",
          mode === "agent" && "gap-0 lg:grid-cols-[minmax(0,0fr)_minmax(0,1fr)]"
        )}
      >
        <div
          inert={mode === "agent"}
          className={cn(
            "min-w-0 transition-opacity duration-200 ease-out motion-reduce:transition-none",
            mode === "agent" ? "max-lg:hidden lg:h-0 lg:overflow-hidden lg:opacity-0" : "opacity-100",
            // Below lg the agent is a panel over the bottom of the screen: leave room to scroll past it.
            mode === "side" && "max-lg:pb-[64svh]"
          )}
        >
          <BlueprintDocument
            blueprint={blueprint}
            details="folded"
            className="mx-auto w-full max-w-4xl"
            review={{
              confirmed: blueprint.review.confirmed,
              picked: about?.id ?? null,
              onPick: (picked) => {
                setAbout(about?.id === picked ? null : { id: picked, label: scopeLabel(picked) })
                // Pointing at a part is asking to talk about it.
                if (mode === "document") choose("side")
              },
            }}
          />
        </div>

        <BlueprintChat
          inert={mode === "document"}
          stage={hasProposal ? (completion(blueprint) < 60 ? "partial" : "filled") : null}
          toolbar={
            hasProposal && (
              <>
                {mode === "agent" ? (
                  <PanelButton label="Show the blueprint beside the agent" shortcut="⌘⇧J" onClick={() => choose("side")}>
                    <Minimize2Icon />
                  </PanelButton>
                ) : (
                  <PanelButton label="Give the agent the whole screen" shortcut="⌘⇧J" onClick={() => choose("agent")}>
                    <Maximize2Icon />
                  </PanelButton>
                )}
                <PanelButton label="Tuck the agent away" shortcut="⌘J" onClick={() => choose("document")}>
                  <XIcon />
                </PanelButton>
              </>
            )
          }
          className={cn(
            "min-h-96 transition-opacity duration-200 ease-out motion-reduce:transition-none",
            mode === "document" && "max-lg:hidden lg:h-0 lg:min-h-0 lg:border-0 lg:opacity-0",
            mode === "side" &&
              "opacity-100 max-lg:fixed max-lg:inset-x-2 max-lg:bottom-2 max-lg:z-30 max-lg:h-[62svh] max-lg:min-h-0 max-lg:shadow-2xl lg:sticky lg:top-6 lg:h-[calc(100svh-var(--header-height)-10.5rem)]",
            mode === "agent" &&
              "mx-auto h-[calc(100svh-var(--header-height)-10.5rem)] w-full max-w-2xl opacity-100"
          )}
        />
      </div>

      {mode === "document" && <AgentPill onOpen={() => choose("side")} />}
    </>
  )
}

function PanelButton({
  label,
  shortcut,
  onClick,
  children,
}: {
  label: string
  shortcut: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {label} <Kbd>{shortcut}</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * ⌘J (Ctrl+J) opens and tucks away the agent. ⌘⇧J gives it the whole screen and takes it back.
 * Esc tucks it away, unless a text field has the focus: there Esc belongs to the field.
 */
function ModeShortcuts({
  mode,
  enabled,
  onChange,
}: {
  mode: Mode
  enabled: boolean
  onChange: (mode: Mode) => void
}) {
  useEffect(() => {
    if (!enabled) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault()
        if (event.shiftKey) onChange(mode === "agent" ? "side" : "agent")
        else onChange(mode === "document" ? "side" : "document")
      } else if (event.key === "Escape" && mode === "side" && !typing) {
        onChange("document")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [mode, enabled, onChange])

  return null
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

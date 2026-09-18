"use client"

import { CheckIcon, MaximizeIcon, MousePointerClickIcon, TriangleAlertIcon } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { saveBlueprint } from "@/actions/blueprints"
import { AiEditBar } from "@/components/blueprint/ai-edit-bar"
import { BlueprintDocument } from "@/components/blueprint/blueprint-document"
import { Inspector } from "@/components/blueprint/inspector"
import { FontPicker, PalettePicker, TraitPicker } from "@/components/blueprint/pickers"
import { PositioningSentence } from "@/components/blueprint/positioning-sentence"
import { ThisOrThat } from "@/components/blueprint/this-or-that"
import { PageHeader } from "@/components/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import { SECTION_IDS, type Blueprint, type SectionId } from "@/lib/blueprint/model"
import { completion } from "@/lib/blueprint/fields"
import {
  QUESTIONS,
  isQuestionId,
  readScale,
  scaleField,
  sectionOf,
  writeScale,
  type QuestionId,
  type ScaleId,
} from "@/lib/blueprint/registry"
import { cn } from "@/lib/utils"

type SaveStatus = "saved" | "saving" | "error"

const copy: Partial<Record<QuestionId, { title: string; description: string }>> = {
  basics: {
    title: "Tell us about the business",
    description: "Fill in the blanks. Rough answers are fine, you can come back to any of them.",
  },
  personality: {
    title: "If the brand were a person, how would friends describe them?",
    description: "Pick up to three.",
  },
  color: {
    title: "Which palette feels like the brand?",
    description: "Go with your gut. The blueprint takes on the colors so you can judge them in place.",
  },
  typography: {
    title: "Which lettering feels like the brand?",
    description: "Each card shows the brand's name in that style.",
  },
}

/**
 * The working screen for one Blueprint: the intake on the left (one question at a time), the
 * live document on the right. It owns the Blueprint while the session is open.
 *
 * - Every answer updates local state, so the document re-renders immediately.
 * - Changes are saved on their own after a short pause. There is no save button.
 * - The current question lives in the URL (`?q=`), so the sidebar can link to a section,
 *   a reload keeps the place, and the browser's back button steps through questions.
 * - The inspect tool lives in the URL too (`?inspect=on`, or `?inspect=<section>` once a section
 *   is picked). While it is on, the left panel shows the inspector instead of the question.
 */
export function Workspace({ id, initial }: { id: number; initial: Blueprint }) {
  const [blueprint, setBlueprint] = useState(initial)
  const [status, setStatus] = useState<SaveStatus>("saved")
  const [view, setView] = useState<"answer" | "blueprint">("answer")
  const saved = useRef(initial)

  const searchParams = useSearchParams()
  const param = searchParams.get("q")
  const question: QuestionId = isQuestionId(param) ? param : "basics"
  const inspectParam = searchParams.get("inspect")
  const inspecting = inspectParam !== null
  const selected = SECTION_IDS.find((id) => id === inspectParam) ?? null
  const index = QUESTIONS.indexOf(question)
  const section = sectionOf(question)
  const brand = blueprint.business.name || "the brand"

  function update(next: Blueprint) {
    setBlueprint(next)
    setStatus("saving")
  }

  function go(to: QuestionId) {
    window.history.pushState(null, "", `?q=${to}`)
  }

  /** "on" = picking, a section id = editing that section, null = inspect tool off. */
  function inspect(target: SectionId | "on" | null) {
    const next = new URLSearchParams(window.location.search)
    if (target === null) next.delete("inspect")
    else next.set("inspect", target)
    // Replace, not push: the back button should leave the tool, not replay every section clicked.
    window.history.replaceState(null, "", `?${next}`)
    // At phone width the inspector and the document are separate tabs.
    if (target !== null) setView(target === "on" ? "blueprint" : "answer")
  }

  // Esc steps out, like DevTools: first out of the section, then out of the tool.
  useEffect(() => {
    if (!inspecting) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return
      const next = new URLSearchParams(window.location.search)
      if (SECTION_IDS.some((id) => id === next.get("inspect"))) next.set("inspect", "on")
      else next.delete("inspect")
      window.history.replaceState(null, "", `?${next}`)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [inspecting])

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

  const { expression } = blueprint
  const heading = copy[question] ?? {
    title: scaleField(question as ScaleId).question(brand),
    description: "Pick the one that feels closer. There is no wrong answer.",
  }
  const percent = completion(blueprint)

  return (
    <>
      <PageHeader
        title={blueprint.business.name || "Untitled brand"}
        description={`Guided session · ${percent}% captured`}
        actions={
          <>
            <SaveIndicator status={status} />
            <Link
              href={`/blueprints/${id}/present`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <MaximizeIcon />
              Present
            </Link>
          </>
        }
      />

      <Tabs
        value={view}
        onValueChange={(next) => setView(next as typeof view)}
        className="lg:hidden"
      >
        <TabsList className="w-full">
          <TabsTrigger value="answer">Answer</TabsTrigger>
          <TabsTrigger value="blueprint">Blueprint</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {inspecting && (
          <Inspector
            blueprint={blueprint}
            selected={selected}
            onChange={update}
            onDone={() => inspect(null)}
            className={cn("lg:sticky lg:top-6 lg:flex", view !== "answer" && "hidden")}
          />
        )}
        <Card
          className={cn(
            "lg:sticky lg:top-6 lg:flex",
            view !== "answer" && "hidden",
            inspecting && "hidden lg:hidden"
          )}
        >
          <CardHeader>
            <div className="flex flex-col gap-2 pb-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground tabular-nums">
                <span>
                  {section.layer} · {section.title}
                </span>
                <span>
                  {index + 1} of {QUESTIONS.length}
                </span>
              </div>
              <Progress value={((index + 1) / QUESTIONS.length) * 100} aria-label="Session progress" />
            </div>
            <CardTitle className="text-xl text-balance">{heading.title}</CardTitle>
            <CardDescription>{heading.description}</CardDescription>
          </CardHeader>
          <CardContent key={question} className="animate-in duration-200 fade-in-0 slide-in-from-bottom-1">
            {question === "basics" ? (
              <PositioningSentence
                business={blueprint.business}
                onChange={(business) => update({ ...blueprint, business })}
              />
            ) : question === "personality" ? (
              <TraitPicker
                value={expression.personality}
                onChange={(personality) =>
                  update({ ...blueprint, expression: { ...expression, personality } })
                }
              />
            ) : question === "color" ? (
              <PalettePicker
                brand={brand}
                color={expression.color}
                onPick={(preset) =>
                  update({
                    ...blueprint,
                    expression: {
                      ...expression,
                      color: { palette: preset.palette },
                    },
                  })
                }
              />
            ) : question === "typography" ? (
              <FontPicker
                brand={brand}
                value={expression.typography.pairing}
                onChange={(pairing) =>
                  update({ ...blueprint, expression: { ...expression, typography: { pairing } } })
                }
              />
            ) : (
              <ThisOrThat
                field={scaleField(question)}
                brand={brand}
                value={readScale(blueprint, question)}
                onChange={(value) => update(writeScale(blueprint, question, value))}
              />
            )}
          </CardContent>
          <CardFooter className="justify-between gap-2">
            <Button
              variant="outline"
              disabled={index === 0}
              onClick={() => go(QUESTIONS[index - 1])}
            >
              Back
            </Button>
            {index < QUESTIONS.length - 1 ? (
              <Button onClick={() => go(QUESTIONS[index + 1])}>Next</Button>
            ) : (
              <Link href={`/blueprints/${id}/present`} className={cn(buttonVariants())}>
                View blueprint
              </Link>
            )}
          </CardFooter>
        </Card>

        <div className={cn("flex-col gap-4 lg:flex", view === "blueprint" ? "flex" : "hidden")}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {inspecting ? "Click a section to edit its text." : "Live blueprint"}
            </p>
            <Toggle
              variant="outline"
              size="sm"
              pressed={inspecting}
              onPressedChange={(pressed) => inspect(pressed ? "on" : null)}
              className="aria-pressed:border-inspect aria-pressed:bg-inspect/10 aria-pressed:text-inspect"
            >
              <MousePointerClickIcon />
              Inspect
            </Toggle>
          </div>
          <BlueprintDocument
            blueprint={blueprint}
            inspect={inspecting ? { selected, onSelect: inspect } : undefined}
          />
          <div className="sticky bottom-4">
            <AiEditBar />
          </div>
        </div>
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

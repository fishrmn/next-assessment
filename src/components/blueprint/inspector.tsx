"use client"

import { MousePointerClickIcon, RotateCcwIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  documentSection,
  editSlot,
  isEdited,
  resetSlot,
  slotText,
} from "@/lib/blueprint/document-sections"
import type { Blueprint, SectionId } from "@/lib/blueprint/model"

/**
 * The inspect tool's panel: the text fields of the section picked in the document.
 *
 * It edits text only (titles, descriptions), never the intake answers. Each field shows the text
 * the document prints right now. Typing stores an edit over the generated text; "Reset" removes
 * the edit, and the field follows the intake answers again. The fields come from the same
 * `DOCUMENT_SECTIONS` registry the document renders from, so the two cannot drift apart.
 */
export function Inspector({
  blueprint,
  selected,
  onChange,
  onDone,
  className,
}: {
  blueprint: Blueprint
  selected: SectionId | null
  onChange: (blueprint: Blueprint) => void
  onDone: () => void
  className?: string
}) {
  const section = selected ? documentSection(selected) : null

  return (
    <Card className={className}>
      <CardHeader>
        <p className="pb-2 text-xs font-medium text-muted-foreground">Inspect</p>
        <CardTitle className="text-xl">{section ? section.label : "Pick a section"}</CardTitle>
        <CardDescription>
          {section
            ? "Reword what the blueprint says here. Your answers in the guided session stay as they are."
            : "Edit the titles and descriptions of the blueprint."}
        </CardDescription>
      </CardHeader>
      <CardContent key={selected ?? "none"} className="animate-in duration-200 fade-in-0">
        {section ? (
          <FieldGroup>
            {section.slots.map((slot) => {
              const id = `inspect-${section.id}-${slot.key}`
              const edited = isEdited(blueprint, section.id, slot.key)
              const value = slotText(blueprint, section.id, slot.key)
              const Control = slot.multiline ? Textarea : Input
              return (
                <Field key={slot.key}>
                  <div className="flex min-h-6 items-center justify-between gap-2">
                    <FieldLabel htmlFor={id}>{slot.label}</FieldLabel>
                    {edited && (
                      <span className="flex items-center gap-1">
                        <Badge variant="secondary">Edited</Badge>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onChange(resetSlot(blueprint, section.id, slot.key))}
                        >
                          <RotateCcwIcon />
                          Reset
                        </Button>
                      </span>
                    )}
                  </div>
                  <Control
                    id={id}
                    value={value}
                    maxLength={slot.key === "title" ? 80 : 400}
                    placeholder="Generated from the guided session once it has the answers"
                    onChange={(event) =>
                      onChange(editSlot(blueprint, section.id, slot.key, event.target.value))
                    }
                  />
                </Field>
              )
            })}
            {section.id === "hero" && (
              <FieldDescription>The brand name is set in Basics, in the guided session.</FieldDescription>
            )}
          </FieldGroup>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MousePointerClickIcon />
              </EmptyMedia>
              <EmptyTitle>Click a section of the blueprint</EmptyTitle>
              <EmptyDescription>
                Hover the blueprint to see its sections, then click one to edit its text.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onDone}>Done</Button>
      </CardFooter>
    </Card>
  )
}

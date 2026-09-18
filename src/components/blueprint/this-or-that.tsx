"use client"

import { ChoiceCard } from "@/components/blueprint/choice-card"
import { LayoutSketch, type SketchKind } from "@/components/blueprint/layout-sketch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Scale, ScaleValue } from "@/lib/blueprint/model"
import { describeScale, type ScaleField } from "@/lib/blueprint/registry"
import { cn } from "@/lib/utils"

const sketches: Partial<Record<ScaleField["id"], [SketchKind, SketchKind]>> = {
  density: ["minimal", "bold"],
  era: ["classic", "modern"],
}

const positions: Scale[] = [1, 2, 3, 4, 5]

/**
 * Asks one scale as a choice between two concrete examples, never as a number.
 *
 * Picking a card means "leans this way" (2 or 4). The five dots underneath are
 * for fine-tuning: all the way (1 or 5) or "a bit of both" (3). Tone scales show
 * the same idea written in two voices; visual scales show two drawn pages.
 */
export function ThisOrThat({
  field,
  brand,
  value,
  onChange,
}: {
  field: ScaleField
  brand: string
  value: ScaleValue
  onChange: (value: Scale) => void
}) {
  const sketch = sketches[field.id]
  const sides = [
    { pole: field.left, lean: 2 as Scale, selected: value !== null && value < 3, sketch: sketch?.[0] },
    { pole: field.right, lean: 4 as Scale, selected: value !== null && value > 3, sketch: sketch?.[1] },
  ]

  return (
    <div className="@container flex flex-col gap-5">
      {/* Two sentences need room and stack when narrow; two sketches always sit side by side. */}
      <div className={cn("grid gap-3", sketch ? "grid-cols-2" : "@md:grid-cols-2")}>
        {sides.map(({ pole, lean, selected, sketch }) => (
          <ChoiceCard
            key={pole.label}
            label={pole.label}
            selected={selected}
            onClick={() => onChange(lean)}
          >
            {sketch ? (
              <LayoutSketch kind={sketch} />
            ) : (
              <p className="flex-1 text-base leading-snug text-pretty">
                “{pole.example?.(brand)}”
              </p>
            )}
          </ChoiceCard>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <RadioGroup
          aria-label={`Fine-tune between ${field.left.label} and ${field.right.label}`}
          value={value === null ? "" : String(value)}
          onValueChange={(next) => onChange(Number(next) as Scale)}
          className="flex w-full max-w-64 items-center justify-between"
        >
          {positions.map((position) => (
            <RadioGroupItem
              key={position}
              value={String(position)}
              aria-label={describeScale(field, position) ?? undefined}
            />
          ))}
        </RadioGroup>
        <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
          {describeScale(field, value) ?? "Pick the one that feels closer. Fine-tune with the dots."}
        </p>
      </div>
    </div>
  )
}

"use client"

import { ChoiceCard } from "@/components/blueprint/choice-card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  MAX_TRAITS,
  TRAITS,
  type Blueprint,
  type FontPairing,
  type Trait,
} from "@/lib/blueprint/model"
import { FONTS, PALETTES, matchingPreset, type PalettePreset } from "@/lib/blueprint/registry"

/** Personality: pick up to three adjectives. A fourth pick is ignored until one is removed. */
export function TraitPicker({
  value,
  onChange,
}: {
  value: Trait[]
  onChange: (value: Trait[]) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        multiple
        variant="outline"
        spacing={2}
        value={value}
        onValueChange={(next) => {
          if (next.length <= MAX_TRAITS) onChange(next as Trait[])
        }}
        className="w-full flex-wrap"
      >
        {TRAITS.map((trait) => (
          <ToggleGroupItem
            key={trait}
            value={trait}
            disabled={value.length >= MAX_TRAITS && !value.includes(trait)}
            className="px-3"
          >
            {trait}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
        {value.length} of {MAX_TRAITS} chosen
      </p>
    </div>
  )
}

/** Color: each card is a full palette. Picking one also records its direction (warm/cool, muted/vivid). */
export function PalettePicker({
  brand,
  color,
  onPick,
}: {
  brand: string
  color: Blueprint["expression"]["color"]
  onPick: (preset: PalettePreset) => void
}) {
  const current = matchingPreset(color.palette)
  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-3 @sm:grid-cols-4">
        {PALETTES.map((preset) => (
          <ChoiceCard
            key={preset.id}
            label={preset.name}
            selected={current?.id === preset.id}
            onClick={() => onPick(preset)}
          >
            <div
              className="flex h-20 flex-col justify-between overflow-hidden rounded-md p-2 shadow-[inset_0_0_0_1px_oklch(0_0_0/0.1)]"
              style={{ backgroundColor: preset.palette.background }}
            >
              <span
                className="truncate text-sm font-semibold"
                style={{ color: preset.palette.primary }}
              >
                {brand}
              </span>
              <span className="flex gap-1">
                {[preset.palette.primary, preset.palette.secondary, preset.palette.accent].map(
                  (hex) => (
                    <span
                      key={hex}
                      className="h-4 flex-1 rounded-sm"
                      style={{ backgroundColor: hex }}
                    />
                  )
                )}
              </span>
            </div>
          </ChoiceCard>
        ))}
      </div>
    </div>
  )
}

/** Typography: each card sets the brand's own name in that pairing. */
export function FontPicker({
  brand,
  value,
  onChange,
}: {
  brand: string
  value: FontPairing | null
  onChange: (value: FontPairing) => void
}) {
  return (
    <div className="@container">
      <div className="grid gap-3 @md:grid-cols-2">
        {FONTS.map((font) => (
          <ChoiceCard
            key={font.id}
            label={font.name}
            selected={value === font.id}
            onClick={() => onChange(font.id)}
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span
                className="truncate text-2xl leading-tight font-semibold"
                style={{ fontFamily: font.heading }}
              >
                {brand}
              </span>
              <span className="text-sm text-muted-foreground" style={{ fontFamily: font.body }}>
                {font.description}
              </span>
            </div>
          </ChoiceCard>
        ))}
      </div>
    </div>
  )
}

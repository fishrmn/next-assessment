"use client"

import { AlignCenter, AlignLeft, AlignRight } from "lucide-react"
import { useId } from "react"

import type { Alignment } from "@/components/builder/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as string)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const alignOptions: { value: Alignment; icon: typeof AlignLeft; label: string }[] = [
  { value: "left", icon: AlignLeft, label: "Align left" },
  { value: "center", icon: AlignCenter, label: "Align center" },
  { value: "right", icon: AlignRight, label: "Align right" },
]

export function AlignField({
  value,
  onChange,
}: {
  value: Alignment
  onChange: (value: Alignment) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>Alignment</Label>
      <ToggleGroup
        value={[value]}
        onValueChange={(groupValue) => {
          const next = groupValue[0] as Alignment | undefined
          if (next) onChange(next)
        }}
      >
        {alignOptions.map(({ value: option, icon: Icon, label }) => (
          <ToggleGroupItem key={option} value={option} aria-label={label}>
            <Icon />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

/**
 * Free-form CSS color backed by a native color picker. The picker only
 * understands hex, so the text input remains the source of truth.
 */
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
}) {
  const id = useId()
  const hex = value && /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
        />
        <Input
          id={id}
          value={value ?? ""}
          placeholder="e.g. #b08d3f"
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      </div>
    </div>
  )
}

export function BooleanField({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-primary"
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  )
}

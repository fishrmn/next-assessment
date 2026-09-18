"use client"

import { useState } from "react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { INDUSTRIES, type Blueprint, type Industry } from "@/lib/blueprint/model"
import { cn } from "@/lib/utils"

type Business = Blueprint["business"]

/**
 * Business context, captured as one fill-in-the-blank statement instead of a form.
 * Each blank is one field of `blueprint.business`, and the finished sentences are
 * what the Blueprint document prints, so the client sees what their words become.
 */
export function PositioningSentence({
  business,
  onChange,
}: {
  business: Business
  onChange: (business: Business) => void
}) {
  // Kept as typed text: deriving it from the stored list would eat the comma being typed.
  const [comparables, setComparables] = useState(business.comparables.join(", "))
  const set = (patch: Partial<Business>) => onChange({ ...business, ...patch })

  return (
    <div className="flex flex-col gap-5 text-lg leading-loose text-pretty">
      <p>
        <Blank
          label="Brand name"
          placeholder="Brand name"
          value={business.name}
          onChange={(name) => set({ name })}
          maxLength={80}
        />{" "}
        is a{" "}
        <Select
          value={business.industry || null}
          onValueChange={(industry) => set({ industry: (industry as Industry) ?? "" })}
        >
          <SelectTrigger
            aria-label="Industry"
            className="inline-flex h-auto w-auto gap-1 rounded-none border-0 border-b border-dashed border-foreground/40 bg-transparent px-1 py-0 align-baseline text-lg font-medium shadow-none data-placeholder:font-normal dark:bg-transparent"
          >
            <SelectValue placeholder="industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>{" "}
        company.
      </p>
      <p>
        We{" "}
        <Blank
          label="What you do"
          placeholder="do what? e.g. run payroll in minutes"
          value={business.offer}
          onChange={(offer) => set({ offer })}
        />{" "}
        for{" "}
        <Blank
          label="Who you serve"
          placeholder="whom? e.g. small business owners"
          value={business.audience}
          onChange={(audience) => set({ audience })}
        />
        .
      </p>
      <p>
        Right now, we want to{" "}
        <Blank
          label="Current goal"
          placeholder="achieve what?"
          value={business.goal}
          onChange={(goal) => set({ goal })}
        />
        .
      </p>
      <p>
        Unlike{" "}
        <Blank
          label="Competitors or comparable brands, separated by commas"
          placeholder="competitors, comma separated"
          value={comparables}
          onChange={(value) => {
            setComparables(value)
            set({
              comparables: value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }}
        />
        , we{" "}
        <Blank
          label="What makes you different"
          placeholder="do what differently?"
          value={business.differentiator}
          onChange={(differentiator) => set({ differentiator })}
        />
        .
      </p>
    </div>
  )
}

/** One blank of the sentence: a shadcn Input restyled as an underlined gap that grows with its text. */
function Blank({
  label,
  value,
  onChange,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Input
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoComplete="off"
      maxLength={200}
      className={cn(
        "inline-block h-auto w-auto max-w-full min-w-40 field-sizing-content rounded-none border-0 border-b border-dashed border-foreground/40 bg-transparent px-1 py-0 align-baseline text-lg font-medium shadow-none placeholder:font-normal focus-visible:border-solid focus-visible:border-ring focus-visible:ring-0 md:text-lg dark:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

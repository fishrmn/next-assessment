"use client"

import { useState } from "react"

/**
 * A list field typed directly on the document: committed values sit inline as
 * tags, followed by a short draft input that appends on Enter.
 *
 * The draft is local state — the document only ever hears about committed
 * values, so a half-typed word never reaches the saved blueprint. The tags are
 * static markup and print as-is; only the draft input is dropped from the PDF
 * (the `!` on `print:hidden!` beats `.bp-in`'s later `display: block`).
 *
 * The draft's width/size are inline styles rather than utilities for the same
 * reason: `.bp-in`'s `width: 100%` outranks a `w-[180px]` class.
 */
export function InlineChipsField({
  fieldId,
  label,
  placeholder,
  values,
  onChange,
}: {
  fieldId: string
  label: string
  placeholder: string
  values: string[]
  onChange: (values: string[]) => void
}) {
  const [draft, setDraft] = useState("")

  return (
    <div className="mb-[18px]">
      <label
        htmlFor={fieldId}
        className="mb-[5px] block text-[11px] tracking-[0.13em] text-muted-foreground uppercase"
      >
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-[6px]">
        {values.map((chip, index) => (
          <span key={`${chip}-${index}`} className="tag tag-accent">
            {chip}
            <button
              type="button"
              aria-label={`Remove ${chip}`}
              className="m-0 cursor-pointer appearance-none border-0 bg-transparent p-0 leading-none text-accent-700 hover:text-accent-800 print:hidden"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={fieldId}
          type="text"
          className="bp-in print:hidden!"
          style={{ width: 180, flex: "0 0 auto", fontSize: 14 }}
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return
            event.preventDefault()
            const trimmed = draft.trim()
            if (!trimmed) return
            onChange([...values, trimmed])
            setDraft("")
          }}
        />
      </div>
    </div>
  )
}

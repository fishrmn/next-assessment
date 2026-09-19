"use client"

import { DOCUMENT_SECTIONS, fieldDomId, type BlueprintValues } from "@/lib/blueprint/field-config"
import { countSectionFields, firstUnfilledField } from "@/lib/blueprint/progress"

/**
 * Section index for the artifacts rail. Each row jumps to the first field the
 * user has *not* filled in that section, so the nav doubles as "where do I go
 * next" rather than just an anchor list.
 *
 * Focus is by DOM id (`fieldDomId`) — the field components render stable ids,
 * so there is no ref registry to thread through the tree.
 *
 * `no-print`: interactive chrome, not part of the Blueprint deliverable.
 */
export function JumpToNav({ values }: { values: BlueprintValues }) {
  return (
    <nav className="no-print" aria-label="Jump to section">
      <p className="mb-3 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Jump to</p>

      {DOCUMENT_SECTIONS.map((section) => {
        const { filled, total } = countSectionFields(values, section)

        return (
          <button
            key={section.num}
            type="button"
            onClick={() => {
              document.getElementById(fieldDomId(firstUnfilledField(values, section)))?.focus()
            }}
            aria-label={`Jump to ${section.title}, ${filled} of ${total} fields filled`}
            className="grid w-full grid-cols-[24px_minmax(0,1fr)_auto] items-baseline gap-2 border-t border-border px-1 py-[9px] text-left transition-colors hover:bg-accent-100"
          >
            <span className="text-xs text-accent-700 tabular-nums">{section.num}</span>
            <span className="truncate font-heading text-base">{section.title}</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {filled}/{total}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

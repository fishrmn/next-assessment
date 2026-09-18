"use client"

import { Maximize2, Minimize2 } from "lucide-react"
import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { useFullscreen } from "@/hooks/use-fullscreen"
import { cn } from "@/lib/utils"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
}

export function CanvasHeader({
  title,
  onTitleChange,
  progress,
  saveStatus,
  onExport,
  onDelete,
  deleteError,
  lookbookHref,
}: {
  title: string
  onTitleChange: (value: string) => void
  progress: { filled: number; total: number; pct: number }
  saveStatus: SaveStatus
  onExport: () => void
  onDelete: () => void
  deleteError: string | null
  lookbookHref?: string
}) {
  const { isFullscreen, isSupported, toggle } = useFullscreen()

  return (
    <header className="sticky top-0 z-[2] border-b border-border bg-background">
      {/* Wraps below `lg`. This row carries a title, a progress bar and four
          controls, which cannot share one line on a phone — unwrapped it pushed
          the page 465px wide at 320px. `.bp-shell` supplies the side gutter on
          small screens, so the row only adds its own padding from `sm` up. */}
      <div className="bp-shell flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 sm:px-9 lg:flex-nowrap">
        <span className="hidden flex-none text-[11px] tracking-[0.18em] text-muted-foreground uppercase sm:inline">
          Blueprint
        </span>

        {/* The control is swapped for static text when printed: a 220px input
            has no way to wrap, so a long client name would clip mid-word in the
            PDF. Same pattern as the document's inline fields. The `!` is
            required — `.bp-in` sets `display: block`, and without it the two
            rules tie on specificity. */}
        <input
          className="bp-in w-full font-heading text-[21px] sm:w-[220px] sm:flex-none print:hidden!"
          aria-label="Blueprint title"
          placeholder="Untitled brand"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        <span className="hidden font-heading text-[21px] print:block">{title}</span>

        {/* Its own full-width line while the row is wrapped, so the bar keeps a
            usable length instead of being squeezed to nothing between the title
            and the buttons. The save status must stay visible at every width —
            with no Done button it is the only signal a write failed. */}
        <div className="order-last flex w-full min-w-0 items-center gap-3 lg:order-none lg:w-auto lg:flex-1">
          {/* `--accent` is the accent-100 wash in this theme — the bar needs the gold band. */}
          <div className="h-[3px] min-w-0 flex-1 overflow-hidden rounded-sm bg-neutral-200">
            <div className="h-[3px] bg-primary" style={{ width: `${progress.pct}%` }} />
          </div>
          <span className="flex-none text-xs whitespace-nowrap text-muted-foreground tabular-nums">
            {progress.filled} of {progress.total} fields
          </span>
          <span
            aria-live="polite"
            className={cn(
              "no-print flex-none text-xs whitespace-nowrap",
              saveStatus === "error" ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {SAVE_LABEL[saveStatus]}
          </span>
        </div>

        {lookbookHref && (
          <Link
            href={lookbookHref}
            className={cn(buttonVariants({ variant: "ghost" }), "no-print")}
          >
            Lookbook
          </Link>
        )}

        {/* Hidden outright when the browser has no Fullscreen API — a button
            that silently no-ops is worse than no button. */}
        {isSupported && (
          <Button variant="ghost" className="no-print" onClick={toggle}>
            {isFullscreen ? (
              <Minimize2 aria-hidden="true" />
            ) : (
              <Maximize2 aria-hidden="true" />
            )}
            {isFullscreen ? "Exit full screen" : "Full screen"}
          </Button>
        )}

        <Button variant="ghost" className="no-print" onClick={onDelete}>
          Delete
        </Button>
        <Button className="no-print" onClick={onExport}>
          Export as PDF
        </Button>
      </div>

      {deleteError && (
        <p className="no-print px-9 pb-2.5 text-xs text-destructive">{deleteError}</p>
      )}
    </header>
  )
}

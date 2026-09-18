import { cn } from "@/lib/utils"

export type SketchKind = "minimal" | "bold" | "classic" | "modern"

/**
 * A tiny drawn page that stands for one pole of a visual scale. People cannot rate "density:
 * 2 of 5", but they can tell at a glance which of two pages looks like them. Drawn with
 * theme tokens only, so the sketches stay neutral and never suggest a color.
 */
export function LayoutSketch({ kind }: { kind: SketchKind }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex aspect-[4/3] w-full flex-col overflow-hidden rounded-md bg-background p-3 shadow-[inset_0_0_0_1px_oklch(0_0_0/0.08)] dark:shadow-[inset_0_0_0_1px_oklch(1_0_0/0.1)]",
        kind === "classic" && "items-center"
      )}
    >
      {kind === "minimal" && (
        <>
          <div className="h-1 w-6 rounded-full bg-foreground/70" />
          <div className="mt-auto flex flex-col gap-1.5">
            <div className="h-1.5 w-2/3 rounded-full bg-foreground/80" />
            <div className="h-1 w-1/3 rounded-full bg-foreground/25" />
          </div>
        </>
      )}
      {kind === "bold" && (
        <>
          <div className="-m-3 mb-2 flex flex-1 flex-col justify-end gap-1.5 bg-foreground p-3">
            <div className="h-3 w-5/6 rounded-sm bg-background" />
            <div className="h-3 w-3/5 rounded-sm bg-background" />
          </div>
          <div className="mt-3 flex gap-1.5">
            <div className="h-4 flex-1 rounded-sm bg-foreground/80" />
            <div className="h-4 flex-1 rounded-sm bg-foreground/30" />
            <div className="h-4 flex-1 rounded-sm bg-foreground/30" />
          </div>
        </>
      )}
      {kind === "classic" && (
        <>
          <div className="h-px w-full bg-foreground/40" />
          <div className="mt-1 h-px w-full bg-foreground/40" />
          <span className="mt-2 font-(family-name:--font-playfair) text-lg leading-none text-foreground/80">
            Aa
          </span>
          <div className="mt-2 flex w-full flex-col items-center gap-1">
            <div className="h-1 w-3/4 rounded-full bg-foreground/30" />
            <div className="h-1 w-2/3 rounded-full bg-foreground/30" />
            <div className="h-1 w-1/2 rounded-full bg-foreground/30" />
          </div>
          <div className="mt-auto h-px w-full bg-foreground/40" />
        </>
      )}
      {kind === "modern" && (
        <>
          <span className="font-(family-name:--font-grotesk) text-lg leading-none font-semibold text-foreground/80">
            Aa
          </span>
          <div className="mt-2 flex flex-col gap-1">
            <div className="h-1 w-3/4 rounded-full bg-foreground/30" />
            <div className="h-1 w-1/2 rounded-full bg-foreground/30" />
          </div>
          <div className="mt-auto flex items-center gap-1.5">
            <div className="h-4 w-10 rounded-full bg-foreground/80" />
            <div className="size-4 rounded-full bg-foreground/25" />
          </div>
        </>
      )}
    </div>
  )
}

import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A large, selectable card: the building block of every "pick the one that feels like you"
 * question. Hand-written because shadcn has no card-sized single-choice control whose body is
 * free content (a sentence, a sketch, a palette). It is a real <button> with `aria-pressed`,
 * so keyboard and screen readers get it for free.
 */
export function ChoiceCard({
  selected,
  label,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"button">, "type"> & {
  selected: boolean
  /** Short name of the choice, shown under the content. */
  label: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "group/choice relative flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-3 text-left outline-none",
        "transition-[border-color,background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.96]",
        "hover:border-ring/60 hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        selected && "border-primary bg-muted/60 shadow-sm hover:border-primary",
        className
      )}
      {...props}
    >
      {children}
      <span className="flex items-center justify-between gap-2 text-sm font-medium">
        {label}
        <span
          aria-hidden
          className={cn(
            "flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground transition-[opacity,scale] duration-150 ease-out",
            selected ? "scale-100 opacity-100" : "scale-25 opacity-0"
          )}
        >
          <CheckIcon className="size-3" strokeWidth={3} />
        </span>
      </span>
    </button>
  )
}

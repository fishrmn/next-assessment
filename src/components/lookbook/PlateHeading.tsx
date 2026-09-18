/**
 * The lookbook's plate label: a tracked eyebrow with a hairline rule running out
 * to the measure. Repeated above every plate so the spread reads as one set.
 */
export function PlateHeading({ children }: { children: string }) {
  return (
    <div className="mb-5 flex items-center gap-4 lg:mb-7">
      <h2 className="eyebrow m-0">{children}</h2>
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  )
}

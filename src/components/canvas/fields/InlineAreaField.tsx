"use client"

/** ~72 characters is one line at the document's measure. */
function rowsFor(value: string): number {
  return Math.max(2, Math.ceil(value.length / 72))
}

/**
 * A multi-line field typed directly on the document. The textarea grows with
 * its content rather than scrolling inside a fixed box.
 *
 * Print swaps the control for a plain span: a textarea renders its scroll
 * viewport, not its full text, so long answers would be cut off in the PDF.
 * The `!` on `print:hidden!` is load-bearing — `.bp-in` sets `display: block`
 * later in the same cascade layer and would otherwise win.
 */
export function InlineAreaField({
  fieldId,
  label,
  placeholder,
  value,
  onChange,
}: {
  fieldId: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="mb-[18px]">
      <label
        htmlFor={fieldId}
        className="mb-[5px] block text-[11px] tracking-[0.13em] text-muted-foreground uppercase"
      >
        {label}
      </label>
      <textarea
        id={fieldId}
        className="bp-in print:hidden!"
        rows={rowsFor(value)}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="hidden text-[16px] leading-[1.65] whitespace-pre-wrap print:block">
        {value}
      </span>
    </div>
  )
}

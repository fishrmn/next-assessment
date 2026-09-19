"use client"

/**
 * A single-line field typed directly on the document — no box, no card, just a
 * label and text on the page.
 *
 * The `print:hidden` control / `print:block` span pair is not decoration: an
 * `<input>` cannot wrap, so a long value clips mid-sentence in the PDF that
 * Export produces. The printed document gets real, wrapping, selectable text
 * instead.
 *
 * `print:hidden!` keeps the `!` deliberately: `.bp-in` sets `display: block`
 * later in the same cascade layer, so the plain utility loses the tie and the
 * input prints.
 */
export function InlineTextField({
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
      <input
        id={fieldId}
        type="text"
        className="bp-in print:hidden!"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="hidden text-[16px] leading-[1.6] print:block">{value}</span>
    </div>
  )
}

import {
  fieldDomId,
  getFieldValue,
  type BlueprintValues,
  type FieldConfig,
  type SectionConfig,
} from "@/lib/blueprint/field-config"
import { countSectionFields } from "@/lib/blueprint/progress"
import { InlineAreaField } from "@/components/canvas/fields/InlineAreaField"
import { InlineChipsField } from "@/components/canvas/fields/InlineChipsField"
import { InlineTextField } from "@/components/canvas/fields/InlineTextField"

/**
 * One numbered section of the blueprint document. The heading, the fields and
 * the `filled/total` count all derive from the section's config, so a field is
 * added or reworded in `field-config.ts` alone.
 */
export function DocumentSection({
  section,
  values,
  onFieldChange,
}: {
  section: SectionConfig
  values: BlueprintValues
  onFieldChange: (field: FieldConfig, value: string | string[]) => void
}) {
  const { filled, total } = countSectionFields(values, section)

  return (
    <section className="bp-section mb-[44px]">
      <div className="mb-[18px] flex items-center gap-4">
        <h2 className="m-0 font-heading text-[29px] font-medium">{section.title}</h2>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase tabular-nums">
          {filled}/{total}
        </span>
      </div>
      {section.fields.map((field) => {
        const value = getFieldValue(values, field)
        const fieldKey = `${field.section}.${field.key}`
        const shared = {
          fieldId: fieldDomId(field),
          label: field.label,
          placeholder: field.placeholder,
        }

        if (field.kind === "chips") {
          return (
            <InlineChipsField
              key={fieldKey}
              {...shared}
              values={Array.isArray(value) ? value : []}
              onChange={(next) => onFieldChange(field, next)}
            />
          )
        }

        // A chip array can only reach a text control if the config and the
        // stored shape disagree; join rather than crash on the user's data.
        const text = Array.isArray(value) ? value.join(", ") : value
        const Field = field.kind === "area" ? InlineAreaField : InlineTextField

        return (
          <Field
            key={fieldKey}
            {...shared}
            value={text}
            onChange={(next) => onFieldChange(field, next)}
          />
        )
      })}
    </section>
  )
}

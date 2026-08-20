import type { ElementType } from "@/components/builder/types"

export type ValidationResult = { ok: true } | { ok: false; error: string }

type FieldSpec =
  | { kind: "string"; required?: boolean }
  | { kind: "boolean"; required?: boolean }
  | { kind: "enum"; values: readonly (string | number)[]; required?: boolean }
  | { kind: "array"; required?: boolean; item: Record<string, FieldSpec> }

const ALIGN = { kind: "enum", values: ["left", "center", "right"], required: true } as const

/** Field tables mirroring the ElementConfig union in src/components/builder/types.ts. */
const ELEMENT_FIELDS: Record<ElementType, Record<string, FieldSpec>> = {
  navbar: {
    brandName: { kind: "string", required: true },
    logoUrl: { kind: "string" },
    links: {
      kind: "array",
      required: true,
      item: {
        label: { kind: "string", required: true },
        href: { kind: "string", required: true },
      },
    },
    backgroundColor: { kind: "string" },
    textColor: { kind: "string" },
    ctaLabel: { kind: "string" },
    ctaHref: { kind: "string" },
  },
  text: {
    text: { kind: "string", required: true },
    level: { kind: "enum", values: ["h1", "h2", "h3", "p"], required: true },
    align: ALIGN,
    color: { kind: "string" },
  },
  hero: {
    heading: { kind: "string", required: true },
    subheading: { kind: "string" },
    align: ALIGN,
    backgroundColor: { kind: "string" },
    textColor: { kind: "string" },
    ctaLabel: { kind: "string" },
    ctaHref: { kind: "string" },
    imageUrl: { kind: "string" },
    imageStyle: { kind: "enum", values: ["background", "side"] },
  },
  services: {
    title: { kind: "string", required: true },
    items: {
      kind: "array",
      required: true,
      item: {
        name: { kind: "string", required: true },
        price: { kind: "string", required: true },
        description: { kind: "string" },
      },
    },
    columns: { kind: "enum", values: [1, 2, 3], required: true },
    accentColor: { kind: "string" },
  },
  gallery: {
    title: { kind: "string" },
    images: {
      kind: "array",
      required: true,
      item: {
        src: { kind: "string", required: true },
        alt: { kind: "string", required: true },
      },
    },
    columns: { kind: "enum", values: [2, 3, 4], required: true },
    rounded: { kind: "boolean" },
  },
  cta: {
    label: { kind: "string", required: true },
    href: { kind: "string", required: true },
    align: ALIGN,
    backgroundColor: { kind: "string" },
    textColor: { kind: "string" },
    size: { kind: "enum", values: ["sm", "md", "lg"], required: true },
  },
  contact: {
    title: { kind: "string", required: true },
    address: { kind: "string", required: true },
    phone: { kind: "string", required: true },
    email: { kind: "string" },
    hours: {
      kind: "array",
      required: true,
      item: {
        days: { kind: "string", required: true },
        hours: { kind: "string", required: true },
      },
    },
    align: ALIGN,
  },
}

export const ELEMENT_TYPES = Object.keys(ELEMENT_FIELDS) as ElementType[]

function describeEnum(values: readonly (string | number)[]): string {
  return values.map((v) => JSON.stringify(v)).join(" | ")
}

function validateField(key: string, value: unknown, spec: FieldSpec): string | null {
  switch (spec.kind) {
    case "string":
      return typeof value === "string" ? null : `"${key}" must be a string`
    case "boolean":
      return typeof value === "boolean" ? null : `"${key}" must be a boolean`
    case "enum":
      return spec.values.includes(value as string | number)
        ? null
        : `"${key}" must be one of ${describeEnum(spec.values)}`
    case "array": {
      if (!Array.isArray(value)) return `"${key}" must be an array`
      for (const [index, entry] of value.entries()) {
        if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
          return `"${key}[${index}]" must be an object`
        }
        const error = validateFields(entry as Record<string, unknown>, spec.item, `${key}[${index}].`)
        if (error) return error
      }
      return null
    }
  }
}

function validateFields(
  value: Record<string, unknown>,
  fields: Record<string, FieldSpec>,
  prefix = ""
): string | null {
  for (const key of Object.keys(value)) {
    if (!(key in fields)) return `unknown field "${prefix}${key}"`
  }
  for (const [key, spec] of Object.entries(fields)) {
    if (!(key in value)) {
      if (spec.required) return `missing required field "${prefix}${key}"`
      continue
    }
    const error = validateField(`${prefix}${key}`, value[key], spec)
    if (error) return error
  }
  return null
}

/** Validates a full element config from the model (used by add_element). */
export function validateElement(value: unknown): ValidationResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, error: "element must be an object" }
  }
  // `id` is ignored — the dispatcher assigns a fresh one on add.
  const { type, id: _id, ...rest } = value as Record<string, unknown>
  void _id
  if (typeof type !== "string" || !(type in ELEMENT_FIELDS)) {
    return { ok: false, error: `"type" must be one of ${describeEnum(ELEMENT_TYPES)}` }
  }
  const error = validateFields(rest, ELEMENT_FIELDS[type as ElementType])
  return error ? { ok: false, error } : { ok: true }
}

/** Validates a partial patch from the model (used by update_element). */
export function validatePatch(type: ElementType, patch: unknown): ValidationResult {
  if (typeof patch !== "object" || patch === null || Array.isArray(patch)) {
    return { ok: false, error: "patch must be an object" }
  }
  const fields = ELEMENT_FIELDS[type]
  for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
    if (key === "type" || key === "id") {
      return { ok: false, error: `"${key}" cannot be changed` }
    }
    if (!(key in fields)) {
      return { ok: false, error: `unknown field "${key}" for type "${type}"` }
    }
    const error = validateField(key, value, fields[key])
    if (error) return { ok: false, error }
  }
  return { ok: true }
}

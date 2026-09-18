/**
 * The text of the Blueprint document, section by section.
 *
 * Every piece of text the document prints comes from a "slot". A slot knows how to generate its
 * text from the client's answers, and it accepts an edit that replaces the generated text. The
 * document reads slots to render; the inspector reads the same slots to build its form. So a
 * field is editable exactly when the document shows it, with no second list to keep in sync.
 *
 * Data only, no React.
 */
import type { Blueprint, SectionId } from "./model"
import { describeColor, fontInfo, voiceSample } from "./registry"

export type SlotKey = "title" | "body"

export type Slot = {
  key: SlotKey
  /** Name of the field in the inspector: "Title", "Lead sentence". */
  label: string
  multiline?: boolean
  /** The text built from the answers. Empty when the answers it needs are missing. */
  generated: (blueprint: Blueprint) => string
}

export type DocumentSection = {
  id: SectionId
  /** Name of the section in the inspector and on the hover label. */
  label: string
  slots: Slot[]
}

const title = (text: string): Slot => ({ key: "title", label: "Title", generated: () => text })

export const DOCUMENT_SECTIONS: DocumentSection[] = [
  {
    id: "hero",
    label: "Header",
    slots: [
      { key: "title", label: "Eyebrow", generated: () => "Brand Blueprint" },
      {
        key: "body",
        label: "Lead sentence",
        multiline: true,
        generated: ({ business }) => {
          const lead = [business.offer && `We ${business.offer}`, business.audience && `for ${business.audience}`]
            .filter(Boolean)
            .join(" ")
          return lead ? `${lead}.` : ""
        },
      },
    ],
  },
  {
    id: "apart",
    label: "What sets them apart",
    slots: [
      title("What sets them apart"),
      {
        key: "body",
        label: "Description",
        multiline: true,
        generated: ({ business }) => (business.differentiator ? `We ${business.differentiator}.` : ""),
      },
    ],
  },
  {
    id: "headed",
    label: "Where they are headed",
    slots: [
      title("Where they are headed"),
      {
        key: "body",
        label: "Description",
        multiline: true,
        generated: ({ business }) => (business.goal ? `Right now: ${business.goal}.` : ""),
      },
    ],
  },
  { id: "against", label: "Up against", slots: [title("Up against")] },
  { id: "personality", label: "Personality", slots: [title("Personality")] },
  {
    id: "voice",
    label: "Voice",
    slots: [
      title("Voice"),
      {
        key: "body",
        label: "Sample line (“Sounds like”)",
        multiline: true,
        generated: (blueprint) => voiceSample(blueprint) ?? "",
      },
    ],
  },
  { id: "look", label: "Look", slots: [title("Look")] },
  {
    id: "typography",
    label: "Typography",
    slots: [
      title("Typography"),
      {
        key: "body",
        label: "Description",
        generated: ({ expression }) => {
          const font = fontInfo(expression.typography.pairing)
          return font ? `${font.description}.` : ""
        },
      },
    ],
  },
  {
    id: "color",
    label: "Color",
    slots: [
      title("Color"),
      {
        key: "body",
        label: "Description",
        generated: ({ expression }) => {
          const words = describeColor(expression.color.palette)
          return words ? `Direction: ${words}.` : ""
        },
      },
    ],
  },
]

export function documentSection(id: SectionId): DocumentSection {
  return DOCUMENT_SECTIONS.find((section) => section.id === id)!
}

function slotOf(id: SectionId, key: SlotKey): Slot | undefined {
  return documentSection(id).slots.find((slot) => slot.key === key)
}

/** The text the document prints for one slot: the person's edit when there is one, else the generated text. */
export function slotText(blueprint: Blueprint, id: SectionId, key: SlotKey): string {
  return blueprint.copy[id]?.[key] ?? slotOf(id, key)?.generated(blueprint) ?? ""
}

export function isEdited(blueprint: Blueprint, id: SectionId, key: SlotKey): boolean {
  return blueprint.copy[id]?.[key] !== undefined
}

/**
 * Writes an edit. Text equal to the generated text (or blank) is stored as "no edit", so typing a
 * slot back to its original wording makes it follow the answers again.
 */
export function editSlot(blueprint: Blueprint, id: SectionId, key: SlotKey, value: string): Blueprint {
  const generated = slotOf(id, key)?.generated(blueprint) ?? ""
  const section = { ...blueprint.copy[id] }
  if (value.trim() === "" || value === generated) delete section[key]
  else section[key] = value

  const copy = { ...blueprint.copy }
  if (section.title === undefined && section.body === undefined) delete copy[id]
  else copy[id] = section
  return { ...blueprint, copy }
}

export function resetSlot(blueprint: Blueprint, id: SectionId, key: SlotKey): Blueprint {
  return editSlot(blueprint, id, key, "")
}

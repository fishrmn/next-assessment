/**
 * The part of the agent's instructions that describes the Blueprint's fields, generated
 * from the same lists and registry the app uses. When a trait, a font or a scale changes
 * in `model.ts` or `registry.ts`, the agent's instructions change with it.
 */
import { DOCUMENT_SECTIONS } from "./document-sections"
import { FONT_PAIRINGS, INDUSTRIES, MAX_TRAITS, TRAITS } from "./model"
import { FONTS, PALETTES, SCALES } from "./registry"

export function fieldGuide(): string {
  const scales = SCALES.map((field) => {
    const left = field.left.example ? ` e.g. "${field.left.example("Acme")}"` : ""
    const right = field.right.example ? ` e.g. "${field.right.example("Acme")}"` : ""
    return `- ${field.group}.${field.id}: 1 = ${field.left.label}${left} … 5 = ${field.right.label}${right}`
  }).join("\n")

  const fonts = FONTS.map((font) => `- ${font.id}: ${font.description}`).join("\n")
  const palettes = PALETTES.map(
    ({ name, palette }) => `- ${name}: ${palette.primary} ${palette.secondary} ${palette.accent} ${palette.background}`
  ).join("\n")
  const sections = DOCUMENT_SECTIONS.map(
    (section) => `- ${section.id} ("${section.label}"): ${section.slots.map((slot) => `${slot.key} = ${slot.label}`).join(", ")}`
  ).join("\n")

  return `BUSINESS FACTS (business.*) — name, industry, offer, audience, goal, comparables, differentiator.
industry is one of: ${INDUSTRIES.join(", ")}.
offer, goal and differentiator are verb phrases, because the document prints them as "We <offer> for <audience>", "Right now: <goal>" and "We <differentiator>".

BRAND EXPRESSION (expression.*)
personality: up to ${MAX_TRAITS} of: ${TRAITS.join(", ")}.
Scales are whole numbers 1 to 5 (2 and 4 mean "leans"):
${scales}
typography.pairing is one of (${FONT_PAIRINGS.length}):
${fonts}
color.palette is four #rrggbb colors: primary (header background), secondary, accent, background (page, keep it very light or very dark so text stays readable). Any colors are allowed. Tasteful starting points:
${palettes}
"Warm", "cool", "muted", "vivid" are not stored: they are read off the primary color. To make a brand warmer, change the colors.

DOCUMENT TEXT (copy.<section>.<title|body>) — rewording of what the one-pager prints. Use it only when the person asks to reword the document itself. Sections:
${sections}`
}

import type { PageConfig } from "@/components/builder/types"
import type { TemplateId } from "@/lib/templates"

/**
 * Types shared between the brand agent (server) and the brand chat (client).
 * Keep this module free of `server-only` imports.
 */

export type BrandPalette = {
  primary: string
  secondary: string
  accent: string
  background: string
}

export type BrandProfile = {
  salonName: string
  services: string[]
  idealClients?: string
  /** The brand in ~3 words, e.g. ["modern", "premium", "feminine"]. */
  vibeWords: string[]
  personality: {
    modernClassic: "modern" | "balanced" | "classic"
    luxuryApproachable: "luxury" | "balanced" | "approachable"
  }
  palette: BrandPalette
  paletteReasoning: string
  /** Style/personality read of the uploaded logo, if any. */
  logoNotes?: string
  instagram?: string
  phone?: string
  email?: string
  /** Street address / location of the salon. */
  address?: string
}

export type BrandDirection = {
  id: string
  name: string
  baseTemplateId: TemplateId
  visualDescription: string
  layoutApproach: string
  typography: string
  colorUsage: string
  heroConcept: string
}

export type BrandChatMessage = {
  role: "user" | "assistant"
  text: string
  /** Downscaled logo as a data URL — only ever set on user messages. */
  imageDataUrl?: string
}

/** Structured facts the conversation has produced so far; echoed each turn. */
export type BrandState = {
  profile?: BrandProfile
  directions?: BrandDirection[]
}

export type BrandTurnResult = {
  /** Assistant text for the chat bubble. */
  message: string
  /** Updated state — the client sends it back on the next turn. */
  state: BrandState
  /** Set on the turn the profile was produced (render the palette card). */
  profile?: BrandProfile
  /** Set on the turn the directions were proposed (render direction cards). */
  directions?: BrandDirection[]
  /** Set on the generation turn — terminal. */
  page?: { config: PageConfig; summary: string }
}

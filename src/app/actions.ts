"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type { ElementConfig, PageConfig } from "@/components/builder/types"
import { createPage, updatePage, type Page } from "@/db"
import { runEditAgent, type AgentResult } from "@/lib/ai/agent"
import { runBrandAgent } from "@/lib/ai/brand-agent"
import type {
  BrandChatMessage,
  BrandState,
  BrandTurnResult,
} from "@/lib/ai/brand-types"
import { validateElement } from "@/lib/ai/validate"
import { getTemplate } from "@/lib/templates"

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export async function createPageAction(input: {
  name: string
  templateId: string
}): Promise<ActionResult<never>> {
  const name = input.name.trim()
  if (!name) {
    return { ok: false, error: "Give your page a name." }
  }
  const template = getTemplate(input.templateId)
  if (!template) {
    return { ok: false, error: "Unknown template." }
  }

  let page: Page
  try {
    page = await createPage({
      name,
      template: template.id,
      config: template.config,
    })
  } catch (error) {
    console.error("createPageAction failed:", error)
    return {
      ok: false,
      error: "Could not create the page. Check your Supabase setup and try again.",
    }
  }

  revalidatePath("/")
  redirect(`/builder/${page.id}`)
}

/**
 * One turn of the Salon Brand Assistant conversation. Stateless: the client
 * owns the transcript and the accumulated brand state; nothing is persisted.
 */
export async function brandChatAction(input: {
  messages: BrandChatMessage[]
  state: BrandState
}): Promise<ActionResult<BrandTurnResult>> {
  const last = input.messages.at(-1)
  if (!last || last.role !== "user" || (!last.text.trim() && !last.imageDataUrl)) {
    return { ok: false, error: "Write a message for the brand assistant." }
  }
  try {
    return { ok: true, data: await runBrandAgent(input.messages, input.state) }
  } catch (error) {
    console.error("brandChatAction failed:", error)
    return {
      ok: false,
      error: "The brand assistant hit a snag. Check your OpenAI setup and try again.",
    }
  }
}

/**
 * Creates a page from a brand-assistant-generated config. The config
 * round-trips through the client, so every element is re-validated here.
 */
export async function createBrandPageAction(input: {
  name: string
  config: PageConfig
}): Promise<ActionResult<never>> {
  const name = input.name.trim()
  if (!name) {
    return { ok: false, error: "Give your page a name." }
  }
  if (!Array.isArray(input.config) || input.config.length === 0) {
    return { ok: false, error: "The generated page is empty — try again." }
  }
  const config: PageConfig = []
  for (const element of input.config) {
    const valid = validateElement(element)
    if (!valid.ok) {
      return { ok: false, error: `The generated page is invalid: ${valid.error}` }
    }
    config.push({ ...(element as ElementConfig), id: crypto.randomUUID() })
  }

  let page: Page
  try {
    page = await createPage({ name, template: "brand", config })
  } catch (error) {
    console.error("createBrandPageAction failed:", error)
    return {
      ok: false,
      error: "Could not create the page. Check your Supabase setup and try again.",
    }
  }

  revalidatePath("/")
  redirect(`/builder/${page.id}`)
}

/**
 * Runs the AI edit agent on the editor's current (unsaved) config. Nothing is
 * persisted here — the client applies the result to its state and the user
 * saves explicitly, so no revalidatePath.
 */
export async function aiEditPageAction(
  instruction: string,
  config: PageConfig
): Promise<ActionResult<AgentResult>> {
  if (!instruction.trim()) {
    return { ok: false, error: "Describe the change you want." }
  }
  try {
    return { ok: true, data: await runEditAgent(config, instruction.trim()) }
  } catch (error) {
    console.error("aiEditPageAction failed:", error)
    return {
      ok: false,
      error: "AI edit failed. Check your OpenAI setup and try again.",
    }
  }
}

export async function savePageAction(
  id: string,
  input: { name?: string; config: PageConfig }
): Promise<ActionResult<Page>> {
  try {
    const page = await updatePage(id, input)
    revalidatePath("/")
    revalidatePath(`/builder/${id}`)
    revalidatePath(`/preview/${id}`)
    return { ok: true, data: page }
  } catch (error) {
    console.error("savePageAction failed:", error)
    return { ok: false, error: "Could not save your changes. Please try again." }
  }
}

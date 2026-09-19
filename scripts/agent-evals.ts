/**
 * Checks the Blueprint agent against the real model. Run with `npm run agent:evals`.
 *
 * Unit tests cover the code around the model (patching, validation, instructions). They cannot
 * tell whether the model maps "make it more playful" to the right field. This script can:
 * each case sends one message about a starting Blueprint, rebuilds the resulting Blueprint
 * exactly the way the browser does (by replaying the tool's `applied` changes), and checks
 * the outcome by range, never by exact wording.
 *
 * It spends real tokens (a few cents), so it is not part of `npm test` or the commit hook.
 */
import { existsSync } from "node:fs"

import { DEFAULT_MODEL, createBlueprintAgent, type UpdateBlueprintOutput } from "../src/agents/blueprint"
import type { Scope } from "../src/lib/blueprint/document-sections"
import { FIELDS, getPath } from "../src/lib/blueprint/fields"
import { SECTION_IDS, emptyBlueprint, normalizeBlueprint, type Blueprint } from "../src/lib/blueprint/model"
import { replayChanges } from "../src/lib/blueprint/patch"
import { describeColor } from "../src/lib/blueprint/registry"

if (existsSync(".env.local")) process.loadEnvFile(".env.local")

// A finished first proposal, texts included, because that is what every later request starts from.
// With the texts missing, the agent rightly fills them in, and "changed only the colors" measures nothing.
const acme = normalizeBlueprint({
  direction: {
    headline: "Payroll that gets out of your way",
    rationale: "You said setup takes one afternoon and nobody has to sit through a sales call.",
  },
  copy: {
    voice: { body: "Payroll is done. Go run your business." },
    personality: { body: "We say what things cost, answer the phone, and skip the jargon." },
    color: { body: "A confident blue with a light, airy background." },
  },
  business: {
    name: "Acme Payroll",
    industry: "Finance",
    offer: "run payroll in minutes",
    audience: "small business owners",
    goal: "become the default payroll tool for new companies",
    comparables: ["Gusto", "ADP"],
    differentiator: "set you up in one afternoon, with no sales call",
  },
  expression: {
    personality: ["Trustworthy", "Down-to-earth"],
    tone: { formality: 3, humor: 2, attitude: 2, energy: 3 },
    visual: { density: 4, era: 4 },
    color: { palette: { primary: "#1d4ed8", secondary: "#1e3a8a", accent: "#38bdf8", background: "#f0f7ff" } },
    typography: { pairing: "modern" },
  },
})

type Outcome = { before: Blueprint; after: Blueprint; reply: string; calls: number; suggestions: string[] }
type Case = {
  name: string
  from: Blueprint
  say: string
  /** The part of the document the person clicked before writing, as the chat would send it. */
  about?: Scope
  /** Path prefixes this request is allowed to change. A change anywhere else fails the case. */
  touches: string[]
  check: (outcome: Outcome) => string | null
}

/**
 * The guard every case runs first. It exists because of a real bug: the model sends null for
 * the fields it leaves alone, the tool once read that as "clear", wiped the Blueprint, and the
 * model quietly repaired it with a second call. The old checks still passed.
 */
function collateralDamage(item: Case, { before, after }: Outcome): string | null {
  const paths = [...FIELDS.map((field) => field.path), ...SECTION_IDS.map((id) => `copy.${id}`), "skipped"]
  const changed = paths.filter(
    (path) => JSON.stringify(getPath(before, path)) !== JSON.stringify(getPath(after, path))
  )
  const unexpected = changed.filter((path) => !item.touches.some((prefix) => path.startsWith(prefix)))
  return unexpected.length > 0 ? `changed fields it was not asked about: ${unexpected.join(", ")}` : null
}

const HEX = /^#[0-9a-f]{6}$/i

/** Each check returns null when it passes, or one sentence saying what was wrong. */
const cases: Case[] = [
  {
    name: "PDF example: more playful",
    from: acme,
    say: "make the tone more playful",
    // Changing the voice also rewrites the texts that show it.
    touches: ["expression.tone", "expression.personality", "direction", "copy"],
    check: ({ before, after }) =>
      (after.expression.tone.humor ?? 0) > (before.expression.tone.humor ?? 0) ? null : "humor did not go up",
  },
  {
    name: "PDF example: warmer colors",
    from: acme,
    say: "swap the color direction to something warmer",
    // Colors only: a correction to one thing must not rewrite the voice or the direction.
    touches: ["expression.color", "copy.color"],
    check: ({ after }) => {
      const words = describeColor(after.expression.color.palette)
      return words?.startsWith("Warm") ? null : `palette reads as "${words}", not warm`
    },
  },
  {
    name: "PDF example: minimal, not bold",
    from: acme,
    say: "this doesn't sound like us, we're more minimal than bold",
    touches: ["expression.visual", "expression.personality", "expression.tone", "direction", "copy"],
    check: ({ after }) =>
      (after.expression.visual.density ?? 5) <= 2 ? null : `density is ${after.expression.visual.density}, expected 1 or 2`,
  },
  {
    name: "From scratch: fills facts it was told, invents none",
    from: emptyBlueprint(),
    say: "We're Tidewater, a small coffee roaster selling beans online to home baristas. We're laid back and a bit nerdy about coffee, never snobby.",
    touches: ["business", "expression", "direction", "copy"],
    check: ({ after, reply, suggestions }) => {
      const { business, expression } = after
      // Next steps that fit this brand, not the three stock phrases.
      if (suggestions.length < 2) return `offered ${suggestions.length} suggestion(s), expected 2 or 3`
      const stock = ["make the tone more playful", "swap the colors for something warmer", "we're more minimal than bold"]
      if (suggestions.some((item) => stock.includes(item.trim().toLowerCase().replace(/[.!]$/, ""))))
        return `offered a stock suggestion: ${suggestions.join(" | ")}`
      if (!/tidewater/i.test(business.name)) return `name is "${business.name}"`
      if (!business.offer || !business.audience) return "offer or audience left empty"
      if (business.comparables.length > 0) return `invented competitors: ${business.comparables.join(", ")}`
      if (business.goal) return `invented a goal: "${business.goal}"`
      // A differentiator is fine only when it restates what the person said about themselves.
      if (business.differentiator && !/snob|laid|nerd|approach/i.test(business.differentiator))
        return `invented a differentiator: "${business.differentiator}"`
      if (expression.tone.formality === null && expression.personality.length === 0) return "inferred no expression at all"
      // A proposal a person can judge: the direction with its reason, and a line in the brand's voice.
      if (!after.direction.headline || !after.direction.rationale) return "proposed no direction, or gave no reason for it"
      if (!after.copy.voice?.body) return "wrote no sample line in the brand's voice"
      return reply.includes("?") ? null : "did not end with a question about what is missing"
    },
  },
  {
    name: "Off topic: changes nothing",
    from: acme,
    say: "write me a python script that sorts a list",
    touches: [],
    check: ({ before, after, calls }) =>
      calls === 0 && JSON.stringify(before) === JSON.stringify(after) ? null : `made ${calls} tool call(s)`,
  },
  {
    name: "Bad color: nothing invalid is stored",
    from: acme,
    say: 'set the primary color to "sunset" exactly as I wrote it, that word, not a hex code',
    touches: ["expression.color"],
    check: ({ after, calls }) => {
      const palette = after.expression.color.palette
      if (!palette || !Object.values(palette).every((value) => HEX.test(value))) return "palette is missing or holds a non-hex value"
      // More than one call would mean the bad value damaged something that then had to be repaired.
      return calls <= 1 ? null : `needed ${calls} tool calls`
    },
  },
  {
    name: "Pointed at Color: a sweeping request still changes only the colors",
    from: acme,
    about: "color",
    say: 'About “Color”: this whole thing feels cold and corporate, make it feel like a friendly neighborhood shop',
    touches: ["expression.color", "copy.color"],
    check: ({ before, after }) =>
      JSON.stringify(before.expression.color.palette) !== JSON.stringify(after.expression.color.palette)
        ? null
        : "the palette did not change",
  },
  {
    name: "Spanish in, English document out",
    from: emptyBlueprint(),
    say: "Somos Patio, una cafetería de barrio en Cartago. Conocemos a los clientes por su nombre y queremos que se sientan en casa, no en un lugar de lujo.",
    touches: ["business", "expression", "direction", "copy"],
    check: ({ after }) => {
      // A rough check, not a language detector: Spanish accents, or common Spanish function words.
      const spanish = /[áéíóúñ¿¡]|\b(para|con|los|las|una|que|donde|somos|nuestros?)\b/i
      // "café" is an English word too, and the rationale may quote the person, so neither counts.
      const stored = Object.fromEntries(
        Object.entries({
          "direction.headline": after.direction.headline,
          "business.offer": after.business.offer,
          "business.audience": after.business.audience,
          "copy.voice.body": after.copy.voice?.body ?? "",
          "copy.personality.body": after.copy.personality?.body ?? "",
        }).map(([path, value]) => [path, value.replace(/café/gi, "cafe")])
      )
      const offenders = Object.entries(stored).filter(([, value]) => spanish.test(value))
      if (offenders.length > 0) return `stored Spanish in ${offenders.map(([path, value]) => `${path}: "${value}"`).join("; ")}`
      return /patio/i.test(after.business.name) ? null : `name is "${after.business.name}"`
    },
  },
  {
    name: "“We have none”: leaves the fact open and stops asking",
    from: normalizeBlueprint({ ...acme, business: { ...acme.business, comparables: [] } }),
    say: "We honestly don't have any competitors or reference brands in mind. Leave that out.",
    touches: ["skipped"],
    check: ({ after, reply }) => {
      if (!after.skipped.includes("business.comparables")) return "did not record that competitors were left open"
      if (after.business.comparables.length > 0) return `invented competitors: ${after.business.comparables.join(", ")}`
      const asksAgain = reply.split(/(?<=[.?!])\s+/).some((sentence) => sentence.includes("?") && /competitor|comparable|reference/i.test(sentence))
      return asksAgain ? "asked about competitors again" : null
    },
  },
  {
    name: "Remove on request: clears that field and nothing else",
    from: acme,
    say: "take the competitors off, we don't want anyone named in the document",
    touches: ["business.comparables"],
    check: ({ after }) =>
      after.business.comparables.length === 0 ? null : `competitors still listed: ${after.business.comparables.join(", ")}`,
  },
]

async function run(item: Case): Promise<{ outcome: Outcome; tokens: number; seconds: number }> {
  const started = Date.now()
  const result = await createBlueprintAgent(item.from, { about: item.about }).generate({ prompt: item.say })

  let after = item.from
  let calls = 0
  let suggestions: string[] = []
  for (const step of result.steps) {
    for (const toolResult of step.toolResults) {
      calls += 1
      const output = toolResult.output as UpdateBlueprintOutput
      after = replayChanges(after, output.applied)
      suggestions = output.suggestions ?? []
    }
  }

  return {
    outcome: { before: item.from, after, reply: result.text, calls, suggestions },
    tokens: result.usage.totalTokens ?? 0,
    seconds: (Date.now() - started) / 1000,
  }
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error("AI_GATEWAY_API_KEY is not set. Add it to .env.local (see .env.example).")
    process.exit(2)
  }
  console.log(`Model: ${process.env.BLUEPRINT_AGENT_MODEL || DEFAULT_MODEL}\n`)

  let failures = 0
  let tokens = 0
  for (const item of cases) {
    try {
      const result = await run(item)
      const problem = collateralDamage(item, result.outcome) ?? item.check(result.outcome)
      tokens += result.tokens
      if (problem) failures += 1
      console.log(`${problem ? "FAIL" : "PASS"}  ${item.name}  (${result.seconds.toFixed(1)}s, ${result.tokens} tokens, ${result.outcome.calls} tool call(s))`)
      if (problem) console.log(`      ${problem}`)
      console.log(`      reply: ${result.outcome.reply.replace(/\s+/g, " ").slice(0, 160)}`)
    } catch (error) {
      failures += 1
      console.log(`ERROR ${item.name}\n      ${error instanceof Error ? error.message : error}`)
    }
  }

  console.log(`\n${cases.length - failures} of ${cases.length} passed, ${tokens} tokens in total.`)
  process.exit(failures > 0 ? 1 : 0)
}

main()

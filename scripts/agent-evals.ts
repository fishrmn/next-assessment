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
import { emptyBlueprint, normalizeBlueprint, type Blueprint } from "../src/lib/blueprint/model"
import { replayChanges } from "../src/lib/blueprint/patch"
import { describeColor } from "../src/lib/blueprint/registry"

if (existsSync(".env.local")) process.loadEnvFile(".env.local")

const acme = normalizeBlueprint({
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

type Outcome = { before: Blueprint; after: Blueprint; reply: string; calls: number }
type Case = { name: string; from: Blueprint; say: string; check: (outcome: Outcome) => string | null }

const HEX = /^#[0-9a-f]{6}$/i

/** Each check returns null when it passes, or one sentence saying what was wrong. */
const cases: Case[] = [
  {
    name: "PDF example: more playful",
    from: acme,
    say: "make the tone more playful",
    check: ({ before, after }) =>
      (after.expression.tone.humor ?? 0) > (before.expression.tone.humor ?? 0) ? null : "humor did not go up",
  },
  {
    name: "PDF example: warmer colors",
    from: acme,
    say: "swap the color direction to something warmer",
    check: ({ after }) => {
      const words = describeColor(after.expression.color.palette)
      return words?.startsWith("Warm") ? null : `palette reads as "${words}", not warm`
    },
  },
  {
    name: "PDF example: minimal, not bold",
    from: acme,
    say: "this doesn't sound like us, we're more minimal than bold",
    check: ({ after }) =>
      (after.expression.visual.density ?? 5) <= 2 ? null : `density is ${after.expression.visual.density}, expected 1 or 2`,
  },
  {
    name: "From scratch: fills facts it was told, invents none",
    from: emptyBlueprint(),
    say: "We're Tidewater, a small coffee roaster selling beans online to home baristas. We're laid back and a bit nerdy about coffee, never snobby.",
    check: ({ after, reply }) => {
      const { business, expression } = after
      if (!/tidewater/i.test(business.name)) return `name is "${business.name}"`
      if (!business.offer || !business.audience) return "offer or audience left empty"
      if (business.comparables.length > 0) return `invented competitors: ${business.comparables.join(", ")}`
      if (business.differentiator || business.goal) return "invented a goal or differentiator"
      if (expression.tone.formality === null && expression.personality.length === 0) return "inferred no expression at all"
      return reply.includes("?") ? null : "did not end with a question about what is missing"
    },
  },
  {
    name: "Off topic: changes nothing",
    from: acme,
    say: "write me a python script that sorts a list",
    check: ({ before, after, calls }) =>
      calls === 0 && JSON.stringify(before) === JSON.stringify(after) ? null : `made ${calls} tool call(s)`,
  },
  {
    name: "Bad color: nothing invalid is stored",
    from: acme,
    say: 'set the primary color to "sunset" exactly as I wrote it, that word, not a hex code',
    check: ({ after }) => {
      const palette = after.expression.color.palette
      return palette && Object.values(palette).every((value) => HEX.test(value)) ? null : "palette is missing or holds a non-hex value"
    },
  },
]

async function run(item: Case): Promise<{ outcome: Outcome; tokens: number; seconds: number }> {
  const started = Date.now()
  const result = await createBlueprintAgent(item.from).generate({ prompt: item.say })

  let after = item.from
  let calls = 0
  for (const step of result.steps) {
    for (const toolResult of step.toolResults) {
      calls += 1
      after = replayChanges(after, (toolResult.output as UpdateBlueprintOutput).applied)
    }
  }

  return {
    outcome: { before: item.from, after, reply: result.text, calls },
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
      const problem = item.check(result.outcome)
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

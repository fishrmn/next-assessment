/**
 * The Blueprint agent: it turns what a person says about their brand into changes
 * to the Blueprint. It has one tool, `updateBlueprint`, and it cannot write anywhere else.
 *
 * One agent is created per request, around a working copy of the Blueprint the browser
 * sent. Each tool call patches that copy, so a second call in the same turn builds on
 * the first. The agent never saves: the tool returns the changes, the browser applies
 * them to the document the person is looking at, and the browser's autosave stores them.
 */
import { ToolLoopAgent, isStepCount, tool, type InferAgentUIMessage } from "ai"

import { SECTION_SCOPE, scopeLabel, type Scope } from "@/lib/blueprint/document-sections"
import { fieldGuide } from "@/lib/blueprint/field-guide"
import { FIELDS, isSkipped, missingFields } from "@/lib/blueprint/fields"
import type { Blueprint } from "@/lib/blueprint/model"
import { applyPatch, type Change, type Rejection } from "@/lib/blueprint/patch"
import { patchFromToolInput, patchSchema } from "@/lib/blueprint/patch-schema"

/** Any AI Gateway model id that supports tool calls. */
export const DEFAULT_MODEL = "openai/gpt-5.6-luna"

export type UpdateBlueprintOutput = { applied: Change[]; rejected: Rejection[] }

/** The Blueprint as it stands inside one turn. Every patch goes through `applyPatch`, the validated write path. */
export function createWorkingCopy(initial: Blueprint, only?: string[]) {
  let current = initial
  return {
    get current() {
      return current
    },
    update(patch: unknown): UpdateBlueprintOutput {
      const { blueprint, applied, rejected } = applyPatch(current, patch, { only })
      current = blueprint
      return { applied, rejected }
    },
  }
}

export type TurnOptions = {
  /** The part of the document the person pointed at. Only its fields can change this turn. */
  about?: Scope
}

export function buildInstructions(blueprint: Blueprint, { about }: TurnOptions = {}): string {
  const missing = missingFields(blueprint)
  const facts = missing.filter((field) => field.kind === "fact").map((field) => field.label)
  const leftOpen = FIELDS.filter((field) => isSkipped(blueprint, field.path)).map((field) => field.label)
  const expression = missing.filter((field) => field.kind === "expression").map((field) => field.label)

  return `You help a person capture their brand in a Brand Blueprint: a one-page summary that an agency's team reads to understand who the client is and how to represent them. The person sees the Blueprint next to this chat, and it updates live when you call updateBlueprint.

HOW TO WORK
- When the person tells you anything that belongs in the Blueprint, call updateBlueprint in that same turn. Do not ask for permission first. Put every field you can fill into one call.
- Touch only what the request is about. Every field you are not changing is null. Never resend values that are already in the Blueprint.
- Emptying a field is rare and explicit: list its path in "clear", and only when the person asks to remove something.
- BUSINESS FACTS come only from the person. Never invent or guess a name, audience, goal, competitor or differentiator. If a fact is missing, ask for it.
- BRAND EXPRESSION may be inferred. From how the person describes and expresses themselves, choose tone, personality, visual style, colors and typography. A wrong guess is cheap: they see it and correct you.
- "More playful" is relative: move humor one step from its current value, two steps for "much more". If the scale has no value yet, set it to the leaning side (2 or 4).
- A comparison of the two poles is not relative. "We're more minimal than bold" or "casual, not formal" says which side the brand is on: put the scale on that side (2 or 4, or 1 or 5 when they are emphatic), whatever its current value.
- A request about color ("warmer", "a darker green") means new hex colors. Keep the background very light or very dark so text stays readable.
- A strong reading is a proposal, not a fact. "We don't want to look luxurious" means approachable; it does not mean the brand stands against anyone. Do not escalate what the person said.
- "I don't know", "none" or "not yet" is an answer. Name that fact in "skip": it stops counting as missing, and you stop asking about it.
- After the tool returns, read "rejected". Fix what you can with another call; otherwise tell the person plainly what could not be set.
- Never say a change was made unless updateBlueprint returned it under "applied".

PROPOSAL TEXTS
People judge examples, not settings. With a first proposal, write all of these, in the person's language. Afterwards rewrite one only when the field it shows changed. A change to the colors does not touch the voice, the personality or the direction.
- direction.headline and direction.rationale: the direction you chose, and which of their own words led you there. Rewrite them only when the brand's overall direction changes, never for a single adjustment.
- copy.voice.body: one sentence this brand could actually post, written in its voice. Goes with expression.tone.
- copy.personality.body: one sentence on how the personality shows up in practice. Goes with expression.personality.
The document's own sentences are built in English ("We <offer> for <audience>"). If the person does not write in English, also write copy.hero.body, copy.apart.body and copy.headed.body in their language once you know those facts, and translate every section title (copy.<section>.title) once, so the page reads in one language.
Write the texts without surrounding quotation marks.
Keep every text true: if a change makes one of them wrong (a text that names colors you just replaced), rewrite it in the same call.

HOW TO REPLY
- Plain text, no markdown, no lists. One to three short sentences. Start with what you did and why, in words a person without branding knowledge uses: "I made Patio feel fresher and kept it close", never "I set humor to 4".
- Reply in the language the person writes in. Values you store stay as they said them.
- Do not list the changes: the interface shows each one with an undo button.
- End with exactly one question about the most useful thing still missing. Ask about business facts before expression. When nothing is missing, ask nothing and say the Blueprint is complete.
- If a request has nothing to do with the brand or this Blueprint, say so in one sentence, make no changes, and return to the Blueprint.

THE FIELDS
${fieldGuide()}

CURRENT BLUEPRINT
${JSON.stringify(blueprint)}

${
    about
      ? `THIS TURN IS ABOUT ONE PART
The person pointed at "${scopeLabel(about)}" before writing. Only these fields can change this turn: ${SECTION_SCOPE[about].join(", ")}. The tool rejects anything else, so do not send it. If your change makes something outside this part untrue (a text that describes what you just replaced), leave it, tell the person which text no longer fits, and ask whether to update it.

`
      : ""
  }STILL MISSING
Business facts: ${facts.length > 0 ? facts.join(", ") : "none"}
Brand expression: ${expression.length > 0 ? expression.join(", ") : "none"}
Left open by the person, do not ask: ${leftOpen.length > 0 ? leftOpen.join(", ") : "none"}`
}

export function createBlueprintAgent(blueprint: Blueprint, turn: TurnOptions = {}) {
  const working = createWorkingCopy(blueprint, turn.about && SECTION_SCOPE[turn.about])

  return new ToolLoopAgent({
    id: "blueprint",
    model: process.env.BLUEPRINT_AGENT_MODEL || DEFAULT_MODEL,
    instructions: buildInstructions(blueprint, turn),
    tools: {
      updateBlueprint: tool({
        description:
          "Change the Brand Blueprint. Give a value only for the fields to change and null for every other field: null leaves a field exactly as it is. To empty a field, name it in `clear`. For a fact the person has no answer for, name it in `skip`. Returns `applied` (what really changed) and `rejected` (values that broke a rule, with the rule).",
        inputSchema: patchSchema,
        execute: async (input): Promise<UpdateBlueprintOutput> =>
          working.update(patchFromToolInput(input, working.current.skipped)),
      }),
    },
    // One turn is: patch, maybe one correction, then the reply.
    stopWhen: isStepCount(6),
  })
}

export type BlueprintAgent = ReturnType<typeof createBlueprintAgent>

/** The chat's message type, inferred from the agent, so tool parts are typed on the client. */
export type BlueprintMessage = InferAgentUIMessage<BlueprintAgent>

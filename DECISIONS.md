# Decisions

Why the Brand Blueprint Builder is built the way it is: the decisions, what was rejected, what
user testing changed, known limits and next steps. How to run it is in the [README](README.md).

## What this is

A Brand Blueprint is a one-page summary of a client's brand: business context (who they are, who
they serve, what sets them apart) and brand expression (voice, personality, look, color, type).

Here a Blueprint is captured and edited **in natural language**. There is no form. You describe
the brand, an agent fills in the one-pager next to the chat, and every change it makes is listed with
before, after and an Undo. "Make the tone more playful", "something warmer", "we're more minimal than
bold" all work the same way.

How I got here: I first built the guided intake the brief describes (commit `1f7b206`), then an
inspect tool to edit the document in place. Both still asked the person to do the work: ten decisions
in one case, find-and-retype in the other. The friction was never the input device, it was the number
of decisions. An agent brings that down to one: "tell me about your brand".

## What happens when you press Enter

1. The browser sends the message together with the Blueprint **as it is on screen**.
2. The server validates that Blueprint and builds the agent's instructions from code: a guide to the
   fields, the current Blueprint as JSON, and the list of fields still missing.
3. The model calls its one tool, `updateBlueprint`, with a partial Blueprint. Or it asks one question.
4. The tool merges the patch, runs it through `normalizeBlueprint`, and returns `applied` (what really
   changed, in words) and `rejected` (the rule that was broken). The model sees rejections and can
   correct itself in the same turn.
5. The browser applies `applied` exactly once, through the same `update` every edit has always used.
   The document re-renders and the autosave stores it.
6. The agent closes with the next useful question. That question is what replaced the wizard.

## Decisions, and why

- **Brand expression is stored as positions on scales (1 to 5), not prose.** All three example edits
  in the brief are moves along an axis. On a scale, "more playful" is `humor: 2 → 4`: visible,
  checkable, undoable. This decision predates the agent and is the reason the agent was cheap to add.
- **One tool.** The Blueprint's whole write API is `applyPatch`. Fewer tools means fewer decisions
  for the model; the patch schema mirrors the data model and is generated from its lists, so the
  model cannot be offered a font or a trait the Blueprint does not accept.
- **One gate.** `normalizeBlueprint` validates data from the database, the browser and the model.
  The Zod schema guides the model; it is not the guard.
- **The browser is the only writer of a Blueprint.** The agent returns changes and never saves. Two
  writers would let a late autosave overwrite the agent. The route stores only the chat transcript.
- **Facts are asked, expression is inferred.** The agent never invents an audience or a competitor.
  It may infer tone, personality, colors and type. A wrong tone shows up in the document and costs
  one message to fix; an invented competitor is a lie inside the deliverable.
- **Describe a field once.** The patch schema, the agent's field guide and the document all read the
  same registry.
- **The color direction is derived, not stored.** "Warm and vivid" is read off the primary color.
  With an agent choosing free hex values, a stored label could contradict the palette.
- **The greeting is static.** Opening a chat costs no model call.

## What I rejected

- **A single structured-output call without a tool loop.** It covers "make it more playful". It does
  not cover "handle everything": asking for what is missing, and correcting a rejected value within
  the turn. With the AI SDK the loop costs about the same code.
- **eve (Vercel's agent framework).** It integrates with Next.js cleanly, but `eve@0.61.1` requires
  Node 24 (this repo pins Node 22), is in preview with several releases a day, and ships shell and
  file tools by default. Its durability and channels do not touch the friction in question. The tool
  defined here ports to it almost unchanged.
- **Keeping the wizard or the inspector next to the chat.** Three ways to edit is more to learn, and
  manual edits during an agent turn need locking. One way to edit: talk. The model's `copy` layer
  survives, so the agent can reword the document's own titles and descriptions.
- **A markdown renderer / a chat UI kit.** The agent is told to answer in short plain text, and
  shadcn's own message, bubble, marker and scroller components cover the rest.

## How it was verified

- `npx tsc --noEmit`, `npm run lint`, `npm test` (54 unit tests, no model calls) and `npx next build`.
- `npm run agent:evals`: ten messages against the real model (`openai/gpt-5.6-luna` through the
  Vercel AI Gateway), checked by range, each case failing on any change outside the fields it may
  touch. 10 of 10, four runs in a row:

  ```
  PASS  PDF example: more playful  (8496 tokens, 1 tool call)
  PASS  PDF example: warmer colors  (8644 tokens, 1 tool call)
  PASS  PDF example: minimal, not bold  (8655 tokens, 1 tool call)
  PASS  From scratch: fills facts it was told, invents none  (9725 tokens, 1 tool call)
  PASS  Off topic: changes nothing  (3971 tokens, 0 tool call)
  PASS  Bad color: nothing invalid is stored  (8514 tokens, 1 tool call)
  PASS  Pointed at Color: a sweeping request still changes only the colors  (8940 tokens, 1 tool call)
  PASS  Spanish in, English document out  (10435 tokens, 1 tool call)
  PASS  “We have none”: leaves the fact open and stops asking  (8343 tokens, 1 tool call)
  PASS  Remove on request: clears that field and nothing else  (8320 tokens, 1 tool call)
  10 of 10 passed, 84043 tokens in total.
  ```

- One real turn through `POST /api/agents/blueprint`, in Spanish ("somos una fintech para pymes,
  relajados pero serios con la plata"): the agent set industry and audience from what was said,
  inferred personality, tone and typography, answered in Spanish, and asked what the company does.

### The bug the evals found

The first run against the real model passed 5 of 6 and hid a data-loss bug. OpenAI's function calling
makes the model fill in every property of the tool's schema, so it sends `null` for each field it
wants to leave alone. My tool read `null` as "clear". "Make the tone more playful" emptied the whole
Blueprint; the model saw the damage in the tool's result and repaired it with a second call. The
evals passed because they only looked at `humor`.

The fix is a poka-yoke on the tool, not a plea in the prompt: in the tool's input `null` means
"leave alone", and emptying a field needs a separate, explicit `clear` list of known paths. Every eval
case now declares which fields it may touch and fails on any other change. The same pass fixed a
second path to data loss (one invalid color erased the palette): a rejected value now keeps the value
that was there.

- Persistence: Blueprint and chat survive a stop and restart of the app.

## What user testing changed

Three rounds with invented brands (a café, a clothing-repair shop), run by someone who did not write
the code. Each round found things no unit test or eval had. The pattern in the fixes: **when a rule
mattered, asking the model in words was not enough; the rule moved into code, and the model is only
told the result.**

| Found in use | Fixed with |
|---|---|
| "More playful" wiped the whole Blueprint (the model sends `null` for fields it leaves alone) | Code: in the tool's input `null` means "leave alone"; emptying needs an explicit `clear` list |
| One invalid color erased the palette | Code: a rejected value keeps the value that was there |
| The chat history vanished on reload (`useChat` overwrites a body field named `id`) | Code: the field is `blueprintId`; a transcript that is not stored is logged |
| Clicked "Color", asked for a change, and the voice and direction changed too | Code: the clicked part travels as `about`, and the tool rejects every path outside it |
| "We have no competitors": agent said complete, page said open, document showed a blank | Code: a `skipped` list in the model; one function decides what is missing for all three |
| "Undone" disappeared from the chat after a reload | Code: undone call ids are stored |
| Half-Spanish, half-English document | Decision: the Blueprint is always English. Instructions plus the tool's field descriptions (instructions alone failed one run in two) |
| Fifteen rows of changes to read; a long first proposal | UI: "N changes · Undo · View details"; the document leads with direction, a voice sample and a visual sample, parameters folded |
| The same three stock suggestions for every brand | The agent proposes next messages with each update |

The evals grew with every finding: each case declares which fields it may touch and fails on any
other change. 10 cases, 10 of 10 three runs in a row with `openai/gpt-5.6-luna` (about 83k tokens a run).

## Known limits

- Undo is offered for changes made in the current session. After a reload, earlier changes are
  history (shown as "Undone" when they were undone): the stored Blueprint already contains them.
- Blueprints written before the English rule stay in the language they were written in.
- A strict scope can frustrate: pointing at "Color" and also asking for a playful voice changes only
  the color. The agent says so, and the "About…" chip comes off with one click.
- The transcript is stored when a turn ends and the Blueprint about 600ms after a change. Closing the
  tab inside that window can store a transcript whose last change was not saved.
- Fonts are a fixed list of five pairings (they have to be loaded). Colors are free.
- The document is always English; the agent's chat replies follow the person's language.
- No auth and no multi-user handling: it is a local tool on SQLite.

## What I would do next

- Let the agent read the client's website (`web_fetch`) so the first message can be just a URL.
- Stream the patch while the model writes it, so the document moves before the tool call finishes.
- Grow the evals into a regression suite and run them on a schedule against two or three models.
- Per-change Undo that survives a reload, by storing undone call ids with the transcript.

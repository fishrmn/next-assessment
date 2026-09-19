<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Brand Blueprint Builder

A client's brand (business context and brand expression) captured as a persistent, presentable
one-page Brand Blueprint. The Blueprint is captured and edited by talking to an AI agent: there is
no form.

## Stack

- **Next.js 16 (App Router) + TypeScript** — `src/app/`. Use Server Components by default; client components only where interactivity requires it.
- **Tailwind CSS v4 + shadcn/ui (Base UI style)** — UI primitives in `src/components/ui/` (shadcn-managed; add more with `npx shadcn@latest add <component>`, don't hand-edit). Only the components the app uses are kept.
- **AI SDK 7** (`ai`, `@ai-sdk/react`) — the agent and the chat. Read `node_modules/ai/docs/` before changing either: the API differs from older versions (`uiMessages`, `isStepCount`, `onEnd`).
- **SQLite + Drizzle ORM** — see Database below.
- **Node 22** — pinned in `.nvmrc`.

## Environment

`.env.local` (never committed; see `.env.example`), read server-side only:

- `AI_GATEWAY_API_KEY` — Vercel AI Gateway key. Without it the chat route answers 503 and the chat shows why.
- `BLUEPRINT_AGENT_MODEL` — optional Gateway model id with tool calls. Default `openai/gpt-5.6-luna`.

## How a Blueprint is edited

1. The browser holds the Blueprint while a workspace is open and sends it with every chat message.
2. `POST /api/agents/blueprint` creates one agent around a working copy of that Blueprint.
3. The agent's only tool, `updateBlueprint`, runs `applyPatch`: merge, validate with `normalizeBlueprint`, report `applied` and `rejected`.
4. The chat applies each tool result exactly once through the workspace's `update`, which re-renders the document and triggers the autosave.

Rules that must hold:

- **The browser is the only writer of `blueprints.data`.** The agent returns changes and never saves. The route writes only `blueprints.messages` (the transcript).
- **`normalizeBlueprint` is the only gate.** Data from the database, the browser and the model all pass through it.
- **Business facts come from the person; brand expression may be inferred.** This is in the agent's instructions and checked by the evals.
- **Describe a field once.** Lists live in `model.ts`, wording in `registry.ts` and `document-sections.ts`. The patch schema, the agent's field guide and the document are generated from them.

## Database (Drizzle + better-sqlite3)

Do not install another ORM.

- Schema: `src/db/schema.ts`. One table, `blueprints`: `id`, `name`, JSON `data` (the Blueprint), JSON `messages` (the chat), timestamps.
- Client: `import { db } from "@/db"` — **server-side only**. Queries live in `src/lib/blueprints.ts`.
- The DB file is `local.db` at the repo root (gitignored).

If the user wants to see the studio you may create a terminal instance running `npm run db:studio` as long as you verify that https://local.drizzle.studio/ is not already up and running.

| Command | Use when |
|---------|----------|
| `npm run db:push` | After any change to `src/db/schema.ts` |
| `npm run db:studio` | To inspect/edit data in a browser GUI |
| `npm run db:seed` | Insert example data (idempotent) |
| `npm run db:reset` | Delete `local.db`, recreate from schema, re-seed |

If `local.db` is missing or queries fail with "no such table", run `npm run db:reset`.

## File map

```
src/
  agents/
    blueprint.ts          # the agent, its instructions and its one tool
    blueprint-history.ts  # validates stored chat messages before the chat shows them
  actions/blueprints.ts   # server actions: create, autosave
  app/
    (app)/                # screens inside the shell (sidebar + header)
    api/agents/blueprint/ # the chat route
    blueprints/[id]/present/  # full-screen document, outside the shell
  components/
    ui/                   # shadcn primitives
    blueprint-chat/       # provider (useChat + apply once + undo), messages, changes, input
    blueprint/            # workspace (owns the Blueprint + autosave), blueprint-document
    app-shell, app-sidebar, app-breadcrumb, page-header, theme-*
  db/                     # schema.ts, index.ts (shared client)
  lib/blueprint/
    model.ts              # the Blueprint type, its lists, normalizeBlueprint
    patch.ts              # applyPatch, replayChanges, revertChanges
    patch-schema.ts       # the patch as a Zod schema (the tool's input)
    fields.ts             # flat field list, missing fields, completion
    field-guide.ts        # the fields described for the agent
    registry.ts           # scales, fonts, palettes, values in words
    document-sections.ts  # the document's text slots (generated or reworded)
scripts/                  # seed.ts, reset.ts, agent-evals.ts (run via tsx)
```

## Conventions

- Every screen lives under `src/app/(app)/`, renders inside `components/app-shell.tsx`, and starts with `components/page-header.tsx` (primary action on the right).
- Server Actions under `src/actions/`, queries under `src/lib/`, never inside `src/app/`.
- Colors via semantic tokens. The one exception is the Blueprint document, which renders the client's own palette from data.
- A component drawn inside a panel lays itself out by its container (`@container`), not by the window. Text a person or the model wrote gets `max-w-full wrap-anywhere`.
- Verify changes with `npx tsc --noEmit`, `npm run lint`, and `npm test`. After changing the agent's instructions, the patch schema or the model id, also run `npm run agent:evals`.

## Testing & pre-commit

- **Vitest + React Testing Library** (jsdom). Test files are colocated: `*.test.ts(x)` next to the code. Vitest runs without globals, so component tests call `afterEach(cleanup)` themselves. Vitest cannot test `async` Server Components.
- Unit tests never call a model. `npm run agent:evals` does: six messages against the real model, checked by range. It costs a few cents and is not part of `npm test` or the hook.
- **Husky pre-commit hook** (`.husky/pre-commit`) runs `tsc --noEmit`, then lint-staged (`eslint` + `vitest related` on staged files). Do not skip it with `--no-verify` — fix the failure instead.

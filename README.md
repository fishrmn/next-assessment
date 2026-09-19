# Brand Blueprint Builder

Everything is scaffolded and waiting for you. Clone the repo at [https://github.com/fishrmn/next-assessment](https://github.com/fishrmn/next-assessment) and start the assignment!

## This submission

The brief below is kept as it was given. This section describes what was built on top of it.

A Blueprint is captured and edited by **talking to an agent**. There is no form: you describe the
brand, the agent fills in the one-pager next to the chat, and every change it makes is listed with
an Undo. "Make the tone more playful" or "a darker green" work the same way.

**Run it**

```bash
nvm use                      # Node 22.22.0 exactly; npm install refuses any other version
npm install
cp .env.example .env.local   # then set AI_GATEWAY_API_KEY (Vercel AI Gateway)
npm run db:reset
npm run dev
```

Without a key the app runs and the chat explains what is missing. The decisions behind the
design, what was rejected and what user testing changed are in [`DECISIONS.md`](DECISIONS.md).

**How it works**

| Piece | Where | What it does |
|---|---|---|
| Model | `src/lib/blueprint/model.ts` | One JSON object per Blueprint. `normalizeBlueprint` is the single gate for all input. |
| Write API | `src/lib/blueprint/patch.ts` | `applyPatch` merges a partial Blueprint, validates it, and reports `applied` and `rejected`. |
| Agent | `src/agents/blueprint.ts` | One tool, `updateBlueprint`. Instructions are generated from the field registry. |
| Route | `src/app/api/agents/blueprint/route.ts` | Streams one chat turn and stores the transcript. |
| Chat | `src/components/blueprint-chat/` | Sends the on-screen Blueprint with each message, applies each result once, lists changes. |
| Document | `src/components/blueprint/blueprint-document.tsx` | A pure render of the model, in the client's colors and fonts. |

The browser is the only writer of a Blueprint (autosave). The agent returns changes; it never saves.

**Check it**

```bash
npm test              # 54 unit tests, no model calls
npm run agent:evals   # 10 cases against the real model, a few cents
```

## Project stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- SQLite + Drizzle ORM, wired and seeded, with commands to reset and browse data
- An example component (`TextElement`) showing one possible component pattern
- Vitest + React Testing Library with an example test
- Pre-commit hooks that type-check, lint, and run related tests

## Ground rules

- You will have approximately 1 hour to complete your project after you start.
- You're welcome to replace the project scaffolding and start from scratch if you'd rather.
- You may use any tool that you are comfortable with, and have access to, including AI tools.
- We can provide an OpenAI API key to you during your session if you need one.

## Getting started

### Locally (Node v22)

```bash
git clone git@github.com:fishrmn/next-assessment.git
cd next-assessment
npm install
npm run db:reset
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page summarizes this brief and is yours to replace as the app takes shape.

> **Node version matters.** This repo pins Node `22.22.0` (see `.nvmrc`) and `better-sqlite3` compiles native bindings for whatever Node version is active during `npm install`. If you `npm install` under a different Node version, `npm install` will now fail with an `EBADENGINE` error (see `package.json` → `engines`) rather than silently installing broken bindings. If you still hit `Could not locate the bindings file` (e.g. `node_modules` was installed before pulling this fix, or you switched Node versions in place with `nvm use` without reinstalling), run:
>
> ```bash
> nvm use
> npm rebuild better-sqlite3 --build-from-source
> ```

### Docker

```bash
git clone git@github.com:fishrmn/next-assessment.git
cd next-assessment
npm run docker
```

Requires [Docker](https://docs.docker.com/get-docker/) and a `.env.local` file (same as the local workflow above). This starts the stack in the background, waits for Drizzle Studio and the app to respond, then opens [https://local.drizzle.studio/](https://local.drizzle.studio/) and [http://localhost:3000](http://localhost:3000) in your default browser. Logs stream in the terminal until you press Ctrl+C (containers keep running).

To start without opening browsers: `DOCKER_OPEN_BROWSER=0 npm run docker`

To run in the foreground without the browser helper: `npm run docker:up`

On first run, the `db-init` service creates and seeds the database if it does not exist yet.

Drizzle Studio (database GUI) starts alongside the app. An nginx proxy on port 4983 forwards traffic to the studio container and adds the browser headers Docker requires.

- The SQLite database persists in the `sqlite_data` named volume across restarts.
- Rebuild after dependency changes: `npm run docker`
- Stop: `docker compose down` (add `-v` to also wipe the database volume)

## What's a Brand Blueprint?

A Brand Blueprint is a one-page summary of a client's brand, built from a short, self-guided intake process, that the team can use to understand who the client is and how to represent them from day one.

It covers two layers:

- **Business context** — who they are, who they serve, and what they're trying to accomplish. Things like their industry, target audience, competitors or comparable brands, and what makes them different.
- **Brand expression** — how that identity should look, sound, and feel. This includes visual style, color and typography direction, tone of voice, and personality.

Together, these give the team enough grounding to make brand-consistent decisions later, not just a moodboard with no context behind it. It's the reference doc we hand off or check back against during onboarding.

## What we're testing

Can you take a fuzzy, subjective problem, like "capture someone's brand," and turn it into a structured, usable web application?

We care about the result and your reasoning along the way, not which editor or tool you used. We expect clear coding standards, readable code, and a good end-to-end user experience.

## Phase 1: Capture & Blueprint

Build a page where a user can:

1. **Capture the brand direction** — a guided flow that surfaces things like visual style, color and typography direction, tone of voice, and brand personality.
2. **Turn answers into a Blueprint** — a clear, presentable output the team can hand off or reference. Think structured one-pager, not a raw dump of form answers.
3. **Watch it take shape** — the client (or the team member running the session) should get a live sense of the Blueprint forming as they go, not just a result at the end.
4. **Save and come back to it** — inputs and the resulting Blueprint should persist, so the session can be picked up again before onboarding and referenced during it.

The app must work on **mobile and desktop**.

## Phase 2: AI-Assisted Editing

Once the first draft exists, let the client (or team member) describe a change in plain language — "make the tone more playful," "swap the color direction to something warmer," "this doesn't sound like us, we're more minimal than bold" — and have the Blueprint update accordingly.

If we provide you with an OpenAI API key, put it in `.env.local`:

```bash
OPENAI_API_KEY=<provided-key>
```

> It goes in your environment config, never in a commit, and will be revoked once the assessment is over.

## The decisions are yours

This is intentionally open-ended. You decide how templates are defined, how components expose configuration, what components are needed, and how the editor looks and feels. We'd rather see a few elements done very well than many done poorly.

## What's provided

| Provided | Where |
|----------|-------|
| Next.js (App Router) + TypeScript | `src/app/` |
| Tailwind CSS v4 + shadcn/ui | `src/components/ui/`, `components.json` |
| Example builder component | `src/components/builder/` |
| SQLite + Drizzle ORM, wired and seeded | `src/db/`, `drizzle.config.ts` |
| Vitest + React Testing Library, example test | `src/components/builder/text-element.test.tsx` |
| Pre-commit hook (type-check, lint, related tests) | `.husky/pre-commit` |

### Database

Everything stays local — SQLite (`local.db`) with [Drizzle ORM](https://orm.drizzle.team), no external services. The client is ready to import from server code:

```ts
import { db } from "@/db"
import { pages } from "@/db/schema"

const allPages = db.select().from(pages).all()
```

| Command | What it does |
|---------|--------------|
| `npm run db:push` | Sync `src/db/schema.ts` to `local.db` (run after schema changes) |
| `npm run db:studio` | Open a browser GUI to inspect and edit the database |
| `npm run db:seed` | Insert the example page (skips if data already exists) |
| `npm run db:reset` | Delete the database, recreate it from the schema, and re-seed |

An example `pages` table is provided in `src/db/schema.ts` to show the pattern — extend or replace it freely. The data model is yours to design.

### Testing & pre-commit

Vitest with React Testing Library is set up, with an example test next to the example component. Test files are colocated as `*.test.tsx`.

```bash
npm test            # run once
npm run test:watch  # watch mode
```

Every commit runs a pre-commit hook (Husky): `tsc --noEmit`, then ESLint and any tests related to your staged files (lint-staged). If the hook fails, fix the issue — don't bypass it.

## How we evaluate

- **Speed to working software** — does the core loop (pick → edit → preview → save) work?
- **Decision quality** — sensible data model, component boundaries, editor architecture
- **UX polish** — immediate preview, mobile + desktop, full-screen toggle
- **Code clarity** — could another engineer pick this up tomorrow?

## Submitting

For the repo:

- Submit a PR with your changes.
- Include anything you want to call out that is not obvious in the PR description. This includes any information on your decisions, trade-offs, and what you'd do next if you had more time.

Questions? Reach out anytime. Otherwise, clone it and go.

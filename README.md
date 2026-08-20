# Page Builder Assessment

Welcome! This assessment asks you to build a small **website page builder** — think a stripped-down Squarespace. A user picks a template, tweaks the design, previews the result live, and saves their work.

We are testing your ability to **build quickly and well**. Use whatever AI tools, editors, and workflows make you fastest — Cursor, Copilot, Claude, ChatGPT, or none at all. There are no restrictions on tooling. We care about the result and the decisions you made along the way.

## Getting started

```bash
git clone <this-repo>
cd next_assesment
npm install
cp .env.example .env.local   # then paste your Supabase URL + secret key
# Run supabase/schema.sql once in the Supabase Dashboard SQL Editor
npm run db:seed              # seeds the default user + example page
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note on persistence:** the original brief called for a local SQLite database; this implementation deliberately uses a **hosted Supabase Postgres** project instead (decision made during development). Pages and the default user live in Supabase, accessed server-side only via the secret key. See `supabase/schema.sql` and `src/db/`.

### Docker (development)

Requires [Docker](https://docs.docker.com/get-docker/) and a `.env.local` file (same as the non-Docker workflow above).

```bash
npm run docker
```

This starts the app in the background, waits for it to respond, then opens [http://localhost:3000](http://localhost:3000) in your default browser. Logs stream in the terminal until you press Ctrl+C (containers keep running).

To start without opening browsers: `DOCKER_OPEN_BROWSER=0 npm run docker`

To run in the foreground without the browser helper: `npm run docker:up`

- Rebuild after dependency changes: `npm run docker`
- Stop: `docker compose down`

## What you're building

An interactive page builder where a user can:

1. **Choose one of three templates** — three distinct page layouts to start from.
2. **Adjust design elements** — each element on the page exposes configuration (e.g. text content, colors, alignment). What is configurable, and how it's exposed in the editor, is up to you.
3. **See changes immediately** — the preview updates live as the user edits.
4. **Toggle preview size** — support a partial (editor side-by-side) view and a full-screen preview of the page.
5. **Save their work** — selections persist to the local SQLite database and reload on revisit.

The app must work on **mobile and desktop**.

## Your decisions

This is intentionally open-ended. You will need to decide:

- **Templating** — how templates are defined, stored, and rendered.
- **Configuration** — how each element declares what is configurable, and how the editor exposes those controls.
- **Component model** — build the base components a page is composed of. An example `TextElement` component is provided in `src/components/builder/` as a rendering reference; the rest are yours to design.
- **Editor UX** — how editing, previewing, and saving fit together.

We'd rather see a small set of elements done well than many done poorly.

## AI editor

Add an **AI-assisted editing** feature: the user describes a change in natural language (e.g. "make the hero darker and the headline bigger") and the page configuration updates accordingly.

We will provide an OpenAI API key with your invite. Put it in `.env.local`:

```bash
OPENAI_API_KEY=<provided-key>
```

> The key is temporary and will be revoked after the assessment. Never commit it.

## What's provided

| Provided | Where |
|----------|-------|
| Next.js (App Router) + TypeScript | `src/app/` |
| Tailwind CSS v4 + shadcn/ui | `src/components/ui/`, `components.json` |
| Example builder component | `src/components/builder/` |
| Supabase Postgres data layer (supabase-js) | `src/db/`, `supabase/schema.sql` |
| Vitest + React Testing Library, example test | `src/components/builder/text-element.test.tsx` |
| Pre-commit hook (type-check, lint, related tests) | `.husky/pre-commit` |

### Database

Data lives in a hosted [Supabase](https://supabase.com) Postgres project (`users` + `pages` tables, schema in `supabase/schema.sql`). Access is server-side only, through typed query helpers:

```ts
import { listPages, getPage, createPage, updatePage } from "@/db"

const pages = await listPages()
```

RLS is enabled with no public policies; the server uses the secret key (in `.env.local`, never committed, never `NEXT_PUBLIC_`). There is no login — every page belongs to a default demo user.

| Command | What it does |
|---------|--------------|
| `npm run db:seed` | Insert the default user + example page (skips if data already exists) |

### Testing & pre-commit

Vitest with React Testing Library is set up, with an example test next to the example component. Test files are colocated as `*.test.tsx`.

```bash
npm test            # run once
npm run test:watch  # watch mode
```

Every commit runs a pre-commit hook (Husky): `tsc --noEmit`, then ESLint and any tests related to your staged files (lint-staged). If the hook fails, fix the issue — don't bypass it.

## What we evaluate

- **Speed to working software** — does the core loop (pick template → edit → preview → save) work?
- **Decision quality** — sensible data model, component boundaries, and editor architecture.
- **UX polish** — immediate preview, mobile + desktop, full-screen toggle.
- **Code clarity** — could another engineer pick this up tomorrow?

## Submitting

1. Push your work to a fork or a fresh repo and send us the link.
2. Include a short note (in the README or a `NOTES.md`) covering the decisions you made, trade-offs, and what you'd do next with more time.

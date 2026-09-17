<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Brand Blueprint Builder

A guided intake tool that captures a client's business context and brand expression (visual
style, color/typography direction, tone of voice, personality) and turns it into a persistent,
presentable one-page Brand Blueprint, with a Phase 2 AI-assisted editing pass on that Blueprint.

## Stack

- **Next.js 16 (App Router) + TypeScript** — `src/app/`. Use Server Components by default; client components only where interactivity requires it.
- **Tailwind CSS v4 + shadcn/ui** — UI primitives in `src/components/ui/` (shadcn-managed; add more with `npx shadcn@latest add <component>`, don't hand-edit unnecessarily). shadcn config in `components.json`.
- **SQLite + Drizzle ORM** — already wired up. See Database below.
- **Node 22** — pinned in `.nvmrc`. Next 16 will not run on Node < 20.9.

## Database (Drizzle + better-sqlite3)

The database is **already set up** — do not install Prisma or another ORM.

- Schema lives in `src/db/schema.ts` (plain TypeScript table definitions). Example `pages` table provided: `id`, `name`, `template`, JSON `config`, timestamps.
- Client: `import { db } from "@/db"` — **server-side only** (Server Components, Route Handlers, Server Actions). Never import in client components.
- The DB file is `local.db` at the repo root (gitignored).

If the user wants to see the studio you may create a terminal instance running `npm run db:studio` as long as you verify that https://local.drizzle.studio/ is not already up and running.

Commands:

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
  app/                 # routes (App Router)
  components/
    ui/                # shadcn primitives (Button, Card, Badge, Separator, ...)
    builder/           # page-builder elements; TextElement is the reference example
  db/
    schema.ts          # Drizzle table definitions — the source of truth for the data model
    index.ts           # shared db client
  lib/utils.ts         # cn() helper
scripts/               # seed.ts, reset.ts (run via tsx)
drizzle.config.ts      # drizzle-kit config (schema path, local.db)
```

## Conventions

- Builder elements follow the `TextElement` pattern (`src/components/builder/text-element.tsx`): a serializable config object in, rendered HTML out. Configs are plain JSON so they can be stored in the DB, edited in forms, and rewritten by AI.
- The `OPENAI_API_KEY` lives in `.env.local` (never committed). Read it server-side only.
- Verify changes with `npx tsc --noEmit`, `npm run lint`, and `npm test`.

## Testing & pre-commit

- **Vitest + React Testing Library** (jsdom). Test files are colocated: `*.test.tsx` next to the component. See `src/components/builder/text-element.test.tsx` for the pattern. Note: Vitest cannot test `async` Server Components — keep those covered by types or E2E.
- `npm test` runs once; `npm run test:watch` watches.
- **Husky pre-commit hook** (`.husky/pre-commit`) runs `tsc --noEmit`, then lint-staged (`eslint` + `vitest related` on staged files). Do not skip it with `--no-verify` — fix the failure instead.

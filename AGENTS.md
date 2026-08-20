<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Page Builder Assessment

## Stack

- **Next.js 16 (App Router) + TypeScript** — `src/app/`. Use Server Components by default; client components only where interactivity requires it.
- **Tailwind CSS v4 + shadcn/ui** — UI primitives in `src/components/ui/` (shadcn-managed; add more with `npx shadcn@latest add <component>`, don't hand-edit unnecessarily). shadcn config in `components.json`.
- **Supabase Postgres (hosted) via @supabase/supabase-js** — see Database below. Do not install Prisma or another ORM.
- **Node 22** — pinned in `.nvmrc`. Next 16 will not run on Node < 20.9.

## Database (Supabase Postgres + supabase-js)

The database is a **hosted Supabase project** accessed server-side only.

- Schema source of truth is `supabase/schema.sql` (`users` + `pages` tables). Apply changes by running it in the Supabase Dashboard SQL Editor — it is idempotent.
- RLS is enabled on both tables with **no policies** (deny-all to anon/authenticated). All access goes through the server client built with the secret key, which bypasses RLS.
- Client: `import { listPages, getPage, createPage, updatePage } from "@/db"` — **server-side only** (the module is guarded by `server-only`). Never import in client components. Scripts import `src/db/client.ts` directly.
- Env vars in `.env.local` (copy `.env.example`): `SUPABASE_URL`, `SUPABASE_SECRET_KEY`. Both are server-only secrets — never use a `NEXT_PUBLIC_` prefix.
- There is no auth: all pages belong to a default user (`demo@salon.local`), upserted on demand by `getDefaultUser()`.

Commands:

| Command | Use when |
|---------|----------|
| `npm run db:seed` | Insert the default user + example page (idempotent; also a connectivity smoke test) |

If queries fail with "relation does not exist", run `supabase/schema.sql` in the SQL Editor.

## File map

```
src/
  app/                 # routes (App Router): / list, /builder/new, /builder/[id], /preview/[id]
    actions.ts         # Server Actions (createPageAction, savePageAction)
  components/
    ui/                # shadcn primitives (Button, Card, Badge, Separator, ...)
    builder/           # page-builder elements; TextElement is the reference example
                       # types.ts (ElementConfig union), element-renderer.tsx (PageRenderer)
    editor/            # client editor: editor.tsx, inspector, element-forms, fields, toolbar
  db/
    client.ts          # lazy supabase-js client (secret key; usable from scripts)
    queries.ts         # typed data layer (listPages, getPage, createPage, updatePage)
    types.ts           # hand-written row types (User, Page)
    index.ts           # server-only entry point — import "@/db" from app code
  lib/
    utils.ts           # cn() helper
    templates.ts       # the three salon template presets
scripts/seed.ts        # idempotent seed (run via tsx)
supabase/schema.sql    # table definitions + RLS — the source of truth for the data model
```

## Conventions

- Builder elements follow the `TextElement` pattern (`src/components/builder/text-element.tsx`): a serializable config object in, rendered HTML out. Configs are plain JSON so they can be stored in the DB, edited in forms, and rewritten by AI.
- The `OPENAI_API_KEY` lives in `.env.local` (never committed). Read it server-side only.
- Verify changes with `npx tsc --noEmit`, `npm run lint`, and `npm test`.

## Testing & pre-commit

- **Vitest + React Testing Library** (jsdom). Test files are colocated: `*.test.tsx` next to the component. See `src/components/builder/text-element.test.tsx` for the pattern. Note: Vitest cannot test `async` Server Components — keep those covered by types or E2E.
- `npm test` runs once; `npm run test:watch` watches.
- **Husky pre-commit hook** (`.husky/pre-commit`) runs `tsc --noEmit`, then lint-staged (`eslint` + `vitest related` on staged files). Do not skip it with `--no-verify` — fix the failure instead.

-- Page Builder schema. Run once in the Supabase Dashboard SQL Editor
-- (https://supabase.com/dashboard/project/_/sql). Idempotent.

create table if not exists public.users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.pages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  name       text not null,
  template   text not null,
  config     jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  -- updated_at is set by the app on every update (single write path, no trigger needed)
  updated_at timestamptz not null default now()
);

create index if not exists pages_user_id_idx on public.pages (user_id);

-- RLS enabled with no policies: deny-all for anon/authenticated roles.
-- The app accesses these tables server-side with the secret key, which bypasses RLS.
alter table public.users enable row level security;
alter table public.pages enable row level security;

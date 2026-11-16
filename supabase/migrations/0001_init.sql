-- BGS FAQ Callcenter — production schema (DATA_BACKEND=supabase)
-- Built-in topics live in the app bundle; this table stores only overrides,
-- hidden flags and custom topics (Constitution VI: originals are never deleted).

create table if not exists public.topics (
  id          text primary key check (char_length(id) between 1 and 100),
  origin      text not null check (origin in ('base', 'custom')),
  content     jsonb,                       -- null = no override (base only)
  hidden      boolean not null default false,
  version     integer not null check (version >= 1),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  text not null,
  constraint custom_topics_have_content check (origin = 'base' or content is not null)
);

comment on table public.topics is 'Admin overrides of built-in topics and custom topics. Optimistic concurrency via version.';

-- Admin accounts verified by the app (scrypt hashes). Never exposed to anon/authenticated roles.
create table if not exists public.admin_users (
  id             text primary key,
  email          text not null unique check (email = lower(email)),
  display_name   text not null check (char_length(display_name) between 1 and 80),
  role           text not null check (role in ('owner', 'editor')),
  password_hash  text not null check (password_hash like 'scrypt$%'),
  created_at     timestamptz not null default now()
);

-- Row Level Security: the app uses the service-role key server-side.
-- Public (anon) clients may read topics but never write; admin_users is never readable.
alter table public.topics enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "topics are publicly readable" on public.topics;
create policy "topics are publicly readable"
  on public.topics for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policies: only the service role (which bypasses RLS) can write.
-- No policies on admin_users: only the service role can read it.

revoke all on public.admin_users from anon, authenticated;

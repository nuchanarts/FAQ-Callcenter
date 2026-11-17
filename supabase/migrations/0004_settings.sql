-- Editable app settings stored as versioned JSON documents (e.g. key 'taxonomy':
-- categories + levels managed at /admin/taxonomy). Server-side only (service role).
create table if not exists public.app_settings (
  key         text primary key check (char_length(key) between 1 and 60),
  value       jsonb not null,
  version     integer not null check (version >= 1),
  updated_at  timestamptz not null default now()
);

alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;

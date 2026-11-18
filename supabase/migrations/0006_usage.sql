-- Daily usage counters (topic views, reports, helpful votes, site visits). No personal data.
-- Server-side only (service role), like every other table.
create table if not exists public.usage_daily (
  day       date not null,
  kind      text not null check (kind in ('view', 'report', 'visit', 'helpful', 'unhelpful')),
  topic_id  text not null default '' check (char_length(topic_id) <= 100),
  count     integer not null default 0 check (count >= 0),
  primary key (day, kind, topic_id)
);

alter table public.usage_daily enable row level security;
revoke all on public.usage_daily from anon, authenticated;

-- +1 for one counter, atomically (insert the row on first use).
create or replace function public.increment_usage(p_day date, p_kind text, p_topic_id text)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.usage_daily (day, kind, topic_id, count)
  values (p_day, p_kind, coalesce(p_topic_id, ''), 1)
  on conflict (day, kind, topic_id) do update set count = public.usage_daily.count + 1;
$$;

revoke all on function public.increment_usage(date, text, text) from public, anon, authenticated;

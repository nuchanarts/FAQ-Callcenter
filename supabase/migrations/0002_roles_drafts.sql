-- 3-level roles (owner / approver / author), draft approval, disabling accounts.

-- Drafts: an author's pending/rejected change, stored as one JSON object
-- {content, by, at, status: 'pending'|'rejected', note}. Viewers only ever see `content`.
alter table public.topics add column if not exists draft jsonb;

alter table public.topics drop constraint if exists custom_topics_have_content;
alter table public.topics add constraint custom_topics_have_content
  check (origin = 'base' or content is not null or draft is not null);

-- Roles: 'editor' is the legacy name of 'approver' (still accepted by the app).
alter table public.admin_users drop constraint if exists admin_users_role_check;
alter table public.admin_users add constraint admin_users_role_check
  check (role in ('owner', 'approver', 'author', 'editor'));

alter table public.admin_users add column if not exists active boolean not null default true;

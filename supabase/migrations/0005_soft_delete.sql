-- Built-in topics can be deleted by approvers; they are kept (deleted = true) so they can be restored.
alter table public.topics add column if not exists deleted boolean not null default false;

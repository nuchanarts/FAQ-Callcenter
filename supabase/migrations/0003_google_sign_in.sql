-- Staff sign in with Google (verified Gmail on the admin list); passwords are no longer stored.
-- Existing scrypt hashes stay valid for local/E2E password login only.
alter table public.admin_users drop constraint if exists admin_users_password_hash_check;
alter table public.admin_users add constraint admin_users_password_hash_check
  check (password_hash = '' or password_hash like 'scrypt$%');

-- ──────────────────────────────────────────────────────────────────────────
-- Switch from Supabase Auth (magic-link) to shared-password identity.
--
-- The app is now an honor-system internal pool:
--   • One shared password (VITE_APP_PASSWORD) gates entry — checked client-side.
--   • Players type a free-text name; the name is the identity.
--   • profiles.user_id stays a UUID, but is now generated client-side at
--     first login instead of mirroring an auth.users row. display_name is
--     the unique natural key for re-finding a player on subsequent visits.
--   • RLS is disabled — the password is the security boundary, not the DB.
--
-- After running this:
--   • Existing auth.users rows become orphans (harmless; clean up in dashboard if desired).
--   • The on_auth_user_created trigger no longer fires (we manage profiles client-side).
--   • Anyone with the anon key can read/write any row in public schema.
--     That's fine for an internal pool with a shared-password gate.
-- ──────────────────────────────────────────────────────────────────────────

-- Drop the FKs to auth.users so profiles + predictions can live without one.
alter table profiles    drop constraint if exists profiles_user_id_fkey;
alter table predictions drop constraint if exists predictions_user_id_fkey;

-- Stop auto-creating profiles when an auth.users row is inserted; we now
-- own that flow client-side via supabase.from('profiles').insert(...).
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- display_name becomes the natural lookup key. Prevent duplicate names so
-- two players can't end up sharing a slot.
do $$ begin
  alter table profiles add constraint profiles_display_name_unique unique (display_name);
exception when duplicate_object then null; end $$;

-- Turn RLS off everywhere. The password is the gate now.
alter table profiles      disable row level security;
alter table predictions   disable row level security;
alter table matches       disable row level security;
alter table scoring_rules disable row level security;
alter table teams         disable row level security;
alter table venues        disable row level security;
alter table cron_logs     disable row level security;

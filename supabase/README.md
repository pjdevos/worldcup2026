# Supabase setup

## Apply the schema (one-time)

### Option A — Dashboard (no tooling)

1. Open the project at https://supabase.com/dashboard/project/kgcbgatxctfbsgkzrfea.
2. Navigate to **SQL Editor → New query**.
3. Paste the entire contents of [`migrations/0001_init.sql`](migrations/0001_init.sql) and run.
4. Paste the entire contents of [`seed/seed.sql`](seed/seed.sql) and run.
5. Promote yourself to admin (one-time, after first login via magic-link):
   ```sql
   update profiles set is_admin = true
   where user_id = (select id from auth.users where email = 'pjdevos@gmail.com');
   ```

### Option B — Supabase CLI

```bash
pnpm dlx supabase@latest link --project-ref kgcbgatxctfbsgkzrfea
pnpm dlx supabase@latest db push
# Then paste seed/seed.sql via the dashboard, or run via supabase db execute
```

## Re-generate the seed

After editing [`apps/web/src/data/wk.ts`](../apps/web/src/data/wk.ts), regenerate:

```bash
pnpm seed:gen
```

This rewrites `seed/seed.sql` from the typed source-of-truth. The seed is
idempotent (`on conflict ... do update`), so re-running it after the official
FIFA times come in won't break anything.

## Auth configuration (dashboard, one-time)

In **Authentication → Providers → Email**:

- Enable **magic link** (default on).
- Disable signup with passwords (no UI for it, but harmless to leave on).

In **Authentication → URL Configuration**:

- Site URL: `https://<your-vercel-domain>` once deployed.
- Additional redirect URLs: `http://localhost:5173/auth/callback`.

In **Authentication → Email Templates → Magic Link**:

- Adjust the email copy to "FARI WK 2026 Pronostiek" branding.

In **Authentication → Settings**:

- (Optional MVP+) Set **Allowed email domains** to `fari.brussels,ulb.be,vub.be`.
  If this setting isn't surfaced in your project, leave open and rely on the
  social trust of magic-link links being shared internally.

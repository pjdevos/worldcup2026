# FARI WK 2026 Pronostiek

Internal prediction game for FARI colleagues during the 2026 FIFA World Cup
(11 June → 19 July 2026). Magic-link login, group-stage score predictions,
optional bracket picks, server-side scoring, live leaderboard.

The product spec lives at [handoff/README.md](handoff/README.md). The HTML/JSX
files in `handoff/` are the **visual reference** — not running code, not to
edit. The schedule data in [handoff/data.js](handoff/data.js) has been ported
once to [apps/web/src/data/wk.ts](apps/web/src/data/wk.ts), which is now the
single source of truth for fixtures, teams, and venues.

## Stack

- **Frontend:** Vite + React 18 + TypeScript, react-router v6, TanStack Query,
  Tailwind (for new screens) + the prototype's [`layout.css`](apps/web/src/styles/layout.css)
  copied wholesale (for fidelity).
- **Backend:** Supabase Postgres + Auth (magic-link), RLS, Postgres scoring fn.
  Project ref: `kgcbgatxctfbsgkzrfea`.
- **Auto-results:** Vercel cron → `apps/web/api/cron/fetch-results.ts` polls
  football-data.org every 15 min; on `FINISHED`, updates the match + calls
  `score_match` via RPC. (Not yet wired — see Open work.)
- **Hosting:** Vercel (frontend + serverless cron) + Supabase Cloud.
- **Package manager:** pnpm workspace, root [`pnpm-workspace.yaml`](pnpm-workspace.yaml).

## Layout

```
pronostiek/
├── apps/web/             # the Vite app
│   ├── api/cron/         # Vercel serverless functions (cron)  ← not yet
│   ├── src/
│   │   ├── components/   # AppNav, MatchRow, GroupCard, …
│   │   ├── data/wk.ts    # the schedule single-source-of-truth
│   │   ├── lib/          # supabase, queries, auth, format, matchHelpers
│   │   ├── routes/       # one file per route
│   │   └── styles/       # index.css (Tailwind + import) + layout.css (lifted)
│   ├── public/           # fari-logo*.png
│   └── .env.local        # gitignored: VITE_SUPABASE_* + FOOTBALL_DATA_API_KEY
├── supabase/
│   ├── migrations/       # 0001_init.sql, 0002_scoring.sql
│   ├── seed/             # generate.ts (typed) → seed.sql
│   └── README.md         # how to apply
└── handoff/              # READ-ONLY reference — do not edit
```

## Run / build

```bash
pnpm dev          # starts Vite on http://localhost:5173 (IPv6: ::1)
pnpm build        # tsc -b && vite build
pnpm typecheck    # tsc --noEmit across the workspace
pnpm seed:gen     # regenerate supabase/seed/seed.sql from wk.ts
```

## DB workflow

The Supabase project is hosted; there is no local Postgres. Apply migrations
via the dashboard SQL editor (Settings → SQL Editor) in order:

1. `supabase/migrations/0001_init.sql` — schema, RLS, triggers, leaderboard view
2. `supabase/migrations/0002_scoring.sql` — `score_match` Postgres function
3. `supabase/seed/seed.sql` — 48 teams, 16 venues, 104 fixtures (idempotent)

After first login, promote the product owner to admin:

```sql
update profiles set is_admin = true
where user_id = (select id from auth.users where email = 'pjdevos@gmail.com');
```

## Conventions

- **Supabase client is untyped.** The `Database` generic from supabase-js
  fought us; instead, the client in [`lib/supabase.ts`](apps/web/src/lib/supabase.ts)
  is plain `createClient(...)` and every call goes through a typed wrapper in
  [`lib/queries.ts`](apps/web/src/lib/queries.ts). New queries should follow
  this pattern: the wrapper returns the matching `Db*` interface from
  [`lib/database.types.ts`](apps/web/src/lib/database.types.ts).
- **Prediction privacy is enforced at the DB.** RLS on `predictions`:
  `select` policy gives back the row only if `user_id = auth.uid()` OR the
  match has kicked off. The UI doesn't need to enforce this — querying as
  another user just returns nothing pre-kickoff.
- **Lock is also at the DB.** `insert`/`update` policies on `predictions`
  require `match.kick_at > now() + interval '5 minutes'`. The UI shows the
  lock state for UX but cannot bypass the server check.
- **Match IDs are stable.** Group stage = positional `idx+1` in
  `GROUP_STAGE` array (1–72). Knockouts use `.n` (73–104). The seed
  generator and all UI use the same convention; never renumber.
- **Kickoff times in `wk.ts` are illustrative Brussels-CEST.** They're
  converted to UTC in `seed.sql` (CEST = UTC+2 in June/July). Before launch,
  overwrite `matches.kick_at` with the official FIFA times.
- **Don't edit `handoff/`.** It's the visual reference for "what should the
  thing look like." Copy-changes go in `apps/web/src/`.

## Reusable patterns

- [`components/MatchRow.tsx`](apps/web/src/components/MatchRow.tsx) — the
  match-row used in the calendar; wraps in `<Link>` when `match.id` is set.
- [`components/GroupCard.tsx`](apps/web/src/components/GroupCard.tsx) — the
  white card used for each of the 12 poules.
- [`lib/matchHelpers.ts`](apps/web/src/lib/matchHelpers.ts) — `isLocked`,
  `formatKickoff`, `resolveSide` (handles team-code → name with placeholder
  fallback for unresolved knockout slots).
- [`lib/format.ts`](apps/web/src/lib/format.ts) — Dutch date formatters
  + `parsePlaceholder` for bracket slot labels (`'2A'` → `"Tweede Groep A"`).

## Open work (matching plan in `~/.claude/plans/`)

1. Football-data.org cron — `apps/web/api/cron/fetch-results.ts` + `vercel.json`
   (every 15 min, `*/15 * * * *`).
2. External-ID mapping script — `scripts/map-external-ids.ts` (run once after
   FIFA times import to populate `matches.external_id`).
3. Admin status panel — last cron run, matches auto-updated today,
   "Fetch now" button (proxy route at `apps/web/api/admin/fetch-now.ts`).
4. Vercel deploy + env vars (`VITE_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`,
   `FOOTBALL_DATA_API_KEY`, `CRON_SECRET`).
5. Post-MVP: `/predict/bracket` (lands after group stage, 27 June), `/match/:id`
   public histogram, top-scorer/dark-horse picks, GDPR delete.

## Constraints worth remembering

- **Tight timeline.** Today is 2026-05-15 (per session context); kickoff
  is 2026-06-11. ~27 days. Don't gold-plate; ship the MVP loop end-to-end
  before adding features.
- **Small audience.** Only FARI colleagues — auth domain allowlist
  (`@fari.brussels`, `@ulb.be`, `@vub.be`) is configured in the Supabase
  dashboard, not in code.
- **Picks hidden until kickoff.** Don't surface other users' predictions on
  any screen before `match.kick_at`. The DB enforces this; UI assumes it.

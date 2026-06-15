# FARI World Cup 2026 Predictions

Internal prediction pool for FARI colleagues during the 2026 FIFA World Cup
(11 June → 19 July 2026). **Shared-password login** (honor-system, no real
auth), group-stage score predictions, tournament-wide tiebreaker + top-scorer
pick, daily auto-fetched results, live leaderboard.

The product spec lives at [handoff/README.md](handoff/README.md). The HTML/JSX
files in `handoff/` are the **visual reference** — not running code, not to
edit. The schedule data in `handoff/data.js` has been ported once to
[apps/web/src/data/wk.ts](apps/web/src/data/wk.ts), which is now the single
source of truth for fixtures, teams, and venues.

Live at **[worldcup2026-web.vercel.app](https://worldcup2026-web.vercel.app)**.

## Stack

- **Frontend:** Vite + React 18 + TypeScript, react-router v6, TanStack Query,
  Tailwind (for new screens) + the prototype's [`layout.css`](apps/web/src/styles/layout.css)
  copied wholesale (for fidelity). UI is in English.
- **Auth:** **Shared-password identity (no Supabase Auth)**. The user types
  a name + the pool password (`VITE_APP_PASSWORD`); the password is checked
  client-side; the name is stored in `localStorage` together with a stable
  UUID. The UUID is generated client-side on first sight of a name and
  persisted in `profiles.display_name` (unique). See [lib/identity.tsx](apps/web/src/lib/identity.tsx).
- **Backend / DB:** Supabase Postgres only — **RLS is disabled across all
  tables**, the password is the security boundary. Project ref:
  `kgcbgatxctfbsgkzrfea`.
- **Server-side scoring:** Postgres function `score_match(p_match_id)` in
  migration 0002, called from the cron and the admin "Score & compute" button.
- **Auto-results:** Vercel cron → [`apps/web/api/cron/fetch-results.ts`](apps/web/api/cron/fetch-results.ts)
  polls football-data.org **daily at 12:00 UTC** (Hobby-plan compatible —
  `0 12 * * *` in [vercel.json](apps/web/vercel.json)); on `FINISHED` matches,
  upserts the result and triggers `score_match` via RPC.
- **Hosting:** Vercel (frontend + serverless cron, project `worldcup2026-web`)
  + Supabase Cloud.
- **Package manager:** pnpm workspace, root [`pnpm-workspace.yaml`](pnpm-workspace.yaml).

## Layout

```
pronostiek/
├── apps/web/             # the Vite app
│   ├── api/
│   │   ├── _lib/         # shared serverless helpers (fetch-results logic)
│   │   └── cron/         # Vercel cron functions
│   ├── src/
│   │   ├── components/   # AppNav, MatchRow, GroupCard, TournamentPicks, …
│   │   ├── data/         # wk.ts (schedule SoT) + topScorers.ts (17 names)
│   │   ├── lib/          # supabase, queries, identity, format, matchHelpers
│   │   ├── routes/       # HomePage, SchedulePage, LoginPage, PredictPage,
│   │   │                 #  ProfilePage, LeaderboardPage, AdminPage
│   │   └── styles/       # index.css + layout.css (lifted)
│   ├── public/           # fari-logo*.png, logo-voetbal.png, fari-world-cup-2026.png
│   ├── vercel.json       # cron schedule (daily)
│   └── .env.local        # gitignored: VITE_SUPABASE_*, VITE_APP_PASSWORD, FOOTBALL_DATA_API_KEY
├── supabase/
│   ├── migrations/       # 0001 init, 0002 scoring, 0003 tournament picks,
│   │                     #  0004 bonus_points, 0005 password_login
│   ├── seed/             # generate.ts (typed) → seed.sql (48 teams, 16 venues, 104 fixtures)
│   └── README.md         # how to apply
└── handoff/              # READ-ONLY reference — do not edit
```

## Run / build

```bash
pnpm dev          # Vite dev server on http://127.0.0.1:5173 (IPv4 forced in vite.config.ts)
pnpm build        # tsc -b && vite build (also runs API tsconfig check)
pnpm typecheck    # tsc --noEmit src + api
pnpm seed:gen     # regenerate supabase/seed/seed.sql from wk.ts
```

Production deploy via Vercel auto-deploy from `main` (or `pnpm dlx vercel@latest --prod`).

## DB workflow

The Supabase project is hosted; there is no local Postgres. Apply migrations
via the dashboard SQL editor in numbered order:

1. `supabase/migrations/0001_init.sql` — schema, RLS (later disabled), triggers, leaderboard view
2. `supabase/migrations/0002_scoring.sql` — `score_match(p_match_id)` Postgres function
3. `supabase/migrations/0003_tournament_picks.sql` — adds `profiles.tiebreaker_bel_goals` + `profiles.top_scorer`
4. `supabase/migrations/0004_bonus_points.sql` — adds `profiles.bonus_points` + rebuilds `leaderboard` view (incl. match_points / bonus_points / tiebreaker columns)
5. `supabase/migrations/0005_password_login.sql` — drops FKs to `auth.users`, adds unique `display_name`, disables RLS everywhere
6. `supabase/seed/seed.sql` — idempotent seed of teams + venues + matches (English team names)

After applying 0005, promote yourself to admin by **display_name** (no more auth.users):

```sql
update profiles set is_admin = true where display_name = 'Pieter-Jan';
```

## Env vars

Client (`VITE_*` — baked into the bundle at build time):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_PASSWORD` — the shared pool password

Server-only (no `VITE_` prefix — Vercel functions only):
- `SUPABASE_SERVICE_ROLE_KEY` — cron uses this to bypass RLS-disabled writes
- `FOOTBALL_DATA_API_KEY`
- `CRON_SECRET` — Vercel cron auth header

## Conventions

- **Supabase client is untyped.** The `Database` generic from supabase-js
  fought us; the client in [`lib/supabase.ts`](apps/web/src/lib/supabase.ts)
  is plain `createClient(...)` and every call goes through a typed wrapper in
  [`lib/queries.ts`](apps/web/src/lib/queries.ts). New queries follow this
  pattern: wrapper returns the matching `Db*` interface from
  [`lib/database.types.ts`](apps/web/src/lib/database.types.ts).
- **Identity model.** [`useIdentity()`](apps/web/src/lib/identity.tsx) returns
  `{ name, userId } | null` from localStorage. `useProfile()` (same file)
  fetches the matching `profiles` row (includes `is_admin`, `bonus_points`,
  `tiebreaker_bel_goals`, `top_scorer`). Login is in `IdentityProvider.login`;
  it upserts a profile by `display_name` and assigns a fresh `crypto.randomUUID()`
  on first sight.
- **No DB-side privacy / locks.** RLS is off — the password is the gate.
  The UI shows the kickoff-5min lock state but the DB no longer enforces it.
  Acceptable for an honor-system internal pool.
- **Match IDs are stable.** Group stage = positional `idx+1` in
  `GROUP_STAGE` array (1–72). Knockouts use `.n` (73–104). The seed generator
  and all UI use the same convention; never renumber.
- **Kickoff times in `wk.ts` are illustrative Brussels-CEST.** They're
  converted to UTC in `seed.sql` (CEST = UTC+2 in June/July). Before launch,
  overwrite `matches.kick_at` with the official FIFA times.
- **Don't edit `handoff/`.** It's the visual reference for "what should the
  thing look like." Copy-changes go in `apps/web/src/`.

## Reusable patterns

- [`components/MatchRow.tsx`](apps/web/src/components/MatchRow.tsx) — the
  match-row used in the calendar; inline +/- score steppers, gold "predicted
  winner" dot. Saves via debounced upsert when given an `onSave` prop.
- [`components/GroupCard.tsx`](apps/web/src/components/GroupCard.tsx) — the
  white card used for each of the 12 groups.
- [`components/TournamentPicks.tsx`](apps/web/src/components/TournamentPicks.tsx) —
  Belgium-goals tiebreaker + top-scorer dropdown (with "Someone else…" free-text).
  Locks at 11 Jun 21:00 Brussels (`TOURNAMENT_LOCK` in `data/topScorers.ts`).
- [`lib/matchHelpers.ts`](apps/web/src/lib/matchHelpers.ts) — `isLocked`,
  `formatKickoff` (en-GB locale, Brussels TZ), `resolveSide`.
- [`lib/format.ts`](apps/web/src/lib/format.ts) — English date formatters
  + `parsePlaceholder` for bracket slot labels (`'2A'` → `"Runner-up Group A"`).

## Awarding the top-scorer bonus (end of tournament)

The cron only scores matches. The top-scorer bonus is a one-off SQL the
admin runs after the final whistle:

```sql
-- Worth 25 points; adjust depending on the actual winner.
update profiles
set bonus_points = bonus_points + 25
where lower(trim(top_scorer)) = lower('Erling Haaland');

-- For free-text "Someone else…" picks, fuzzy-match:
-- where lower(trim(top_scorer)) like '%haaland%';
```

The `leaderboard` view automatically includes `bonus_points` in the
ordered total.

## Open work

1. **Tiebreaker UI on the leaderboard** — after Belgium's last match, sort
   by `|tiebreaker − actualBelGoals|` to break ties. Currently the column
   `tiebreaker` exists in the view but isn't used for ordering.
2. **`/predict/bracket`** — knockout-bracket prediction screen, lands after
   group stage (after 27 June). The existing read-only `BracketView` shows
   the structure; needs editable winner-pick per tie + final-score for the Final.
3. **`/match/:id` public histogram** — distribution of predictions per match,
   "who picked closest". Mentioned in the spec; not yet built.
4. **External-ID mapping script** — `scripts/map-external-ids.ts` once FIFA
   times import is done, to populate `matches.external_id` for the cron.
5. **Official FIFA times import** — `scripts/import-official-times.ts` to
   overwrite illustrative kickoff times before tournament starts.

## Recent history (for context across sessions)

- **2026-05-15:** Scaffold + initial deploy. Magic-link auth.
- **2026-05-16:** Translated UI to English; redesigned homepage with the
  `fari-world-cup-2026.png` trophy hero; replaced `fari-logo-white.png` with
  `logo-voetbal.png` in the Schedule header.
- **2026-05-16:** Added tournament-wide picks (tiebreaker + top scorer) on
  the Calendar tab and `bonus_points` column on the leaderboard.
- **2026-05-16:** Vercel cron throttled to daily (`0 12 * * *`) — Hobby plan
  rejects hourly. "Fetch now" admin button removed (used Supabase JWT).
- **2026-05-16:** Replaced magic-link auth with shared-password (`VITE_APP_PASSWORD`).
  RLS disabled; profile keyed by display_name; auth.users no longer used.
- **2026-06-15:** Fixed the cron that left the leaderboard never updating —
  it had **never run successfully** since launch. Debugged through a chain of
  causes: (1) handler had `runtime: "nodejs"` but a Fetch-style signature
  (`Request`/`Response`, `req.headers.get()`) → `FUNCTION_INVOCATION_FAILED`;
  (2) switching to `runtime: "edge"` crashed in `createClient()` because
  `supabase-js` (realtime/ws) isn't Edge-safe; (3) back on Node, the
  extension-less import `../_lib/fetch-results` threw `ERR_MODULE_NOT_FOUND`
  (Vercel compiles each api file to native ESM and does **not** bundle, so
  relative imports need an explicit `.js`); (4) finally, `SUPABASE_SERVICE_ROLE_KEY`
  wasn't reaching the function runtime. Net result: handler is Node-style
  `(req, res)` (`node:http` types), loads the supabase logic via
  `await import("../_lib/fetch-results.js")` inside a try/catch that
  `console.error`s the real stack to Runtime Logs. First good run pulled 7/11
  finished matches; the rest were filled manually (API hadn't marked them
  FINISHED yet — the daily run picks up stragglers automatically).

## Constraints worth remembering

- **Tight timeline.** Kickoff is **11 June 2026**. Don't gold-plate; ship.
- **Small audience.** FARI colleagues with the shared password. Honor-system
  trust model — anyone with the password can claim any name, but that's a
  social problem, not a technical one to solve.
- **Cron must run on the Node.js runtime, never Edge.** `runFetchResults`
  builds a `@supabase/supabase-js` client, whose realtime/ws dependency is not
  Edge-safe and crashes `createClient()` at runtime (500, "no outgoing
  requests"). Keep [`api/cron/fetch-results.ts`](apps/web/api/cron/fetch-results.ts)
  Node-style (`(req, res)`, no `config.runtime` export). Don't reintroduce a
  Fetch-style `Request`/`Response` handler — on the Node runtime `req.headers`
  has no `.get()` and the function throws before doing anything.
- **Serverless `api/` files are native ESM and NOT bundled by Vercel.**
  Relative imports between api files MUST carry an explicit `.js` extension
  (e.g. `import("../_lib/fetch-results.js")`), even though the source is `.ts`
  — otherwise `ERR_MODULE_NOT_FOUND` at runtime. `moduleResolution: bundler`
  maps `.js` back to the `.ts` source at typecheck, so it still type-checks.
- **The cron needs `SUPABASE_SERVICE_ROLE_KEY` in Vercel (Production scope).**
  `VITE_`-prefixed vars do reach functions at runtime (the URL falls back to
  `VITE_SUPABASE_URL`), but the service-role key has no `VITE_` twin. Env-var
  changes only apply to **new** deployments — redeploy after editing them.
- **Vercel Hobby plan.** Cron limited to daily. If hourly cadence becomes
  important during the tournament, either upgrade to Pro or use cron-job.org
  to ping `/api/cron/fetch-results` externally with the `CRON_SECRET` header.
- **`.env.local` was once committed (commit `d9c788b`)** with
  `VITE_APP_PASSWORD=FARI.brussels` — it's now untracked + gitignored, but
  the value is still in git history. Rotate the password if this matters.
</content>
</invoke>
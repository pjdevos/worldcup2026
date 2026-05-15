# Handoff — WK 2026 Prediction Game (FARI)

A FARI-internal **prediction game** to play with colleagues during the 2026 FIFA
World Cup. Players predict match outcomes, scores, and the knock-out bracket;
points accumulate over the tournament; a leaderboard shows who's winning.

This document is the spec. The bundled HTML files are **design references** —
hi-fi prototypes showing the intended look, feel, and FARI brand language. Your
job is to **recreate them in a production codebase** (a real React + DB app,
not the inline prototype), keeping the visual fidelity but using your stack's
conventions (proper routing, auth, persistence, API layer).

If no codebase exists yet, choose a sensible stack — recommendation below.

---

## Fidelity

**High-fidelity.** Colors, type, spacing, the diagonal mint-ray background,
and the FARI logo lockup are all final and should be matched pixel-close. The
schedule UI in `Speelschema WK 2026.html` is the visual reference for cards,
match rows, group panels, and the knockout bracket — re-use those patterns in
the prediction game's screens.

---

## Recommended stack

If you're starting from scratch:

- **Frontend**: React + Vite + TypeScript, react-router, Tailwind (with the
  FARI tokens below dropped into `tailwind.config.js`), TanStack Query for
  data fetching.
- **Backend**: Supabase or Neon + a thin Node/Hono API. Postgres for matches,
  predictions, scores, users. Supabase Auth (magic-link email) keeps it simple
  for colleagues — no password resets to support.
- **Hosting**: Vercel (frontend) + the chosen DB.
- **Dev locally**: `pnpm dev` for both.

The schedule data is in `data.js` — port it to a Postgres seed once and stop
hand-maintaining JS.

---

## Product scope

### 1. Auth & profile
- Magic-link login (email). On first login, ask for a display name and a
  team-name (optional, for the leaderboard flavour: "Beleidsteam", "AI Lab", …).
- Profile page: change display name, see your own pick history.

### 2. The schedule
The 104 matches of the tournament, grouped by stage. Reuse the schedule
prototype's three views verbatim:
- **Poules** — 12 group cards, 4 teams each.
- **Speelkalender** — day-by-day list, sticky left-rail with all 34 match days.
- **Knock-out** — 5-column bracket (R32 → Final + 3rd-place).

The underlying data (`data.js`) is final: groups, fixtures, dates, kickoff
times (Brussels CEST), venues, and the bracket pairing rules (e.g. R32
match 73 = `2A vs 2B`).

### 3. Predicting

#### 3a. Group-stage predictions
For every group match, a player predicts:
- **Final score** (e.g. 2–1) — exact prediction.

Optional secondary picks (toggle in admin settings):
- **First goalscorer** — pick from the two teams' squads.
- **Cards** — over/under N yellow cards.

Predictions can be edited up to **kickoff time minus 5 minutes**. After
kickoff, the pick is locked — show a small lock icon and the player's chosen
score, even if they never filled one in (treated as 0–0 + 0 points).

#### 3b. Knockout bracket
A separate "Bracket" screen, opened on **27 June 23:59 CEST** (after the last
group match). Players fill in:
- All 16 R32 matchups (the third-place seeding is fixed once group stage ends —
  use the published Annex C table baked into `data.js`).
- All 8 R16 → QF → SF → Final winners, plus the final score of the Final.
- Optional: top scorer of the tournament, dark-horse pick.

The bracket locks at the R32 kickoff (28 June 21:00 CEST).

### 4. Scoring rules
Defaults (admin-tunable in settings):
- **Group match correct winner / draw** — 3 points
- **Group match exact score** — 5 points (replaces winner points, not stacked)
- **R32 winner correct** — 5 points
- **R16 winner correct** — 8 points
- **QF winner correct** — 12 points
- **SF winner correct** — 20 points
- **Final winner correct** — 30 points
- **Exact final score** — +15 bonus points
- **Top scorer correct** — 25 points
- **Dark horse (any team you picked reaching SF)** — 25 points

Scoring runs server-side after each match's result is entered (manual entry by
an admin is fine — 104 matches over 5 weeks; no need to scrape FIFA).

### 5. Leaderboard
- Main leaderboard: rank, name, team, points, last-round-delta arrow.
- Group leaderboard: per-team (if team-names are used) standings.
- Match leaderboard: per-match, who got the closest prediction. Surfaces fun
  moments without needing a "social feed".
- Round-by-round: filter the main leaderboard by stage to see who was strong
  in groups vs knockout.

### 6. Match-result page
Public page (no auth) per match showing:
- The fixture (teams, kickoff in Brussels time, venue).
- Result, if played.
- Distribution of predictions: a histogram of `0-0`, `1-0`, `1-1`, … and who
  picked the closest score. Good water-cooler material.

### 7. Admin
Just a few internal screens:
- Enter final score for a match → trigger scoring.
- Edit scoring rules (the table in §4).
- Lock / unlock predictions manually if anything goes weird.
- See all users; deactivate spam accounts.

Single FARI admin role; no per-row permissions.

---

## Screens to design / build

| Route | Screen | Auth | Notes |
|---|---|---|---|
| `/` | Home / next-up matches + your standing | logged-in | Hero card of next match; CTA to predict |
| `/login` | Magic-link login | public | |
| `/schedule` | Schedule (Poules / Kalender / Knock-out tabs) | public | Mirror prototype |
| `/predict/:matchId` | Prediction form for one match | logged-in | Score inputs, optional bonuses, save/lock state |
| `/predict/bracket` | Knockout bracket prediction | logged-in | Available after 27 June |
| `/leaderboard` | Main + filters | public | |
| `/match/:matchId` | Match detail + prediction histogram | public | |
| `/profile` | Edit own predictions list | logged-in | |
| `/admin` | Result entry + settings | admin | |

---

## Design tokens (lift these wholesale)

From `Speelschema WK 2026.html`'s `styles.css`:

```css
--fari-blue:        #1c3d8f;   /* primary surface */
--fari-blue-deep:   #14306f;
--fari-blue-bright: #4a6fdb;
--fari-mint:        #2fd4b0;   /* accent — dot, pills, host badges */
--fari-mint-bright: #5be3c5;

--ink:              #0f1f4d;
--ink-soft:         #4a5780;
--paper:            #ffffff;
--paper-tint:       #f4f6fb;
--line-dark:        #e6eaf4;
--line-soft:        rgba(255,255,255,0.10);
```

**Type**: Manrope 400 / 500 / 600 / 700 / 800 (Google Fonts).
JetBrains Mono 400 / 500 / 600 for scores, kickoff times, codes.

**Type scale** (px, line-height 1.0–1.55 depending on size):
- display 52–56, h1 38, h2 24, h3 17, body 14, small 11, eyebrow 11/0.22em mint.

**Radii**: cards 14px, pills 999px, inputs 8px.

**The background ray**: copy `.fari-bg` + `::before` + `::after` from
`styles.css` exactly. Mounted `position: fixed; inset: 0` behind everything
on dark-bg screens.

**Logo**: use `assets/fari-logo-white.png` on dark surfaces. The dark-blue
original is `assets/fari-logo.png` for light surfaces (e.g. the footer bar
on the schedule page already uses it).

---

## Component patterns from the prototype to re-use

- **Match row** — kickoff cell · group pill · home team · — · away team ·
  venue line below. Belgium-rows get a mint-tinted background.
- **Team chip** — 3-letter code in a paper-tint code-badge + full Dutch team
  name. Host nations get a `GASTLAND` mint badge.
- **Group card** — white card with the mint corner echo, "GROEP X" header,
  4 teams stacked with codes.
- **Stage pill** — `Groepsfase` / `Achtste van 32` / `Kwartfinale` etc, mint
  bg on blue.
- **Footer** — partner strip with mint top-rule. Keep on every page; it's
  the institutional anchor.

---

## Data already wired up

`data.js` (in this bundle) exports a global `window.WK` with:
- `TEAMS` — 48 teams keyed by 3-letter code, with Dutch name + flag emoji.
- `GROUPS` — the 12 final-draw groups.
- `GROUP_STAGE` — 72 matches, each `{ date, kick, group, home, away, venue }`.
- `R32`, `R16`, `QF`, `SF`, `THIRD_PLACE`, `FINAL` — knockout fixtures with
  placeholder slots like `"2A"`, `"W73"`, `"3C/D/F/G/H"` for bracket pairings.
- `VENUES` — 16 host stadiums with capacity.

Port this to your DB as the seed for `matches`, `teams`, `venues`. The
placeholder strings in the knockout rows are the FIFA bracket-pairing rules —
keep them as a `slot_a` / `slot_b` column and resolve to real `team_id`s once
group standings finalise.

**Caveat on kickoff times**: they're illustrative Brussels-CEST slots, not
official FIFA times. The official schedule was released 6 Dec 2025 — pull it
in before launch and overwrite the `kick` column.

---

## Files in this bundle

- `README.md` — this document
- `Speelschema WK 2026.html` — the visual reference (groups · calendar ·
  bracket views, FARI styling, three tabs)
- `data.js` — the schedule data, 104 fixtures
- `components.jsx`, `app.jsx`, `styles.css`, `tweaks-panel.jsx` — the
  prototype source, useful for lifting the match-row and bracket patterns
- `assets/fari-logo.png`, `assets/fari-logo-white.png` — the FARI logo, blue
  for light surfaces and white for dark surfaces

---

## Open questions for the product owner

1. **Visibility of others' picks** before kickoff — hidden, visible, or
   visible only after lock? Hidden by default is safest.
2. **Team-names** — fixed list of FARI sub-teams, or free-text?
3. **Tie-breakers on the leaderboard** — total exact-scores? Closest goal
   difference? Pre-tournament "spice" pick?
4. **Prize / stakes** — purely glory, or something on the line?
5. **GDPR** — emails stored, display names public. Add a "delete my data"
   button before launch.

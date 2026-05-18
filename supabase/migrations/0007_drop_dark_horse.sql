-- ──────────────────────────────────────────────────────────────────────────
-- Drop the dark_horse scoring rule.
--
-- Originally seeded in 0001 with value 25, but the dark-horse pick was never
-- exposed in the UI and won't be part of this season's pool rules. Removing
-- it keeps the leaderboard's "Pool rules" section free of unused entries.
-- ──────────────────────────────────────────────────────────────────────────

delete from scoring_rules where key = 'dark_horse';

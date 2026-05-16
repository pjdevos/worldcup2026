-- ──────────────────────────────────────────────────────────────────────────
-- Tournament-wide picks: tiebreaker + top scorer.
-- Stored on `profiles` because they are per-user single-value picks.
--
--  tiebreaker_bel_goals — total goals Belgium scores across the whole
--    tournament; used to break ties at the very end of the leaderboard.
--  top_scorer            — chosen from a fixed list of 17 candidates or
--    free-text ("Someone else: …"). Worth 25 points if correct.
-- ──────────────────────────────────────────────────────────────────────────

alter table profiles
  add column if not exists tiebreaker_bel_goals int
    check (tiebreaker_bel_goals is null or tiebreaker_bel_goals between 0 and 50);

alter table profiles
  add column if not exists top_scorer text;

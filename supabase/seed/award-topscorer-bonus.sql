-- End-of-tournament top-scorer bonus — WC 2026 winner: Kylian Mbappé.
-- Worth 25 points, for everyone whose top_scorer pick matches Mbappé,
-- including free-text "Someone else…" variants (Mbappe / Mbappé / Kylian ...).
-- The '%mbapp%' pattern is accent-safe (matches before the é).
--
-- This SETS the bonus to an absolute 25 (not += 25), so it is IDEMPOTENT:
-- running it any number of times leaves everyone at exactly 25. That also
-- corrects an earlier over-award (e.g. 75 from running the additive version
-- three times).
--
-- NOTE: the top-scorer bonus is the only thing that writes profiles.bonus_points
-- in this app, so setting it to 25 is safe. If you ever add another bonus
-- source, switch to a targeted correction instead.

-- 1. Preview (run before/after to check):
select display_name, top_scorer, bonus_points
from profiles
where lower(trim(top_scorer)) like '%mbapp%'
order by display_name;

-- 2. Set the bonus to exactly 25 for Mbappé pickers:
update profiles
set bonus_points = 25
where lower(trim(top_scorer)) like '%mbapp%';

-- 3. (Optional) make sure nobody else carries a stray bonus:
-- update profiles set bonus_points = 0
-- where lower(trim(top_scorer)) not like '%mbapp%' and bonus_points <> 0;

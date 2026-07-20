-- Fairness adjustment: Pieter-Jan was the only player who filled in the
-- Round of 32, earning 56 match points nobody else could. Remove that 56-point
-- advantage from the leaderboard total by lowering bonus_points.
--
-- The leaderboard total is sum(match points) + bonus_points (view "leaderboard",
-- migration 0004). bonus_points may go negative, so it flows through as a
-- straight -56 on the total.
--
-- IDEMPOTENT: sets bonus_points to an absolute target — the Mbappé top-scorer
-- bonus (25 if picked, else 0) minus 56 — so running it more than once still
-- lands on the same value. Change the display_name if your pool name differs.

-- 1. Preview the current standing:
select display_name, match_points, bonus_points, points
from leaderboard
where display_name = 'Pieter-Jan';

-- 2. Apply the adjustment (Mbappé bonus, if any, minus the 56 R32 points):
update profiles
set bonus_points =
  (case when lower(trim(top_scorer)) like '%mbapp%' then 25 else 0 end) - 56
where display_name = 'Pieter-Jan';

-- 3. Verify (points should now be 56 lower than in step 1):
select display_name, match_points, bonus_points, points
from leaderboard
where display_name = 'Pieter-Jan';

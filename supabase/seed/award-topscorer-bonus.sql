-- End-of-tournament top-scorer bonus — WC 2026 winner: Kylian Mbappé.
-- Worth 25 points. Awards everyone whose top_scorer pick matches Mbappé,
-- including free-text "Someone else…" variants (Mbappe / Mbappé / Kylian ...).
-- The '%mbapp%' pattern is accent-safe (matches before the é).
--
-- ⚠️ RUN EXACTLY ONCE. bonus_points is additive (+ 25), so re-running
-- double-awards. Check the SELECT first, then run the UPDATE.

-- 1. Preview who will get the bonus:
select display_name, top_scorer, bonus_points
from profiles
where lower(trim(top_scorer)) like '%mbapp%'
order by display_name;

-- 2. Award the 25-point bonus:
update profiles
set bonus_points = bonus_points + 25
where lower(trim(top_scorer)) like '%mbapp%';

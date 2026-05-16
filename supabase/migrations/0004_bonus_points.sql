-- ──────────────────────────────────────────────────────────────────────────
-- Bonus points on profiles + leaderboard view that includes them.
--
-- Use case: tournament-wide payouts that don't fit the per-match scoring
-- (top scorer correct = +25, dark-horse bonus, "best newcomer" prize,
-- whatever else admin decides to award by SQL at the end). Bonus is a
-- single integer that simply adds to the leaderboard total.
--
-- Example at end of tournament — award everyone who picked Haaland:
--   update profiles
--     set bonus_points = bonus_points + 25
--   where lower(trim(top_scorer)) = lower('Erling Haaland');
-- ──────────────────────────────────────────────────────────────────────────

alter table profiles
  add column if not exists bonus_points int not null default 0;

-- Rebuild the leaderboard view to include bonus + tiebreaker.
drop view if exists leaderboard;

create view leaderboard as
  select
    p.user_id,
    pr.display_name,
    pr.team_name,
    (coalesce(sum(p.points), 0) + coalesce(pr.bonus_points, 0))::int as points,
    coalesce(sum(p.points), 0)::int                                   as match_points,
    coalesce(pr.bonus_points, 0)::int                                 as bonus_points,
    coalesce(pr.tiebreaker_bel_goals, 0)::int                         as tiebreaker,
    count(*) filter (where p.points is not null)::int                 as scored
  from predictions p
  join profiles pr on pr.user_id = p.user_id
  group by p.user_id, pr.display_name, pr.team_name, pr.bonus_points, pr.tiebreaker_bel_goals;

grant select on leaderboard to anon, authenticated;

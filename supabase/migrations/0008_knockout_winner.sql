-- ──────────────────────────────────────────────────────────────────────────
-- Knockout winner — correct scoring for ties decided by extra time / penalties.
--
-- A knockout match that is level after 90'/ET and decided on penalties stores a
-- DRAW in (home_score, away_score). The old score_match inferred the winner
-- from sign(home_score - away_score), which is 0 for a draw — so it rewarded
-- users who predicted a draw and gave nothing to users who picked the team that
-- actually advanced. Knockouts have no draws.
--
-- Fix: record the team that advanced in matches.winner_team (set from
-- football-data's score.winner by the cron, or by the admin), and score the
-- knockout direction against it. Group-stage scoring is unchanged.
-- ──────────────────────────────────────────────────────────────────────────

alter table matches
  add column if not exists winner_team text references teams(code);

comment on column matches.winner_team is
  'Knockout decider: the team that advanced (survives extra time + penalty '
  'shootouts). Null for group matches and for undecided ties.';

create or replace function public.score_match(p_match_id int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  m              matches%rowtype;
  rule_group_win int;
  rule_group_xct int;
  rule_r32_win   int;
  rule_r16_win   int;
  rule_qf_win    int;
  rule_sf_win    int;
  rule_final_win int;
  rule_final_xct int;
  scored         int := 0;
begin
  select * into m from matches where id = p_match_id;
  if not found then
    raise exception 'score_match: match % not found', p_match_id;
  end if;
  if m.home_score is null or m.away_score is null then
    raise exception 'score_match: match % has no result yet', p_match_id;
  end if;

  -- Fetch every rule once.
  select value into rule_group_win from scoring_rules where key = 'group_winner';
  select value into rule_group_xct from scoring_rules where key = 'group_exact';
  select value into rule_r32_win   from scoring_rules where key = 'r32_winner';
  select value into rule_r16_win   from scoring_rules where key = 'r16_winner';
  select value into rule_qf_win    from scoring_rules where key = 'qf_winner';
  select value into rule_sf_win    from scoring_rules where key = 'sf_winner';
  select value into rule_final_win from scoring_rules where key = 'final_winner';
  select value into rule_final_xct from scoring_rules where key = 'final_exact_bonus';

  -- Group stage: 3 for winner/draw direction; 5 for exact (replaces).
  if m.stage = 'group' then
    update predictions p
      set points = case
        when p.home_score = m.home_score and p.away_score = m.away_score
          then rule_group_xct
        when sign(p.home_score - p.away_score) = sign(m.home_score - m.away_score)
          then rule_group_win
        else 0
      end
    where p.match_id = p_match_id;
  else
    -- Knockout: award the round's points for predicting the team that ADVANCED.
    -- m.winner_team is authoritative and survives extra time + penalties. When
    -- it is null we fall back to the sign of the stored 90'/ET score, but a
    -- level stored score then scores nobody (a knockout cannot end in a draw).
    -- The Final's exact-score bonus still compares to the stored scoreline.
    update predictions p
      set points = case
        when (case
                when m.winner_team is not null then
                  (p.home_score > p.away_score and m.winner_team = m.home_team)
                  or (p.away_score > p.home_score and m.winner_team = m.away_team)
                else
                  p.home_score <> p.away_score
                  and sign(p.home_score - p.away_score) = sign(m.home_score - m.away_score)
              end)
          then case m.stage
            when 'r32'   then rule_r32_win
            when 'r16'   then rule_r16_win
            when 'qf'    then rule_qf_win
            when 'sf'    then rule_sf_win
            when 'final' then
              rule_final_win
              + case when p.home_score = m.home_score and p.away_score = m.away_score
                       then rule_final_xct else 0 end
            else 0
          end
        else 0
      end
    where p.match_id = p_match_id;
  end if;

  get diagnostics scored = row_count;
  return scored;
end $$;

grant execute on function public.score_match(int) to authenticated;

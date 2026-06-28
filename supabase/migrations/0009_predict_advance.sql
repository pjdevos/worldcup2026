-- ──────────────────────────────────────────────────────────────────────────
-- Predicted advancer — let users predict a level knockout score AND say who
-- goes through on penalties.
--
-- A knockout prediction is really a prediction of who advances. A decisive
-- scoreline implies it; a level scoreline (e.g. 1-1) does not, so the user
-- picks the team in predictions.advance_team. score_match's knockout branch
-- now compares the user's predicted advancer to matches.winner_team. The
-- Final's exact-score bonus still applies on top of the winner points, so a
-- correct "1-1, Belgium on pens" pockets both. Requires 0008 (winner_team).
-- ──────────────────────────────────────────────────────────────────────────

alter table predictions
  add column if not exists advance_team text references teams(code);

comment on column predictions.advance_team is
  'Knockout only: who the user predicts advances when their predicted score is '
  'level (penalty pick). Ignored for a decisive prediction and for group games.';

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
    -- Knockout: award the round's points when the user's PREDICTED ADVANCER
    -- matches the team that advanced (m.winner_team). The predicted advancer is
    -- the higher-scored side, or p.advance_team when the prediction is level
    -- (the penalty pick). Falls back to the score sign when winner_team is
    -- unknown; a level stored score then scores nobody. The Final's exact-score
    -- bonus stacks on top of the winner points.
    update predictions p
      set points = case
        when (case
                when m.winner_team is not null then
                  m.winner_team = case
                    when p.home_score > p.away_score then m.home_team
                    when p.away_score > p.home_score then m.away_team
                    else p.advance_team
                  end
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

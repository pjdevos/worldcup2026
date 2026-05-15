-- ──────────────────────────────────────────────────────────────────────────
-- Scoring engine — server-side, idempotent.
--
-- Called by:
--   1. the /admin "Save & score" button via supabase.rpc('score_match', ...)
--   2. the Vercel cron (api/cron/fetch-results.ts) when football-data.org
--      reports a FINISHED match.
--
-- Re-running on the same match overwrites prior points for that match's
-- predictions only — safe to invoke after a score correction.
-- ──────────────────────────────────────────────────────────────────────────

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
    -- Knockout: prediction stores winner via the score (whoever the user
    -- predicted to score more). Exact score grants the bonus on the Final.
    update predictions p
      set points = case
        when sign(p.home_score - p.away_score) = sign(m.home_score - m.away_score)
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

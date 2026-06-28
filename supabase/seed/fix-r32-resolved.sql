-- Round of 32 resolution — apply in the Supabase SQL editor after the group
-- stage (the bracket resolved 2026-06-28). Sets the qualified teams, the
-- official kickoff times (UTC), and clears the now-obsolete slot placeholders
-- for matches 73-88. Safe to re-run: touches only kick_at / home_team /
-- away_team / home_slot / away_slot — never home_score, away_score or status.
--
-- Source of truth: apps/web/src/data/wk.ts (R32). Regenerate the full seed with
-- `pnpm seed:gen` if you change wk.ts; this file is the live-DB delta only.

update matches set home_team = 'RSA', away_team = 'CAN', home_slot = null, away_slot = null, kick_at = '2026-06-28T19:00:00Z' where id = 73;
update matches set home_team = 'GER', away_team = 'PAR', home_slot = null, away_slot = null, kick_at = '2026-06-29T20:30:00Z' where id = 74;
update matches set home_team = 'NED', away_team = 'MAR', home_slot = null, away_slot = null, kick_at = '2026-06-30T01:00:00Z' where id = 75;
update matches set home_team = 'BRA', away_team = 'JPN', home_slot = null, away_slot = null, kick_at = '2026-06-29T17:00:00Z' where id = 76;
update matches set home_team = 'FRA', away_team = 'SWE', home_slot = null, away_slot = null, kick_at = '2026-06-30T21:00:00Z' where id = 77;
update matches set home_team = 'CIV', away_team = 'NOR', home_slot = null, away_slot = null, kick_at = '2026-06-30T17:00:00Z' where id = 78;
update matches set home_team = 'MEX', away_team = 'ECU', home_slot = null, away_slot = null, kick_at = '2026-07-01T01:00:00Z' where id = 79;
update matches set home_team = 'ENG', away_team = 'COD', home_slot = null, away_slot = null, kick_at = '2026-07-01T16:00:00Z' where id = 80;
update matches set home_team = 'USA', away_team = 'BIH', home_slot = null, away_slot = null, kick_at = '2026-07-02T00:00:00Z' where id = 81;
update matches set home_team = 'BEL', away_team = 'SEN', home_slot = null, away_slot = null, kick_at = '2026-07-01T20:00:00Z' where id = 82;
update matches set home_team = 'POR', away_team = 'CRO', home_slot = null, away_slot = null, kick_at = '2026-07-02T23:00:00Z' where id = 83;
update matches set home_team = 'ESP', away_team = 'AUT', home_slot = null, away_slot = null, kick_at = '2026-07-02T19:00:00Z' where id = 84;
update matches set home_team = 'SUI', away_team = 'ALG', home_slot = null, away_slot = null, kick_at = '2026-07-03T03:00:00Z' where id = 85;
update matches set home_team = 'ARG', away_team = 'CPV', home_slot = null, away_slot = null, kick_at = '2026-07-03T22:00:00Z' where id = 86;
update matches set home_team = 'COL', away_team = 'GHA', home_slot = null, away_slot = null, kick_at = '2026-07-04T01:30:00Z' where id = 87;
update matches set home_team = 'AUS', away_team = 'EGY', home_slot = null, away_slot = null, kick_at = '2026-07-03T18:00:00Z' where id = 88;

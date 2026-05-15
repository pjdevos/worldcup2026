// Typed wrappers around the Supabase client. The client itself is untyped
// (see lib/supabase.ts for why); each wrapper casts the result to the
// matching interface in lib/database.types.ts.

import type {
  DbMatch,
  DbPrediction,
  DbProfile,
  DbScoringRule,
} from "./database.types";
import { supabase } from "./supabase";

// ── Profiles ────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<DbProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as DbProfile | null) ?? null;
}

export async function updateProfile(
  userId: string,
  patch: { display_name?: string; team_name?: string | null },
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("user_id", userId);
  if (error) throw error;
}

// ── Matches ─────────────────────────────────────────────────────────────

export async function listMatches(): Promise<DbMatch[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("kick_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbMatch[];
}

export async function getMatch(id: number): Promise<DbMatch | null> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as DbMatch | null) ?? null;
}

export async function setMatchResult(
  id: number,
  home: number,
  away: number,
): Promise<void> {
  const { error } = await supabase
    .from("matches")
    .update({
      home_score: home,
      away_score: away,
      status: "FINISHED",
      result_entered_at: new Date().toISOString(),
      result_source: "admin",
    })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Run scoring for a match. Server-side function; safe to re-invoke (overwrites
 * prior points for that match's predictions only).
 */
export async function scoreMatch(matchId: number): Promise<number> {
  const { data, error } = await supabase.rpc("score_match", { p_match_id: matchId });
  if (error) throw error;
  return typeof data === "number" ? data : 0;
}

export async function setMatchResultAndScore(
  id: number,
  home: number,
  away: number,
): Promise<number> {
  await setMatchResult(id, home, away);
  return scoreMatch(id);
}

// ── Predictions ─────────────────────────────────────────────────────────

export async function getMyPrediction(
  userId: string,
  matchId: number,
): Promise<DbPrediction | null> {
  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", userId)
    .eq("match_id", matchId)
    .maybeSingle();
  if (error) throw error;
  return (data as DbPrediction | null) ?? null;
}

export async function listMyPredictions(userId: string): Promise<DbPrediction[]> {
  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", userId)
    .order("match_id");
  if (error) throw error;
  return (data ?? []) as DbPrediction[];
}

export async function upsertPrediction(
  userId: string,
  matchId: number,
  homeScore: number,
  awayScore: number,
): Promise<void> {
  const { error } = await supabase
    .from("predictions")
    .upsert(
      {
        user_id: userId,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
      },
      { onConflict: "user_id,match_id" },
    );
  if (error) throw error;
}

// ── Scoring rules ───────────────────────────────────────────────────────

export async function listScoringRules(): Promise<DbScoringRule[]> {
  const { data, error } = await supabase
    .from("scoring_rules")
    .select("*")
    .order("key");
  if (error) throw error;
  return (data ?? []) as DbScoringRule[];
}

// ── Leaderboard view ────────────────────────────────────────────────────

export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  team_name: string | null;
  points: number;
  scored: number;
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("points", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}

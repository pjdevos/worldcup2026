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

/**
 * Update tournament-wide picks (tiebreaker + top scorer). Pass null to
 * clear a field, or omit it to leave it unchanged.
 */
export async function updateTournamentPicks(
  userId: string,
  picks: {
    tiebreaker_bel_goals?: number | null;
    top_scorer?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(picks)
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
  /** Total = match_points + bonus_points. */
  points: number;
  /** Sum of per-match points. */
  match_points: number;
  /** Bonus awarded at tournament end (top scorer correct, etc). */
  bonus_points: number;
  /** Tournament-wide tiebreaker: predicted Belgium goal total. */
  tiebreaker: number;
  scored: number;
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  // Sort: total points desc, then tiebreaker proximity is applied client-side
  // once we know the actual Belgium goal total (post-tournament admin step).
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("points", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}

// ── Cron logs (admin only via RLS) ──────────────────────────────────────

import type { DbCronLog } from "./database.types";

export interface CronStatus {
  lastRun: DbCronLog | null;
  autoUpdatedToday: number;
  recent: DbCronLog[];
}

export async function getCronStatus(): Promise<CronStatus> {
  const [logsRes, todayRes] = await Promise.all([
    supabase
      .from("cron_logs")
      .select("*")
      .eq("job", "fetch-results")
      .order("ran_at", { ascending: false })
      .limit(10),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("result_source", "cron")
      .gte(
        "result_entered_at",
        new Date(new Date().toISOString().slice(0, 10)).toISOString(),
      ),
  ]);

  if (logsRes.error) throw logsRes.error;
  if (todayRes.error) throw todayRes.error;

  const logs = (logsRes.data ?? []) as DbCronLog[];
  return {
    lastRun: logs[0] ?? null,
    autoUpdatedToday: todayRes.count ?? 0,
    recent: logs,
  };
}

export interface FetchNowResult {
  ok: boolean;
  checked: number;
  updated: number;
  errors: number;
  error_message?: string;
}

/**
 * Trigger the cron logic manually. Calls /api/admin/fetch-now with the
 * current Supabase access token; server-side checks is_admin.
 */
export async function triggerFetchNow(): Promise<FetchNowResult> {
  const { data: sessionRes } = await supabase.auth.getSession();
  const token = sessionRes.session?.access_token;
  if (!token) throw new Error("Niet ingelogd");

  const res = await fetch("/api/admin/fetch-now", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      (body.error as string) ?? `HTTP ${res.status}`,
    );
  }
  return body as unknown as FetchNowResult;
}

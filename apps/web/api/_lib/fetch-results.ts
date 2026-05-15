// Shared logic for the football-data.org → Supabase result poller.
// Imported by both /api/cron/fetch-results (cron) and /api/admin/fetch-now
// (admin button). Functions named with an underscore-prefixed directory are
// not exposed as routes by Vercel.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  homeTeam: { id: number; tla: string | null; name: string };
  awayTeam: { id: number; tla: string | null; name: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    winner: string | null;
  };
}

interface FdResponse {
  matches: FdMatch[];
  resultSet?: { count: number };
}

interface OurMatch {
  id: number;
  home_team: string | null;
  away_team: string | null;
  kick_at: string;
  status: string;
}

export interface FetchSummary {
  ok: boolean;
  checked: number;
  updated: number;
  errors: number;
  detail: Array<{
    match_id: number;
    fd_id: number;
    home_score: number;
    away_score: number;
    note?: string;
  }>;
  error_message?: string;
}

const FD_BASE = "https://api.football-data.org/v4";
const COMPETITION_CODE = "WC"; // FIFA World Cup
const COMPETITION_SEASON = 2026;

function adminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Pull every FINISHED WC fixture from football-data.org and reconcile against
 * our DB. For each match we have whose status != FINISHED and whose teams +
 * date match a finished FD fixture, write the result and trigger scoring.
 *
 * Single bulk API call per invocation — cheap on the 10-req/min rate limit
 * regardless of how many matches resolved in the window.
 */
export async function runFetchResults(): Promise<FetchSummary> {
  const fdKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!fdKey) {
    throw new Error("Missing FOOTBALL_DATA_API_KEY in environment");
  }

  const supabase = adminClient();
  const detail: FetchSummary["detail"] = [];
  let errors = 0;

  // 1. Fetch all WC matches in this season from football-data.org.
  const fdUrl = `${FD_BASE}/competitions/${COMPETITION_CODE}/matches?season=${COMPETITION_SEASON}`;
  const fdRes = await fetch(fdUrl, {
    headers: { "X-Auth-Token": fdKey },
  });

  if (!fdRes.ok) {
    const body = await fdRes.text().catch(() => "");
    const summary: FetchSummary = {
      ok: false,
      checked: 0,
      updated: 0,
      errors: 1,
      detail: [],
      error_message: `football-data.org returned ${fdRes.status}: ${body.slice(0, 200)}`,
    };
    await logRun(supabase, summary);
    return summary;
  }

  const fdJson = (await fdRes.json()) as FdResponse;
  const allFd = fdJson.matches ?? [];
  const finishedFd = allFd.filter(
    (m) => m.status === "FINISHED" && m.score.fullTime.home !== null,
  );

  // 2. Load our matches that aren't FINISHED yet.
  const { data: ourMatches, error: ourErr } = await supabase
    .from("matches")
    .select("id, home_team, away_team, kick_at, status")
    .neq("status", "FINISHED");

  if (ourErr) {
    const summary: FetchSummary = {
      ok: false,
      checked: finishedFd.length,
      updated: 0,
      errors: 1,
      detail: [],
      error_message: `DB read failed: ${ourErr.message}`,
    };
    await logRun(supabase, summary);
    return summary;
  }

  const ours = (ourMatches ?? []) as OurMatch[];

  // 3. For each finished FD fixture, find the matching DB row and update.
  for (const fd of finishedFd) {
    const fdDate = fd.utcDate.slice(0, 10); // YYYY-MM-DD UTC
    const homeTla = fd.homeTeam?.tla?.toUpperCase() ?? null;
    const awayTla = fd.awayTeam?.tla?.toUpperCase() ?? null;
    if (!homeTla || !awayTla) continue;

    const match = ours.find(
      (m) =>
        m.home_team === homeTla &&
        m.away_team === awayTla &&
        m.kick_at.slice(0, 10) === fdDate,
    );
    if (!match) continue;

    const home = fd.score.fullTime.home as number;
    const away = fd.score.fullTime.away as number;

    const { error: upErr } = await supabase
      .from("matches")
      .update({
        home_score: home,
        away_score: away,
        status: "FINISHED",
        external_id: fd.id.toString(),
        result_entered_at: new Date().toISOString(),
        result_source: "cron",
      })
      .eq("id", match.id);

    if (upErr) {
      errors++;
      detail.push({
        match_id: match.id,
        fd_id: fd.id,
        home_score: home,
        away_score: away,
        note: `update failed: ${upErr.message}`,
      });
      continue;
    }

    // 4. Trigger scoring for this match.
    const { error: scoreErr } = await supabase.rpc("score_match", {
      p_match_id: match.id,
    });

    if (scoreErr) {
      errors++;
      detail.push({
        match_id: match.id,
        fd_id: fd.id,
        home_score: home,
        away_score: away,
        note: `update ok, score_match failed: ${scoreErr.message}`,
      });
      continue;
    }

    detail.push({
      match_id: match.id,
      fd_id: fd.id,
      home_score: home,
      away_score: away,
    });
  }

  const summary: FetchSummary = {
    ok: errors === 0,
    checked: finishedFd.length,
    updated: detail.filter((d) => !d.note).length,
    errors,
    detail,
  };
  await logRun(supabase, summary);
  return summary;
}

async function logRun(supabase: SupabaseClient, s: FetchSummary): Promise<void> {
  const { error } = await supabase.from("cron_logs").insert({
    job: "fetch-results",
    checked: s.checked,
    updated: s.updated,
    errors: s.errors,
    detail: { entries: s.detail, error_message: s.error_message ?? null },
  });
  if (error) {
    console.error("cron_logs insert failed:", error.message);
  }
}

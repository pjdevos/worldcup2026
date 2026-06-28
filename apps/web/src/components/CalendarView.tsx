import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  FINAL,
  GROUP_STAGE,
  QF,
  R16,
  R32,
  SF,
  TEAMS,
  THIRD_PLACE,
  type GroupMatch,
  type KnockoutTie,
} from "../data/wk";
import { fmtDate, fullWeekday } from "../lib/format";
import { useIdentity } from "../lib/identity";
import type { DbPrediction } from "../lib/database.types";
import { listMyPredictions, upsertPrediction } from "../lib/queries";
import { MatchRow, type MatchRowData, type StageLabel } from "./MatchRow";
import { TournamentPicks } from "./TournamentPicks";

interface AnyMatch extends MatchRowData {
  date: string;
  stage: StageLabel;
}

function tieToRow(t: KnockoutTie, stage: StageLabel): AnyMatch {
  return {
    id: t.n,
    date: t.date,
    kick: t.kick,
    home: t.left,
    away: t.right,
    venue: t.venue,
    stage,
    group: null,
  };
}

function groupToRow(m: GroupMatch): AnyMatch {
  return {
    id: m.n,
    date: m.date,
    kick: m.kick,
    home: m.home,
    away: m.away,
    venue: m.venue,
    stage: "group",
    group: m.group,
  };
}

function stageOf(date: string): string {
  if (date <= "2026-06-27") return "Group stage";
  if (date <= "2026-07-04") return "Round of 32";
  if (date <= "2026-07-07") return "Round of 16";
  if (date <= "2026-07-11") return "Quarter-finals";
  if (date <= "2026-07-15") return "Semi-finals";
  if (date <= "2026-07-18") return "3rd place";
  return "Final";
}

/** Construct the UTC instant for a Brussels-local date+time. */
function toKickAt(m: AnyMatch): Date {
  return new Date(`${m.date}T${m.kick}:00+02:00`);
}

const LOCK_MS = 5 * 60 * 1000;

export function CalendarView() {
  const identity = useIdentity();
  const userId = identity?.userId;
  const qc = useQueryClient();

  // Tick a local clock every 30s so the editable/locked transition is live.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const allMatches = useMemo<AnyMatch[]>(() => {
    return [
      ...GROUP_STAGE.map((m) => groupToRow(m)),
      ...R32.map((t) => tieToRow(t, "R32")),
      ...R16.map((t) => tieToRow(t, "R16")),
      ...QF.map((t) => tieToRow(t, "QF")),
      ...SF.map((t) => tieToRow(t, "SF")),
      tieToRow(THIRD_PLACE, "3/4"),
      tieToRow(FINAL, "FINAL"),
    ];
  }, []);

  const days = useMemo(() => {
    const map = new Map<string, AnyMatch[]>();
    for (const m of allMatches) {
      const list = map.get(m.date) ?? [];
      list.push(m);
      map.set(m.date, list);
    }
    const arr = Array.from(map.entries())
      .map(([date, matches]) => ({ date, matches }))
      .sort((a, b) => a.date.localeCompare(b.date));
    arr.forEach((d) => d.matches.sort((a, b) => a.kick.localeCompare(b.kick)));
    return arr;
  }, [allMatches]);

  // Land on today's (or the next upcoming) match day rather than 11 June.
  const todayStr = useMemo(() => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }, []);

  const [activeDate, setActiveDate] = useState<string>(
    () =>
      days.find((d) => d.date >= todayStr)?.date ??
      days[days.length - 1]?.date ??
      "2026-06-11",
  );

  // Each stage in the sidebar is collapsible. Collapse stages whose days are
  // all in the past so the live rounds sit at the top — no scrolling past the
  // 17 group-stage days to reach the Round of 32.
  const [openStages, setOpenStages] = useState<Set<string>>(() => {
    const open = new Set<string>();
    for (const d of days) if (d.date >= todayStr) open.add(stageOf(d.date));
    const landing =
      days.find((d) => d.date >= todayStr)?.date ?? days[days.length - 1]?.date;
    if (landing) open.add(stageOf(landing));
    return open;
  });

  const toggleStage = (stage: string) =>
    setOpenStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });

  const grouped = useMemo(() => {
    const out: Array<{ stage: string; days: typeof days }> = [];
    let curStage: string | null = null;
    for (const d of days) {
      const s = stageOf(d.date);
      if (s !== curStage) {
        out.push({ stage: s, days: [] });
        curStage = s;
      }
      out[out.length - 1].days.push(d);
    }
    return out;
  }, [days]);

  // Load the user's predictions. RLS guarantees we only see our own
  // pre-kickoff predictions; for post-kickoff matches anyone's are
  // readable but we keep the query scoped to ours by user_id.
  const predictionsQ = useQuery<DbPrediction[]>({
    queryKey: ["my-predictions", userId ?? "anon"],
    queryFn: () => (userId ? listMyPredictions(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
  });

  const predictionsByMatch = useMemo(() => {
    const m = new Map<number, DbPrediction>();
    for (const p of predictionsQ.data ?? []) m.set(p.match_id, p);
    return m;
  }, [predictionsQ.data]);

  const saveMutation = useMutation({
    mutationFn: async ({
      matchId,
      home,
      away,
      advanceTeam,
    }: {
      matchId: number;
      home: number;
      away: number;
      advanceTeam: string | null;
    }) => {
      if (!userId) throw new Error("Niet ingelogd");
      await upsertPrediction(userId, matchId, home, away, advanceTeam);
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["my-predictions", userId ?? "anon"],
      });
    },
  });

  const active = days.find((d) => d.date === activeDate);
  const stage = active ? stageOf(active.date) : "";
  const now = Date.now();

  return (
    <div className="section">
      <div className="section-head">
        <h2>Full schedule</h2>
        <div className="hint">
          {days.length} match days · 104 matches · all kickoff times in Brussels time
          {userId
            ? " · click +/− to save your prediction"
            : " · sign in to enter your predictions"}
        </div>
      </div>

      {userId && <TournamentPicks />}
      <div className="calendar">
        <div className="cal-sidebar">
          {grouped.map((blk, i) => {
            const open = openStages.has(blk.stage);
            return (
              <Fragment key={i}>
                <button
                  type="button"
                  className="stage-label"
                  onClick={() => toggleStage(blk.stage)}
                  aria-expanded={open}
                >
                  <span className="chev" aria-hidden="true">
                    {open ? "▾" : "▸"}
                  </span>
                  <span className="stage-name">{blk.stage}</span>
                  <span className="cnt">{blk.days.length}</span>
                </button>
                {open &&
                  blk.days.map((d) => (
                    <button
                      key={d.date}
                      className={`cal-day-btn ${d.date === activeDate ? "is-active" : ""}`}
                      onClick={() => setActiveDate(d.date)}
                    >
                      <span>{fmtDate(d.date, { weekdayDay: true })}</span>
                      <span className="cnt">{d.matches.length}</span>
                    </button>
                  ))}
              </Fragment>
            );
          })}
        </div>
        <div className="cal-day">
          {active && (
            <>
              <div className="cal-day-head">
                <div className="date-big">{fmtDate(active.date, { short: true })}</div>
                <div>
                  <div
                    className="date-sub"
                    style={{ textTransform: "capitalize" }}
                  >
                    {fullWeekday(active.date)}
                  </div>
                </div>
                <div className="stage-pill">{stage}</div>
              </div>
              <div>
                {active.matches.map((m) => {
                  const teamsKnown =
                    !!TEAMS[m.home] && !!TEAMS[m.away];
                  const kickAt = toKickAt(m).getTime();
                  const editable =
                    Boolean(userId) &&
                    teamsKnown &&
                    now < kickAt - LOCK_MS;
                  const prediction = m.id != null ? predictionsByMatch.get(m.id) ?? null : null;
                  return (
                    <MatchRow
                      key={`${m.date}-${m.kick}-${m.id ?? m.home}`}
                      match={m}
                      prediction={prediction}
                      editable={editable}
                      onSave={(matchId, home, away, advanceTeam) =>
                        saveMutation.mutate({ matchId, home, away, advanceTeam })
                      }
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { Fragment, useMemo, useState } from "react";
import {
  FINAL,
  GROUP_STAGE,
  QF,
  R16,
  R32,
  SF,
  THIRD_PLACE,
  type GroupMatch,
  type KnockoutTie,
} from "../data/wk";
import { fmtDate, fullWeekday } from "../lib/format";
import { MatchRow, type MatchRowData, type StageLabel } from "./MatchRow";

interface AnyMatch extends MatchRowData {
  date: string;
  stage: StageLabel;
}

function tieToRow(t: KnockoutTie, stage: StageLabel): AnyMatch {
  return {
    id: t.n, // 73-104, matches DB match.id
    date: t.date,
    kick: t.kick,
    home: t.left,
    away: t.right,
    venue: t.venue,
    stage,
    group: null,
  };
}

function groupToRow(m: GroupMatch, idx: number): AnyMatch {
  return {
    id: idx + 1, // 1-72, matches DB match.id (positional)
    date: m.date,
    kick: m.kick,
    home: m.home,
    away: m.away,
    venue: m.venue,
    stage: "groep",
    group: m.group,
  };
}

function stageOf(date: string): string {
  if (date <= "2026-06-27") return "Groepsfase";
  if (date <= "2026-07-04") return "Achtste van 32";
  if (date <= "2026-07-07") return "Achtste finale";
  if (date <= "2026-07-11") return "Kwartfinale";
  if (date <= "2026-07-15") return "Halve finale";
  if (date <= "2026-07-18") return "Plek 3/4";
  return "Finale";
}

export function CalendarView() {
  const allMatches = useMemo<AnyMatch[]>(() => {
    return [
      ...GROUP_STAGE.map((m, i) => groupToRow(m, i)),
      ...R32.map((t) => tieToRow(t, "R32")),
      ...R16.map((t) => tieToRow(t, "R16")),
      ...QF.map((t) => tieToRow(t, "KF")),
      ...SF.map((t) => tieToRow(t, "HF")),
      tieToRow(THIRD_PLACE, "3/4"),
      tieToRow(FINAL, "FINALE"),
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

  const [activeDate, setActiveDate] = useState<string>(
    () => days[0]?.date ?? "2026-06-11",
  );

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

  const active = days.find((d) => d.date === activeDate);
  const stage = active ? stageOf(active.date) : "";

  return (
    <div className="section">
      <div className="section-head">
        <h2>Volledige speelkalender</h2>
        <div className="hint">
          {days.length} speeldagen · 104 wedstrijden · alle aftraptijden in Brusselse tijd
        </div>
      </div>
      <div className="calendar">
        <div className="cal-sidebar">
          {grouped.map((blk, i) => (
            <Fragment key={i}>
              <div className="stage-label">{blk.stage}</div>
              {blk.days.map((d) => (
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
          ))}
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
                {active.matches.map((m, i) => (
                  <MatchRow key={i} match={m} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

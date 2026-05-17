import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { TEAMS } from "../data/wk";
import type { DbCronLog, DbMatch, DbScoringRule } from "../lib/database.types";
import { formatKickoff } from "../lib/matchHelpers";
import {
  getCronStatus,
  listMatches,
  listScoringRules,
  setMatchResultAndScore,
  type CronStatus,
} from "../lib/queries";
import { supabase } from "../lib/supabase";

export function AdminPage() {
  const matchesQ = useQuery<DbMatch[]>({
    queryKey: ["matches"],
    queryFn: listMatches,
  });

  // Past-or-current first (likely to need a result), then upcoming.
  const ordered = (matchesQ.data ?? []).slice().sort((a, b) => {
    const aOver = new Date(a.kick_at).getTime() < Date.now();
    const bOver = new Date(b.kick_at).getTime() < Date.now();
    if (aOver !== bOver) return aOver ? -1 : 1;
    return a.kick_at.localeCompare(b.kick_at);
  });

  const pending = ordered.filter((m) => m.status !== "FINISHED").slice(0, 30);

  return (
    <>
      <CronStatusPanel />

      <div className="section">
        <div className="section-head">
          <h2>Admin · Enter results</h2>
          <div className="hint">
            Enter the final score to compute points. Re-running overwrites previous points.
          </div>
        </div>

        {matchesQ.isLoading && <div className="hint">Loading…</div>}

        {pending.length === 0 && !matchesQ.isLoading && (
          <div className="hint">No pending matches.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pending.map((m) => (
            <AdminMatchRow key={m.id} match={m} />
          ))}
        </div>
      </div>

      <ScoringRulesEditor />
    </>
  );
}

function AdminMatchRow({ match }: { match: DbMatch }) {
  const qc = useQueryClient();
  const [home, setHome] = useState<string>(match.home_score?.toString() ?? "");
  const [away, setAway] = useState<string>(match.away_score?.toString() ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const h = Number(home);
      const a = Number(away);
      if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
        throw new Error("Enter both scores (whole numbers ≥ 0).");
      }
      return setMatchResultAndScore(match.id, h, a);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["matches"] });
      void qc.invalidateQueries({ queryKey: ["leaderboard"] });
      void qc.invalidateQueries({ queryKey: ["my-predictions"] });
    },
  });

  const kick = formatKickoff(match.kick_at);
  const isBel = match.home_team === "BEL" || match.away_team === "BEL";
  const overdue = new Date(match.kick_at).getTime() + 2 * 60 * 60 * 1000 < Date.now();

  return (
    <div
      className={`match ${isBel ? "is-belgium" : ""}`}
      style={{
        gridTemplateColumns: "100px 1fr 70px 30px 70px 130px",
        opacity: overdue ? 1 : 0.85,
      }}
    >
      <div className="kick-cell">
        <div className="kick" style={{ fontSize: 13 }}>{kick.time}</div>
        <div className="kick-tag">{kick.date}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontWeight: 600 }}>
          {nameOf(match.home_team, match.home_slot)} — {nameOf(match.away_team, match.away_slot)}
        </span>
        <span style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
          M{match.id} · {match.stage === "group" ? `Group ${match.group_id}` : match.stage.toUpperCase()}
          {overdue && <span style={{ color: "var(--fari-mint)", marginLeft: 8 }}>● played?</span>}
        </span>
      </div>
      <ScoreInput value={home} onChange={setHome} />
      <span style={{ textAlign: "center", opacity: 0.5 }}>–</span>
      <ScoreInput value={away} onChange={setAway} />
      <div>
        <button
          type="button"
          disabled={save.isPending || home === "" || away === ""}
          onClick={() => save.mutate()}
          className="tab is-active"
          style={{
            padding: "8px 14px",
            fontSize: 12,
            width: "100%",
            cursor: save.isPending ? "wait" : "pointer",
            opacity: save.isPending || home === "" || away === "" ? 0.5 : 1,
          }}
        >
          {save.isPending
            ? "Working…"
            : save.isSuccess
            ? `+${save.data ?? ""} scored`
            : "Score & compute"}
        </button>
        {save.isError && (
          <div style={{ color: "#ff8a8a", fontSize: 10, marginTop: 4 }}>
            {save.error instanceof Error ? save.error.message : String(save.error)}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={30}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid var(--line-soft)",
        borderRadius: 6,
        padding: "8px 10px",
        font: "inherit",
        fontFamily: "JetBrains Mono, monospace",
        color: "white",
        fontSize: 16,
        textAlign: "center",
      }}
    />
  );
}

function ScoringRulesEditor() {
  const qc = useQueryClient();
  const { data } = useQuery<DbScoringRule[]>({
    queryKey: ["scoring-rules"],
    queryFn: listScoringRules,
  });

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      setDrafts(Object.fromEntries(data.map((r) => [r.key, r.value.toString()])));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!data) return;
      const changed = data.filter((r) => drafts[r.key] !== r.value.toString());
      for (const r of changed) {
        const v = Number(drafts[r.key]);
        if (!Number.isInteger(v) || v < 0) throw new Error(`Bad value for ${r.key}`);
        const { error } = await supabase
          .from("scoring_rules")
          .update({ value: v })
          .eq("key", r.key);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scoring-rules"] }),
  });

  if (!data) return null;

  return (
    <div className="section">
      <div className="section-head">
        <h2 style={{ fontSize: 18 }}>Scoring rules</h2>
        <div className="hint">Changes apply from the next scoring run onwards.</div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 100px",
          gap: 10,
          maxWidth: 480,
        }}
      >
        {data.map((r) => (
          <div key={r.key} style={{ display: "contents" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 12,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {r.key}
            </label>
            <input
              type="number"
              value={drafts[r.key] ?? ""}
              onChange={(e) => setDrafts({ ...drafts, [r.key]: e.target.value })}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid var(--line-soft)",
                borderRadius: 6,
                padding: "6px 10px",
                font: "inherit",
                fontFamily: "JetBrains Mono, monospace",
                color: "white",
                textAlign: "right",
              }}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="tab is-active"
        style={{ marginTop: 12, padding: "8px 18px", cursor: save.isPending ? "wait" : "pointer" }}
      >
        {save.isPending ? "Saving…" : save.isSuccess ? "Saved" : "Save rules"}
      </button>
      {save.isError && (
        <div style={{ color: "#ff8a8a", fontSize: 12, marginTop: 8 }}>
          {save.error instanceof Error ? save.error.message : String(save.error)}
        </div>
      )}
    </div>
  );
}

function nameOf(code: string | null, slot: string | null): string {
  if (code && TEAMS[code]) return TEAMS[code].name;
  return slot ?? "TBD";
}

// ─── Cron status + manual "Fetch now" ─────────────────────────────────

function CronStatusPanel() {
  const { data, isLoading } = useQuery<CronStatus>({
    queryKey: ["cron-status"],
    queryFn: getCronStatus,
    refetchInterval: 60_000,
  });

  const lastRun = data?.lastRun;
  const lastRunRel = lastRun ? relTime(new Date(lastRun.ran_at)) : "not yet run";

  return (
    <div className="section">
      <div className="section-head">
        <h2 style={{ fontSize: 18 }}>Auto-fetch · football-data.org</h2>
        <div className="hint">
          Vercel cron runs daily and pulls in final scores. Use the manual
          score-entry table below for immediate updates.
        </div>
      </div>

      {isLoading && <div className="hint">Loading…</div>}

      {data && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            alignItems: "start",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--line-soft)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <Stat label="Last run" value={lastRunRel}>
            {lastRun && (
              <span style={{ fontSize: 11, opacity: 0.6 }}>
                checked: {lastRun.checked} · updated: {lastRun.updated} · errors: {lastRun.errors}
              </span>
            )}
          </Stat>
          <Stat label="Auto-updated today" value={`${data.autoUpdatedToday} match${data.autoUpdatedToday === 1 ? "" : "es"}`} />
        </div>
      )}

      {data && data.recent.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary
            style={{
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
              opacity: 0.7,
            }}
          >
            Recent runs ({data.recent.length})
          </summary>
          <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <TableHead>Time</TableHead>
                <TableHead style={{ textAlign: "right" }}>Checked</TableHead>
                <TableHead style={{ textAlign: "right" }}>Updated</TableHead>
                <TableHead style={{ textAlign: "right" }}>Errors</TableHead>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((l) => (
                <LogRow key={l.id} log={l} />
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}

function LogRow({ log }: { log: DbCronLog }) {
  return (
    <tr>
      <TableCell style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
        {new Date(log.ran_at).toLocaleString("en-GB", { timeZone: "Europe/Brussels" })}
      </TableCell>
      <TableCell style={{ textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{log.checked}</TableCell>
      <TableCell style={{ textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{log.updated}</TableCell>
      <TableCell style={{ textAlign: "right", fontFamily: "JetBrains Mono, monospace", color: log.errors > 0 ? "#ff8a8a" : undefined }}>
        {log.errors}
      </TableCell>
    </tr>
  );
}

function Stat({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.6, fontWeight: 700, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{value}</div>
      {children}
    </div>
  );
}

function TableHead({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th
      style={{
        padding: "8px 10px",
        textAlign: "left",
        fontSize: 9,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        opacity: 0.6,
        borderBottom: "1px solid var(--line-soft)",
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function TableCell({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td
      style={{
        padding: "6px 10px",
        borderBottom: "1px solid var(--line-soft)",
        ...style,
      }}
    >
      {children}
    </td>
  );
}

function relTime(d: Date): string {
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/Brussels" });
}

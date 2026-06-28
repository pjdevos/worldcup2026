import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { TEAMS } from "../data/wk";
import { useIdentity, useProfile } from "../lib/identity";
import type { DbMatch, DbPrediction, Stage } from "../lib/database.types";
import { formatKickoff, isLocked } from "../lib/matchHelpers";
import { listMatches, listMyPredictions } from "../lib/queries";

const STAGE_ORDER: Stage[] = ["group", "r32", "r16", "qf", "sf", "third", "final"];
const STAGE_LABEL: Record<Stage, string> = {
  group: "Group stage",
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter-finals",
  sf: "Semi-finals",
  third: "3rd place",
  final: "Final",
};

const stageHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "12px 2px 6px",
  color: "rgba(255,255,255,0.6)",
  font: "inherit",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

const stageCount: React.CSSProperties = {
  fontSize: 9,
  fontFamily: "JetBrains Mono, monospace",
  letterSpacing: "0.05em",
  fontWeight: 600,
  color: "rgba(255,255,255,0.6)",
  background: "rgba(255,255,255,0.08)",
  padding: "1px 6px",
  borderRadius: 3,
};

export function ProfilePage() {
  const identity = useIdentity();
  const { data: profile } = useProfile();
  const userId = identity?.userId;

  const predictionsQ = useQuery<DbPrediction[]>({
    queryKey: ["my-predictions", userId ?? "anon"],
    queryFn: () => (userId ? listMyPredictions(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
  });

  const matchesQ = useQuery<DbMatch[]>({
    queryKey: ["matches"],
    queryFn: listMatches,
  });

  const matchesById = new Map((matchesQ.data ?? []).map((m) => [m.id, m]));
  const predictions = (predictionsQ.data ?? []).filter((p) => matchesById.has(p.match_id));

  const totalPoints = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0);
  const scoredCount = predictions.filter((p) => p.points !== null).length;

  // Group predictions by stage under collapsible headers (group stage folds
  // away by default, mirroring the calendar).
  const rows = predictions
    .map((p) => ({ pred: p, match: matchesById.get(p.match_id)! }))
    .sort((a, b) => a.match.kick_at.localeCompare(b.match.kick_at));
  const buckets = STAGE_ORDER.map((stage) => ({
    stage,
    items: rows.filter((r) => r.match.stage === stage),
  })).filter((b) => b.items.length > 0);

  const [openStages, setOpenStages] = useState<Set<Stage>>(
    () => new Set(STAGE_ORDER.filter((s) => s !== "group")),
  );
  const toggleStage = (stage: Stage) =>
    setOpenStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });

  return (
    <>
      <div className="section" style={{ marginBottom: 24 }}>
        <div className="section-head">
          <h2>{profile?.display_name ?? identity?.name ?? "—"}</h2>
          <div className="hint">
            {profile?.team_name ? `Team: ${profile.team_name} · ` : ""}
            {predictions.length} prediction{predictions.length === 1 ? "" : "s"}
            {scoredCount > 0 && ` · ${scoredCount} scored · `}
            {scoredCount > 0 && (
              <b style={{ color: "var(--fari-mint)" }}>{totalPoints} point{totalPoints === 1 ? "" : "s"}</b>
            )}
          </div>
        </div>
      </div>

      <div className="section" style={{ marginBottom: 24 }}>
        <div className="section-head">
          <h2 style={{ fontSize: 18 }}>Tournament picks</h2>
          <div className="hint">
            Locks at the opening match. Edit on the{" "}
            <Link to="/schedule?tab=calendar" style={{ color: "var(--fari-mint)" }}>
              Calendar
            </Link>
            .
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          <PickCard
            label="Top scorer"
            value={profile?.top_scorer ?? null}
            empty="not picked yet"
            footnote="Worth 25 points if correct"
          />
          <PickCard
            label="Belgium goals (tiebreaker)"
            value={
              profile?.tiebreaker_bel_goals != null
                ? `${profile.tiebreaker_bel_goals} goal${
                    profile.tiebreaker_bel_goals === 1 ? "" : "s"
                  }`
                : null
            }
            empty="no guess yet"
            footnote="Used only to break a tied leaderboard"
          />
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2 style={{ fontSize: 18 }}>My predictions</h2>
        </div>
        {predictionsQ.isLoading || matchesQ.isLoading ? (
          <div className="hint">Loading…</div>
        ) : predictions.length === 0 ? (
          <div className="hint">
            You haven't made any predictions yet.{" "}
            <Link to="/schedule" style={{ color: "var(--fari-mint)" }}>
              Go to the schedule →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {buckets.map(({ stage, items }) => {
              const open = openStages.has(stage);
              return (
                <div key={stage}>
                  <button
                    type="button"
                    onClick={() => toggleStage(stage)}
                    aria-expanded={open}
                    style={stageHeader}
                  >
                    <span style={{ fontSize: 9, width: 9, textAlign: "center" }}>
                      {open ? "▾" : "▸"}
                    </span>
                    <span style={{ flex: 1, textAlign: "left" }}>
                      {STAGE_LABEL[stage]}
                    </span>
                    <span style={stageCount}>{items.length}</span>
                  </button>
                  {open && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        marginTop: 2,
                      }}
                    >
                      {items.map(({ pred, match }) => (
                        <PredictionRow key={pred.id} pred={pred} match={match} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function PickCard({
  label,
  value,
  empty,
  footnote,
}: {
  label: string;
  value: string | null;
  empty: string;
  footnote: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.045)",
        border: "1px solid var(--line-soft)",
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.6)",
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          fontFamily: "JetBrains Mono, monospace",
          marginBottom: 6,
          opacity: value ? 1 : 0.45,
        }}
      >
        {value ?? empty}
      </div>
      <div style={{ fontSize: 11, opacity: 0.55 }}>{footnote}</div>
    </div>
  );
}

function PredictionRow({ pred, match }: { pred: DbPrediction; match: DbMatch }) {
  const kick = formatKickoff(match.kick_at);
  const locked = isLocked(match.kick_at);
  const finished = match.status === "FINISHED";

  return (
    <Link
      to={`/predict/${match.id}`}
      className="match"
      style={{
        textDecoration: "none",
        color: "inherit",
        gridTemplateColumns: "90px 1fr 80px 80px",
      }}
    >
      <div className="kick-cell">
        <div className="kick" style={{ fontSize: 14 }}>{kick.time}</div>
        <div className="kick-tag">{kick.date}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontWeight: 600 }}>
          {nameOf(match.home_team, match.home_slot)} — {nameOf(match.away_team, match.away_slot)}
        </span>
        <span style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
          M{match.id} · {match.stage === "group" ? `Group ${match.group_id}` : match.stage.toUpperCase()}
        </span>
      </div>
      <div
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 16,
          textAlign: "center",
          opacity: locked ? 0.85 : 1,
        }}
      >
        {pred.home_score}–{pred.away_score}
        {!locked && (
          <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            editable
          </div>
        )}
        {locked && !finished && (
          <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            🔒 locked
          </div>
        )}
      </div>
      <div style={{ textAlign: "right" }}>
        {finished ? (
          <>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14 }}>
              {match.home_score}–{match.away_score}
            </div>
            {pred.points !== null && (
              <div style={{ fontSize: 13, color: "var(--fari-mint)", fontWeight: 700, marginTop: 2 }}>
                +{pred.points}
              </div>
            )}
          </>
        ) : (
          <span style={{ fontSize: 10, opacity: 0.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            upcoming
          </span>
        )}
      </div>
    </Link>
  );
}

function nameOf(code: string | null, slot: string | null): string {
  if (code && TEAMS[code]) return TEAMS[code].name;
  return slot ?? "TBD";
}

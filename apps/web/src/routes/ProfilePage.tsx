import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { TEAMS } from "../data/wk";
import { useAuth, useProfile } from "../lib/auth";
import type { DbMatch, DbPrediction } from "../lib/database.types";
import { formatKickoff, isLocked } from "../lib/matchHelpers";
import { listMatches, listMyPredictions } from "../lib/queries";

export function ProfilePage() {
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const userId = session?.user.id;

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

  return (
    <>
      <div className="section" style={{ marginBottom: 24 }}>
        <div className="section-head">
          <h2>{profile?.display_name ?? session?.user.email}</h2>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {predictions
              .map((p) => ({ pred: p, match: matchesById.get(p.match_id)! }))
              .sort((a, b) => a.match.kick_at.localeCompare(b.match.kick_at))
              .map(({ pred, match }) => (
                <PredictionRow key={pred.id} pred={pred} match={match} />
              ))}
          </div>
        )}
      </div>
    </>
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

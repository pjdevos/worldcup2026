import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import type { DbMatch, DbPrediction } from "../lib/database.types";
import {
  formatKickoff,
  isFinished,
  isLocked,
  resolveSide,
} from "../lib/matchHelpers";
import { getMatch, getMyPrediction, upsertPrediction } from "../lib/queries";

export function PredictPage() {
  const { matchId: matchIdRaw } = useParams();
  const { session } = useAuth();
  const matchId = Number(matchIdRaw);

  if (!Number.isInteger(matchId) || matchId < 1 || matchId > 104) {
    return <Navigate to="/schedule" replace />;
  }

  const { data: match, isLoading } = useQuery<DbMatch | null>({
    queryKey: ["match", matchId],
    queryFn: () => getMatch(matchId),
  });

  const userId = session?.user.id;
  const { data: existing } = useQuery<DbPrediction | null>({
    queryKey: ["prediction", matchId, userId ?? "anon"],
    queryFn: () => (userId ? getMyPrediction(userId, matchId) : Promise.resolve(null)),
    enabled: Boolean(userId),
  });

  if (isLoading) return <div className="section">Laden…</div>;
  if (!match) {
    return (
      <div className="section">
        <div className="section-head">
          <h2>Wedstrijd niet gevonden</h2>
          <Link to="/schedule" className="hint">
            ← terug naar het speelschema
          </Link>
        </div>
      </div>
    );
  }

  return <PredictForm match={match} existing={existing ?? null} />;
}

function PredictForm({
  match,
  existing,
}: {
  match: DbMatch;
  existing: DbPrediction | null;
}) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const [home, setHome] = useState(existing?.home_score ?? 0);
  const [away, setAway] = useState(existing?.away_score ?? 0);
  const [now, setNow] = useState(() => new Date());

  // Refresh "now" every 30s so the lock state goes live without a reload.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const locked = isLocked(match.kick_at, now);
  const finished = isFinished(match);
  const kick = formatKickoff(match.kick_at);
  const homeSide = resolveSide(match.home_team, match.home_slot);
  const awaySide = resolveSide(match.away_team, match.away_slot);

  const save = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("Niet ingelogd");
      await upsertPrediction(session.user.id, match.id, home, away);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["prediction", match.id] });
      void qc.invalidateQueries({ queryKey: ["my-predictions"] });
    },
  });

  const cantPredict = homeSide.isPlaceholder || awaySide.isPlaceholder;

  return (
    <div className="section" style={{ maxWidth: 640, margin: "20px auto" }}>
      <div className="section-head">
        <Link
          to="/schedule"
          className="hint"
          style={{ textDecoration: "none", color: "var(--fari-mint)" }}
        >
          ← terug
        </Link>
        <h2>Voorspel deze wedstrijd</h2>
        <div className="hint">
          M{match.id} · {kick.full} (Brussel) · {match.stage === "group" ? `Groep ${match.group_id}` : match.stage.toUpperCase()}
        </div>
      </div>

      <div className={`match ${match.home_team === "BEL" || match.away_team === "BEL" ? "is-belgium" : ""}`} style={{ padding: 24, marginBottom: 22 }}>
        <SideBig team={homeSide} score={finished ? match.home_score : home} editable={!locked && !finished && !cantPredict} onChange={setHome} />
        <div className="vs" style={{ fontSize: 14 }}>—</div>
        <SideBig team={awaySide} score={finished ? match.away_score : away} editable={!locked && !finished && !cantPredict} onChange={setAway} alignRight />
      </div>

      {cantPredict && (
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
          ⚠ Deze knock-out match heeft nog geen vaste deelnemers — voorspellingen kunnen pas
          ingevuld worden zodra de poulestand vastligt.
        </div>
      )}

      {finished && (
        <div style={{ fontSize: 13, marginBottom: 16, opacity: 0.85 }}>
          ⚑ Eindstand: <b>{match.home_score}–{match.away_score}</b>.
          {existing && (
            <>
              {" "}Jouw voorspelling: <b>{existing.home_score}–{existing.away_score}</b>
              {existing.points !== null && (
                <> · <span style={{ color: "var(--fari-mint)" }}>{existing.points} punt{existing.points === 1 ? "" : "en"}</span></>
              )}
            </>
          )}
        </div>
      )}

      {!finished && locked && (
        <div style={{ fontSize: 13, marginBottom: 16, opacity: 0.85 }}>
          🔒 Voorspellingen voor deze wedstrijd zijn gesloten.
          {existing
            ? <> Jouw inzet: <b>{existing.home_score}–{existing.away_score}</b>.</>
            : <> Je hebt geen voorspelling ingevuld (telt als 0–0).</>}
        </div>
      )}

      {!finished && !locked && !cantPredict && (
        <>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.6, marginBottom: 10 }}>
            Slot dicht: {Math.max(0, Math.round((new Date(match.kick_at).getTime() - now.getTime() - 5 * 60 * 1000) / 60_000))} min
          </div>
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="tab is-active"
            style={{ padding: "10px 24px", cursor: save.isPending ? "wait" : "pointer", opacity: save.isPending ? 0.7 : 1 }}
          >
            {save.isPending
              ? "Opslaan…"
              : existing
              ? "Voorspelling bijwerken"
              : "Voorspelling opslaan"}
          </button>
          {save.isError && (
            <div style={{ color: "#ff8a8a", fontSize: 12, marginTop: 8 }}>
              {save.error instanceof Error ? save.error.message : String(save.error)}
            </div>
          )}
          {save.isSuccess && (
            <div style={{ color: "var(--fari-mint-bright)", fontSize: 12, marginTop: 8 }}>
              Opgeslagen.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SideBig({
  team,
  score,
  editable,
  onChange,
  alignRight,
}: {
  team: { code: string; name: string; flag: string; isPlaceholder: boolean };
  score: number | null;
  editable: boolean;
  onChange?: (v: number) => void;
  alignRight?: boolean;
}) {
  return (
    <div
      className={`team ${alignRight ? "right" : ""}`}
      style={{ gap: 16, fontSize: 16 }}
    >
      {!alignRight && (
        <span className="flag" style={{ width: 44, height: 32, fontSize: 13 }}>
          {team.code}
        </span>
      )}
      <span style={{ minWidth: 0, flex: 1, textAlign: alignRight ? "right" : "left" }}>
        <div className="name" style={{ fontSize: 18 }}>{team.name}</div>
      </span>
      {editable && onChange ? (
        <Stepper value={score ?? 0} onChange={onChange} />
      ) : (
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 32,
            fontWeight: 700,
            minWidth: 40,
            textAlign: "center",
            opacity: score === null ? 0.4 : 1,
          }}
        >
          {score ?? "–"}
        </span>
      )}
      {alignRight && (
        <span className="flag" style={{ width: 44, height: 32, fontSize: 13 }}>
          {team.code}
        </span>
      )}
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        style={stepperBtn}
        aria-label="minder"
      >
        −
      </button>
      <span
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 32,
          fontWeight: 700,
          width: 44,
          textAlign: "center",
        }}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(30, value + 1))}
        style={stepperBtn}
        aria-label="meer"
      >
        +
      </button>
    </div>
  );
}

const stepperBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid var(--line-soft)",
  borderRadius: 8,
  width: 32,
  height: 32,
  cursor: "pointer",
  color: "white",
  font: "inherit",
  fontSize: 18,
  fontWeight: 700,
  lineHeight: 1,
};

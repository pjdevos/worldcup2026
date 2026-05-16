import { useEffect, useRef, useState } from "react";
import { TEAMS } from "../data/wk";
import type { DbPrediction } from "../lib/database.types";
import { parsePlaceholder } from "../lib/format";

export type StageLabel = "group" | "R32" | "R16" | "QF" | "SF" | "3/4" | "FINAL";

export interface MatchRowData {
  /** DB match id (1-104). Required for inline prediction saves. */
  id?: number;
  kick: string;
  group?: string | null;
  stage?: StageLabel;
  home: string;
  away: string;
  venue?: string;
}

export interface MatchRowProps {
  match: MatchRowData;
  /** The user's existing prediction for this match, if any. */
  prediction?: DbPrediction | null;
  /** Allow editing the scores inline. Pre-kickoff + logged-in only. */
  editable?: boolean;
  /** Called when the user changes their prediction (debounced upstream). */
  onSave?: (matchId: number, home: number, away: number) => void;
  /** When true, render the actual result (final score) read-only. */
  finishedHome?: number | null;
  finishedAway?: number | null;
}

const DOT_GOLD = "#f5c542";

function Team({
  id,
  side,
  withWinnerDot,
}: {
  id: string;
  side: "left" | "right";
  withWinnerDot: boolean;
}) {
  const t = TEAMS[id];
  const dot = withWinnerDot ? (
    <span
      title="Your predicted winner"
      style={{
        display: "inline-block",
        width: 12,
        height: 12,
        background: DOT_GOLD,
        borderRadius: "50%",
        flexShrink: 0,
        boxShadow: `0 0 0 2px rgba(245,197,66,0.25)`,
      }}
    />
  ) : null;

  if (t) {
    return (
      <div className={`team ${side === "right" ? "right" : ""}`}>
        {side === "right" && dot}
        <span className="flag" title={t.name}>
          {t.code}
        </span>
        <span style={{ minWidth: 0 }}>
          <div className="name">{t.name}</div>
          {t.host && (
            <div
              className="code"
              style={{ color: "var(--fari-mint)", fontWeight: 700 }}
            >
              HOST
            </div>
          )}
        </span>
        {side === "left" && dot}
      </div>
    );
  }
  return (
    <div className={`team placeholder ${side === "right" ? "right" : ""}`}>
      {side === "right" && dot}
      <span className="flag">?</span>
      <span style={{ minWidth: 0 }}>
        <div className="name">{parsePlaceholder(id)}</div>
        <div className="code">{id}</div>
      </span>
      {side === "left" && dot}
    </div>
  );
}

function Stepper({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <button
        type="button"
        disabled={disabled || value <= 0}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onChange(Math.max(0, value - 1));
        }}
        style={stepperBtn}
        aria-label="minder"
      >
        −
      </button>
      <span
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 22,
          fontWeight: 700,
          width: 28,
          textAlign: "center",
        }}
      >
        {value}
      </span>
      <button
        type="button"
        disabled={disabled || value >= 30}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onChange(Math.min(30, value + 1));
        }}
        style={stepperBtn}
        aria-label="meer"
      >
        +
      </button>
    </div>
  );
}

const stepperBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.10)",
  border: "1px solid var(--line-soft)",
  borderRadius: 6,
  width: 26,
  height: 26,
  cursor: "pointer",
  color: "white",
  font: "inherit",
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1,
  padding: 0,
};

export function MatchRow({
  match,
  prediction,
  editable,
  onSave,
  finishedHome,
  finishedAway,
}: MatchRowProps) {
  const isBel = match.home === "BEL" || match.away === "BEL";
  const isFinished = finishedHome != null && finishedAway != null;

  // Local optimistic state for the stepper.
  const [home, setHome] = useState<number>(prediction?.home_score ?? 0);
  const [away, setAway] = useState<number>(prediction?.away_score ?? 0);

  // Sync external prediction prop changes back into local state when the
  // saved row differs (e.g., another tab edited it, or initial load).
  useEffect(() => {
    setHome(prediction?.home_score ?? 0);
    setAway(prediction?.away_score ?? 0);
  }, [prediction?.id, prediction?.home_score, prediction?.away_score]);

  // Debounced save: 600ms after the last change.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<{ h: number; a: number } | null>(
    prediction ? { h: prediction.home_score, a: prediction.away_score } : null,
  );

  function bump(next: { h: number; a: number }) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (
        !lastSavedRef.current ||
        lastSavedRef.current.h !== next.h ||
        lastSavedRef.current.a !== next.a
      ) {
        lastSavedRef.current = next;
        if (match.id != null && onSave) onSave(match.id, next.h, next.a);
      }
    }, 600);
  }

  function changeHome(v: number) {
    setHome(v);
    bump({ h: v, a: away });
  }
  function changeAway(v: number) {
    setAway(v);
    bump({ h: home, a: v });
  }

  // Decide which side gets the gold "predicted winner" dot.
  const winnerSide: "home" | "away" | null = isFinished
    ? null // no dot needed once result is in
    : prediction
    ? prediction.home_score > prediction.away_score
      ? "home"
      : prediction.away_score > prediction.home_score
      ? "away"
      : null
    : editable
    ? home > away
      ? "home"
      : away > home
      ? "away"
      : null
    : null;

  return (
    <div className={`match ${isBel ? "is-belgium" : ""}`}>
      <div className="kick-cell">
        <div className="kick">{match.kick}</div>
      </div>
      <div className="grp-cell">
        {match.group && <span className="grp-pill">{match.group}</span>}
        {match.stage && match.stage !== "group" && (
          <span className="grp-pill stage">{match.stage}</span>
        )}
      </div>

      <Team id={match.home} side="left" withWinnerDot={winnerSide === "home"} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          minWidth: 0,
        }}
      >
        {isFinished ? (
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {finishedHome}–{finishedAway}
          </span>
        ) : editable ? (
          <>
            <Stepper value={home} onChange={changeHome} />
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
              }}
            >
              vs
            </span>
            <Stepper value={away} onChange={changeAway} />
          </>
        ) : prediction ? (
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 18,
              fontWeight: 700,
              opacity: 0.85,
            }}
          >
            🔒 {prediction.home_score}–{prediction.away_score}
          </span>
        ) : (
          <span className="vs">vs</span>
        )}
      </div>

      <Team id={match.away} side="right" withWinnerDot={winnerSide === "away"} />

      {match.venue && (
        <div className="venue-line">
          <span className="venue-pin">{match.venue}</span>
        </div>
      )}
    </div>
  );
}

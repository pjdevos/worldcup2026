import { Link } from "react-router-dom";
import { TEAMS } from "../data/wk";
import { parsePlaceholder } from "../lib/format";

export type StageLabel = "groep" | "R32" | "R16" | "KF" | "HF" | "3/4" | "FINALE";

export interface MatchRowData {
  /** DB match id (1-104). Used to link to /predict/:matchId. */
  id?: number;
  kick: string;
  group?: string | null;
  stage?: StageLabel;
  home: string;
  away: string;
  venue?: string;
}

function Team({ id, side }: { id: string; side: "left" | "right" }) {
  const t = TEAMS[id];
  if (t) {
    return (
      <div className={`team ${side === "right" ? "right" : ""}`}>
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
              GASTLAND
            </div>
          )}
        </span>
      </div>
    );
  }
  return (
    <div className={`team placeholder ${side === "right" ? "right" : ""}`}>
      <span className="flag">?</span>
      <span style={{ minWidth: 0 }}>
        <div className="name">{parsePlaceholder(id)}</div>
        <div className="code">{id}</div>
      </span>
    </div>
  );
}

export function MatchRow({ match }: { match: MatchRowData }) {
  const isBel = match.home === "BEL" || match.away === "BEL";
  const inner = (
    <>
      <div className="kick-cell">
        <div className="kick">{match.kick}</div>
        <div className="kick-tag">Brussel</div>
      </div>
      <div className="grp-cell">
        {match.group && <span className="grp-pill">G{match.group}</span>}
        {match.stage && match.stage !== "groep" && (
          <span className="grp-pill stage">{match.stage}</span>
        )}
      </div>
      <Team id={match.home} side="left" />
      <div className="vs">vs</div>
      <Team id={match.away} side="right" />
      {match.venue && (
        <div className="venue-line">
          <span className="venue-pin">{match.venue}</span>
        </div>
      )}
    </>
  );

  if (match.id != null) {
    return (
      <Link
        to={`/predict/${match.id}`}
        className={`match ${isBel ? "is-belgium" : ""}`}
        style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
      >
        {inner}
      </Link>
    );
  }

  return <div className={`match ${isBel ? "is-belgium" : ""}`}>{inner}</div>;
}

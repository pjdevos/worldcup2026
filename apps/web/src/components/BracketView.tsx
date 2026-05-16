import {
  FINAL,
  QF,
  R16,
  R32,
  SF,
  TEAMS,
  THIRD_PLACE,
  VENUES,
  type KnockoutTie,
} from "../data/wk";
import { fmtDate, parsePlaceholder } from "../lib/format";

function Side({ id }: { id: string }) {
  const t = TEAMS[id];
  if (t) {
    return (
      <div className="side">
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>{t.flag}</span>
          <span className="label">{t.name}</span>
        </span>
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            opacity: 0.6,
          }}
        >
          {t.code}
        </span>
      </div>
    );
  }
  return (
    <div className="side">
      <span className="label placeholder">{parsePlaceholder(id)}</span>
    </div>
  );
}

function Tie({ tie, isFinal }: { tie: KnockoutTie; isFinal?: boolean }) {
  return (
    <div className={`tie ${isFinal ? "final" : ""}`}>
      <div className="when">
        <span className="num">M{tie.n}</span>
        <span>
          {fmtDate(tie.date, { short: true })} · {tie.kick}
        </span>
      </div>
      <Side id={tie.left} />
      <div className="v">—</div>
      <Side id={tie.right} />
    </div>
  );
}

export function BracketView() {
  return (
    <div className="section">
      <div className="section-head">
        <h2>Knockout stage</h2>
        <div className="hint">32 teams · 32 matches · one month · one winner</div>
      </div>
      <div className="bracket-scroll">
        <div className="bracket">
          <div className="round-col">
            <h3>
              1/16 · <b>Round of 32</b>
            </h3>
            <div className="ties">
              {R32.map((t) => (
                <Tie key={t.n} tie={t} />
              ))}
            </div>
          </div>
          <div className="round-col">
            <h3>
              1/8 · <b>Round of 16</b>
            </h3>
            <div className="ties">
              {R16.map((t) => (
                <Tie key={t.n} tie={t} />
              ))}
            </div>
          </div>
          <div className="round-col">
            <h3>
              1/4 · <b>Quarter-finals</b>
            </h3>
            <div className="ties">
              {QF.map((t) => (
                <Tie key={t.n} tie={t} />
              ))}
            </div>
          </div>
          <div className="round-col">
            <h3>
              1/2 · <b>Semi-finals</b>
            </h3>
            <div className="ties">
              {SF.map((t) => (
                <Tie key={t.n} tie={t} />
              ))}
            </div>
          </div>
          <div className="round-col">
            <h3>
              <b>3rd place</b>
            </h3>
            <div className="ties">
              <Tie tie={THIRD_PLACE} />
            </div>
          </div>
          <div className="round-col">
            <h3 style={{ color: "var(--fari-mint)" }}>
              <b>FINAL</b>
            </h3>
            <div className="ties">
              <Tie tie={FINAL} isFinal />
            </div>
          </div>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 18 }}>16 host cities</h2>
        <div className="hint">11 in the US · 3 in Mexico · 2 in Canada</div>
      </div>
      <div className="venues">
        {VENUES.map((v) => (
          <div className="venue" key={v.city}>
            <div className="city">
              {v.city}{" "}
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 10,
                  color: "var(--fari-mint)",
                }}
              >
                {v.country}
              </span>
            </div>
            <div className="name">{v.name}</div>
            <div className="cap">
              capacity · <b>{v.cap.toLocaleString("en-GB")}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// WK 2026 — React components

const { useState, useMemo, useEffect } = React;
const W = window.WK;

// ─── Helpers ──────────────────────────────────────────────────────────
const MONTHS_NL = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const WEEKDAYS_NL = ["zo", "ma", "di", "wo", "do", "vr", "za"];

function fmtDate(iso, opts = {}) {
  const d = new Date(iso + "T12:00:00");
  const wd = WEEKDAYS_NL[d.getDay()];
  const day = d.getDate();
  const mo = MONTHS_NL[d.getMonth()];
  if (opts.short) return `${day} ${mo}`;
  if (opts.weekdayDay) return `${wd} ${day} ${mo}`;
  return `${wd} ${day} ${mo}`;
}
const FULL_WEEKDAYS_NL = {
  zo: "zondag", ma: "maandag", di: "dinsdag", wo: "woensdag",
  do: "donderdag", vr: "vrijdag", za: "zaterdag"
};
function fullWeekday(iso) {
  const wd = WEEKDAYS_NL[new Date(iso + "T12:00:00").getDay()];
  return FULL_WEEKDAYS_NL[wd];
}

function parsePlaceholder(p) {
  // "1A" / "2B" / "3A/B/C/D/F" / "W73" / "V101"
  if (/^[123][A-L]$/.test(p)) {
    const pos = p[0];const grp = p[1];
    const ord = pos === "1" ? "Winnaar" : pos === "2" ? "Tweede" : "Derde";
    return `${ord} Groep ${grp}`;
  }
  if (/^3[A-L\/]+$/.test(p)) {
    return `Beste 3de`;
  }
  if (/^W\d+$/.test(p)) return `Winnaar M${p.slice(1)}`;
  if (/^V\d+$/.test(p)) return `Verliezer M${p.slice(1)}`;
  return p;
}

// ─── Logo wordmark (official FARI mark, recoloured white for the dark bg) ──
function FariWordmark() {
  return (
    <div className="header-logo">
      <img className="fari-logo" src="assets/fari-logo-white.png"
           alt="FARi — AI for the Common Good · Brussels" />
    </div>);

}

// ─── Header & intro ───────────────────────────────────────────────────
function Header({ tz, onTzChange }) {
  return (
    <div className="header">
      <FariWordmark />
      <div className="header-title">
        <div className="eyebrow">Speelschema · 23ste FIFA Wereldbeker</div>
        <h1>WK 2026</h1>
      </div>
      <div className="header-meta">
        <strong>11 juni → 19 juli 2026</strong>
        <span>Canada · Mexico · VS</span>
        <span>48 landen · 104 wedstrijden</span>
        <span style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>
          Aftraptijden in {tz === "BE" ? "Brussel (CEST)" : "lokale tijd"}
        </span>
      </div>
    </div>);

}

function FactsRow() {
  return (
    <div className="facts">
      <div className="fact">
        <div className="k">Openingsmatch</div>
        <div className="v">Mexico — Zuid-Afrika</div>
        <div className="sub">do 11 juni · Estadio Banorte, Mexico-Stad</div>
      </div>
      <div className="fact">
        <div className="k">België · Groep G</div>
        <div className="v">EGY · IRN · NZL</div>
        <div className="sub">eerste match: ma 15 juni · Miami</div>
      </div>
      <div className="fact">
        <div className="k">Finale</div>
        <div className="v">zo 19 juli · 21:00</div>
        <div className="sub">MetLife Stadium, New York / New Jersey</div>
      </div>
      <div className="fact">
        <div className="k">Format</div>
        <div className="v">12 groepen · R32</div>
        <div className="sub">top 2 per groep + 8 beste derdes</div>
      </div>
    </div>);

}

// ─── Group card ───────────────────────────────────────────────────────
function GroupCard({ group, tweaks }) {
  return (
    <div className="group" data-group={group.id}>
      <div className="group-head">
        <div className="group-letter">Groep <b>{group.id}</b></div>
        <div className="group-cohort">{group.teams[0]}</div>
      </div>
      <ol>
        {group.teams.map((tid, i) => {
          const t = W.TEAMS[tid];
          const isHome = t.home && tweaks.highlightBelgium;
          return (
            <li key={tid} className={isHome ? "is-home" : ""}>
              <span className="pos">{group.id}{i + 1}</span>
              <span className="code-badge">{t.code}</span>
              <span className="country">
                {t.name}
                {t.host && <span className="host-badge">GASTLAND</span>}
              </span>
            </li>);

        })}
      </ol>
    </div>);

}

// ─── Match row ────────────────────────────────────────────────────────
function Team({ id, side }) {
  if (!id) return null;
  if (W.TEAMS[id]) {
    const t = W.TEAMS[id];
    return (
      <div className={`team ${side === "right" ? "right" : ""}`}>
        <span className="flag" title={t.name}>{t.code}</span>
        <span style={{ minWidth: 0 }}>
          <div className="name">{t.name}</div>
          {t.host && <div className="code" style={{ color: "var(--fari-mint)", fontWeight: 700 }}>GASTLAND</div>}
        </span>
      </div>);

  }
  return (
    <div className={`team placeholder ${side === "right" ? "right" : ""}`}>
      <span className="flag">?</span>
      <span style={{ minWidth: 0 }}>
        <div className="name">{parsePlaceholder(id)}</div>
        <div className="code">{id}</div>
      </span>
    </div>);

}

function Match({ match, dense, compact }) {
  const isBel = match.home === "BEL" || match.away === "BEL";
  return (
    <div className={`match ${isBel ? "is-belgium" : ""} ${compact ? "compact" : ""}`}>
      <div className="kick-cell">
        <div className="kick">{match.kick}</div>
        {!compact && <div className="kick-tag">Brussel</div>}
      </div>
      <div className="grp-cell">
        {match.group && <span className="grp-pill">G{match.group}</span>}
        {match.stage && match.stage !== "groep" && <span className="grp-pill stage">{match.stage}</span>}
      </div>
      <Team id={match.home} side="left" />
      <div className="vs">vs</div>
      <Team id={match.away} side="right" />
      {!compact && match.venue &&
      <div className="venue-line">
          <span className="venue-pin">{match.venue}</span>
        </div>
      }
    </div>);

}

// ─── Groups section ───────────────────────────────────────────────────
function GroupsView({ tweaks }) {
  return (
    <div className="section">
      <div className="section-head">
        <h2>De twaalf poules</h2>
        <div className="hint">geselecteerd via de loting op 5 dec 2025 · Washington D.C.</div>
      </div>
      <div className="legend">
        <span className="chip"><span className="swatch host"></span> gastland (vooraf geplaatst)</span>
        <span className="chip"><span className="swatch"></span> België</span>
        <span className="chip"><span className="swatch placeholder"></span> de top-2 + 8 beste derdes plaatsen zich</span>
      </div>
      <div className="groups">
        {W.GROUPS.map((g) => <GroupCard key={g.id} group={g} tweaks={tweaks} />)}
      </div>
    </div>);

}

// ─── Calendar view ────────────────────────────────────────────────────
function CalendarView({ tweaks }) {
  // Build a flat list of every match across stages
  const allMatches = useMemo(() => {
    const list = [];
    W.GROUP_STAGE.forEach((m) => list.push({ ...m, stage: "groep" }));
    W.R32.forEach((m) => list.push({ ...m, stage: "R32", group: null }));
    W.R16.forEach((m) => list.push({ ...m, stage: "R16", group: null }));
    W.QF.forEach((m) => list.push({ ...m, stage: "KF", group: null }));
    W.SF.forEach((m) => list.push({ ...m, stage: "HF", group: null }));
    list.push({ ...W.THIRD_PLACE, stage: "3/4", group: null });
    list.push({ ...W.FINAL, stage: "FINALE", group: null });
    return list;
  }, []);

  // Group by date
  const days = useMemo(() => {
    const map = new Map();
    allMatches.forEach((m) => {
      const k = m.date;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(m);
    });
    const arr = Array.from(map.entries()).map(([date, matches]) => ({ date, matches }));
    arr.sort((a, b) => a.date.localeCompare(b.date));
    arr.forEach((d) => d.matches.sort((a, b) => a.kick.localeCompare(b.kick)));
    return arr;
  }, [allMatches]);

  const [activeDate, setActiveDate] = useState(days[0]?.date);

  // Group days by stage label for sidebar
  const stageOf = (date) => {
    if (date <= "2026-06-27") return "Groepsfase";
    if (date <= "2026-07-04") return "Achtste van 32";
    if (date <= "2026-07-07") return "Achtste finale";
    if (date <= "2026-07-11") return "Kwartfinale";
    if (date <= "2026-07-15") return "Halve finale";
    if (date <= "2026-07-18") return "Plek 3/4";
    return "Finale";
  };

  const grouped = useMemo(() => {
    const out = [];
    let curStage = null;
    days.forEach((d) => {
      const s = stageOf(d.date);
      if (s !== curStage) {out.push({ stage: s, days: [] });curStage = s;}
      out[out.length - 1].days.push(d);
    });
    return out;
  }, [days]);

  const active = days.find((d) => d.date === activeDate);
  const stage = active ? stageOf(active.date) : "";

  return (
    <div className="section">
      <div className="section-head">
        <h2>Volledige speelkalender</h2>
        <div className="hint">{days.length} speeldagen · 104 wedstrijden · alle aftraptijden in Brusselse tijd</div>
      </div>
      <div className="calendar">
        <div className="cal-sidebar">
          {grouped.map((blk, i) =>
          <React.Fragment key={i}>
              <div className="stage-label">{blk.stage}</div>
              {blk.days.map((d) =>
            <button
              key={d.date}
              className={`cal-day-btn ${d.date === activeDate ? "is-active" : ""}`}
              onClick={() => setActiveDate(d.date)}>
              
                  <span>{fmtDate(d.date, { weekdayDay: true })}</span>
                  <span className="cnt">{d.matches.length}</span>
                </button>
            )}
            </React.Fragment>
          )}
        </div>
        <div className="cal-day">
          {active &&
          <React.Fragment>
              <div className="cal-day-head">
                <div className="date-big">{fmtDate(active.date, { short: true })}</div>
                <div>
                  <div className="date-sub" style={{ textTransform: "capitalize" }}>
                    {fullWeekday(active.date)}
                  </div>
                </div>
                <div className="stage-pill">{stage}</div>
              </div>
              <div>
                {active.matches.map((m, i) =>
              <Match key={i} match={m} compact={tweaks.density === "compact"} />
              )}
              </div>
            </React.Fragment>
          }
        </div>
      </div>
    </div>);

}

// ─── Bracket / Knock-out ──────────────────────────────────────────────
function Tie({ tie, isFinal }) {
  return (
    <div className={`tie ${isFinal ? "final" : ""}`}>
      <div className="when">
        <span className="num">M{tie.n}</span>
        <span>{fmtDate(tie.date, { short: true })} · {tie.kick}</span>
      </div>
      <Side id={tie.left} />
      <div className="v">—</div>
      <Side id={tie.right} />
    </div>);

}
function Side({ id }) {
  const t = W.TEAMS[id];
  return (
    <div className="side">
      {t ?
      <React.Fragment>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>{t.flag}</span>
            <span className="label">{t.name}</span>
          </span>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, opacity: 0.6 }}>{t.code}</span>
        </React.Fragment> :

      <span className="label placeholder">{parsePlaceholder(id)}</span>
      }
    </div>);

}

function BracketView() {
  // Build the 5-column bracket. We display R32 (16), R16 (8), QF (4), SF (2), Final (1) + 3rd place
  return (
    <div className="section">
      <div className="section-head">
        <h2>Knock-outfase</h2>
        <div className="hint">32 teams · 32 wedstrijden · één maand · één winnaar</div>
      </div>
      <div className="bracket-scroll">
        <div className="bracket">
          <div className="round-col">
            <h3>1/16 · <b>Achtste van 32</b></h3>
            <div className="ties">{W.R32.map((t) => <Tie key={t.n} tie={t} />)}</div>
          </div>
          <div className="round-col">
            <h3>1/8 · <b>Achtste finale</b></h3>
            <div className="ties">{W.R16.map((t) => <Tie key={t.n} tie={t} />)}</div>
          </div>
          <div className="round-col">
            <h3>1/4 · <b>Kwartfinale</b></h3>
            <div className="ties">{W.QF.map((t) => <Tie key={t.n} tie={t} />)}</div>
          </div>
          <div className="round-col">
            <h3>1/2 · <b>Halve finale</b></h3>
            <div className="ties">{W.SF.map((t) => <Tie key={t.n} tie={t} />)}</div>
          </div>
          <div className="round-col">
            <h3><b>Plek 3/4</b></h3>
            <div className="ties"><Tie tie={W.THIRD_PLACE} /></div>
          </div>
          <div className="round-col">
            <h3 style={{ color: "var(--fari-mint)" }}><b>FINALE</b></h3>
            <div className="ties"><Tie tie={W.FINAL} isFinal /></div>
          </div>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 18 }}>16 gaststeden</h2>
        <div className="hint">11 in de VS · 3 in Mexico · 2 in Canada</div>
      </div>
      <div className="venues">
        {W.VENUES.map((v) =>
        <div className="venue" key={v.city}>
            <div className="city">{v.city} <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--fari-mint)" }}>{v.country}</span></div>
            <div className="name">{v.name}</div>
            <div className="cap">capaciteit · <b>{v.cap.toLocaleString("nl-BE")}</b></div>
          </div>
        )}
      </div>
    </div>);

}

// ─── Footer (FARI style) ──────────────────────────────────────────────
function Footer() {
  return (
    <div className="footer">
      <div className="left">An Initiative of</div>
      <div className="partner"><span className="logo-plate">ULB</span><span className="logo-plate">VUB</span></div>
      <div className="pipe"></div>
      <div className="left">Supported by</div>
      <div className="partner"><span className="logo-plate">Brussels-Capital Region</span><span className="logo-plate">Co-funded by the EU</span></div>
      <div className="fari-mark">
        <img src="assets/fari-logo.png" alt="FARI — AI for the Common Good Institute Brussels" />
      </div>
    </div>);

}

// ─── Tabs ─────────────────────────────────────────────────────────────
function Tabs({ value, onChange }) {
  const items = [
  { id: "groups", label: "Poules" },
  { id: "calendar", label: "Speelkalender" },
  { id: "bracket", label: "Knock-out" }];

  return (
    <div className="tabs">
      {items.map((it) =>
      <button
        key={it.id}
        className={`tab ${value === it.id ? "is-active" : ""}`}
        onClick={() => onChange(it.id)}>
        {it.label}</button>
      )}
    </div>);

}

Object.assign(window, {
  Header, FactsRow, Tabs, GroupsView, CalendarView, BracketView, Footer
});
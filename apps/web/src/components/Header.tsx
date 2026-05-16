export function Header() {
  return (
    <div className="header">
      <div className="header-logo">
        <img
          className="fari-logo"
          src="/logo-voetbal.png"
          alt="FARI — AI for the Common Good · Brussels (World Cup 2026 edition)"
        />
      </div>
      <div className="header-title">
        <div className="eyebrow">Schedule · 23rd FIFA World Cup</div>
        <h1>World Cup 2026</h1>
      </div>
      <div className="header-meta">
        <strong>11 June → 19 July 2026</strong>
        <span>Canada · Mexico · USA</span>
        <span>48 nations · 104 matches</span>
        <span style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>
          Kickoff times in Brussels (CEST)
        </span>
      </div>
    </div>
  );
}

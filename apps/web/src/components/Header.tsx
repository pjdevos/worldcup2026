export function Header() {
  return (
    <div className="header">
      <div className="header-logo">
        <img
          className="fari-logo"
          src="/logo-voetbal.png"
          alt="FARI — AI for the Common Good · Brussels (WK 2026 editie)"
        />
      </div>
      <div className="header-title">
        <div className="eyebrow">Speelschema · 23ste FIFA Wereldbeker</div>
        <h1>WK 2026</h1>
      </div>
      <div className="header-meta">
        <strong>11 juni → 19 juli 2026</strong>
        <span>Canada · Mexico · VS</span>
        <span>48 landen · 104 wedstrijden</span>
        <span style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>
          Aftraptijden in Brussel (CEST)
        </span>
      </div>
    </div>
  );
}

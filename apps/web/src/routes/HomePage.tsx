import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function HomePage() {
  const { session } = useAuth();

  return (
    <>
      <Hero session={Boolean(session)} />
      <FactsStrip />
      <BrandStrip />
    </>
  );
}

function Hero({ session }: { session: boolean }) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        alignItems: "center",
        gap: 48,
        padding: "44px 0 24px",
        minHeight: 460,
      }}
    >
      {/* Left: copy + CTAs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div
          className="eyebrow"
          style={{
            fontSize: 11,
            letterSpacing: "0.22em",
            color: "var(--fari-mint)",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          23ste FIFA Wereldbeker · pronostiek
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(64px, 9vw, 116px)",
            fontWeight: 800,
            letterSpacing: "-0.05em",
            lineHeight: 0.92,
          }}
        >
          WK 2026
        </h1>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 15,
            color: "rgba(255,255,255,0.85)",
            maxWidth: 460,
          }}
        >
          <strong style={{ color: "white", fontSize: 17, fontWeight: 700 }}>
            11 juni → 19 juli 2026
          </strong>
          <span>Canada · Mexico · Verenigde Staten</span>
          <span style={{ opacity: 0.75 }}>
            48 landen · 104 wedstrijden · 5 weken voetbal
          </span>
        </div>

        <p
          style={{
            margin: "8px 0 0",
            fontSize: 14,
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.7)",
            maxWidth: 500,
          }}
        >
          Voorspel elke wedstrijd, vul je knock-out bracket in en strijd met je
          FARI-collega's om de eerste plaats in het klassement.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 8,
          }}
        >
          <Link to="/schedule" style={ctaPrimary}>
            Naar speelschema
            <Arrow />
          </Link>
          <Link
            to={session ? "/profile" : "/login"}
            style={ctaSecondary}
          >
            {session ? "Mijn pronostieken" : "Inloggen om te beginnen"}
            <Arrow />
          </Link>
        </div>
      </div>

      {/* Right: trophy hero mark */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "8% 14%",
            background:
              "radial-gradient(closest-side, rgba(91,227,197,0.25), rgba(91,227,197,0) 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        />
        <img
          src="/fari-world-cup-2026.png"
          alt="WK 2026 — FARI pronostiek"
          style={{
            position: "relative",
            maxHeight: 480,
            width: "auto",
            maxWidth: "100%",
            filter: "drop-shadow(0 24px 50px rgba(0,0,0,0.55))",
          }}
        />
      </div>
    </section>
  );
}

function FactsStrip() {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 0,
        margin: "32px 0 40px",
        borderTop: "1px solid var(--line-soft)",
        borderBottom: "1px solid var(--line-soft)",
      }}
    >
      <Fact
        k="Openingsmatch"
        v="Mexico — Zuid-Afrika"
        sub="do 11 juni · Estadio Banorte, Mexico-Stad"
        first
      />
      <Fact
        k="België · Groep G"
        v="EGY · IRN · NZL"
        sub="eerste match: ma 15 juni · Miami"
      />
      <Fact
        k="Finale"
        v="zo 19 juli · 21:00"
        sub="MetLife Stadium, New York / New Jersey"
      />
      <Fact
        k="Format"
        v="12 groepen · R32"
        sub="top 2 per groep + 8 beste derdes"
      />
    </section>
  );
}

function Fact({
  k,
  v,
  sub,
  first,
}: {
  k: string;
  v: string;
  sub: string;
  first?: boolean;
}) {
  return (
    <div
      style={{
        padding: "20px 0 20px 22px",
        borderLeft: first ? "none" : "1px solid var(--line-soft)",
        paddingLeft: first ? 0 : 22,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.6)",
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {k}
      </div>
      <div
        style={{
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
        }}
      >
        {v}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.7)",
          marginTop: 4,
          letterSpacing: "0.02em",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function BrandStrip() {
  return (
    <section
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "24px 0 36px",
        borderTop: "1px dashed rgba(255,255,255,0.10)",
        opacity: 0.92,
      }}
    >
      <img
        src="/logo-voetbal.png"
        alt="FARI · AI for the Common Good"
        style={{
          height: 72,
          width: "auto",
          borderRadius: 8,
        }}
      />
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.7)",
          fontWeight: 700,
          lineHeight: 1.6,
        }}
      >
        Een interne pronostiek
        <br />
        van het FARI-team
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ marginLeft: 8 }}
      aria-hidden
    >
      <path
        d="M1 7h11M7.5 2l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ctaPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 2,
  padding: "12px 22px",
  background: "var(--fari-mint)",
  color: "var(--fari-blue-deep)",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.02em",
  textDecoration: "none",
  textTransform: "none",
  transition: "transform 120ms ease, box-shadow 120ms ease",
  boxShadow: "0 8px 24px -10px rgba(47,212,176,0.6)",
};

const ctaSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 2,
  padding: "12px 22px",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid var(--line-soft)",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.02em",
  textDecoration: "none",
  transition: "background 120ms ease, border-color 120ms ease",
};

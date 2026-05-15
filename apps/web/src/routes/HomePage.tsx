import { Link } from "react-router-dom";
import { FactsRow } from "../components/FactsRow";
import { Header } from "../components/Header";
import { useAuth } from "../lib/auth";

export function HomePage() {
  const { session } = useAuth();

  return (
    <>
      <Header />
      <FactsRow />
      <div className="section" style={{ display: "grid", gap: 18 }}>
        <div className="section-head">
          <h2>Welkom op de FARI-pronostiek</h2>
          <div className="hint">
            Voorspel elke wedstrijd van de 23ste FIFA Wereldbeker en strijd met je collega's
            om de eerste plaats in het klassement.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          <Link to="/schedule" className="match" style={{ textDecoration: "none", cursor: "pointer" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="eyebrow" style={{ color: "var(--fari-mint)" }}>
                Speelschema
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                104 wedstrijden · 12 poules · 1 knock-out bracket
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                Bekijk poules, kalender en bracket →
              </div>
            </div>
          </Link>

          <Link
            to={session ? "/profile" : "/login"}
            className="match"
            style={{ textDecoration: "none", cursor: "pointer" }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="eyebrow" style={{ color: "var(--fari-mint)" }}>
                {session ? "Mijn pronostieken" : "Begin"}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                {session
                  ? "Vul je voorspellingen aan"
                  : "Log in met je e-mail om te beginnen"}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                {session ? "Beheer je voorspellingen →" : "Magische link, geen wachtwoord →"}
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}

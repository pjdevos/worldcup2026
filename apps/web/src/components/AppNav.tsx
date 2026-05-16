import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function AppNav() {
  const { playerName, signOut } = useAuth();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 14,
        paddingBottom: 18,
        gap: 18,
        flexWrap: "wrap",
      }}
    >
      <nav style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <Link
          to="/"
          style={{
            color: "white",
            textDecoration: "none",
            fontFamily: "JetBrains Mono, monospace",
            letterSpacing: "0.18em",
            fontSize: 10,
            textTransform: "uppercase",
            fontWeight: 700,
            opacity: 0.7,
          }}
        >
          ▸ Predictions
        </Link>
        <NavItem to="/schedule" label="Schedule" />
        <NavItem to="/leaderboard" label="Leaderboard" />
        {playerName && <NavItem to="/profile" label="My predictions" />}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
        {playerName ? (
          <>
            <span style={{ opacity: 0.7 }}>
              <span style={{ color: "var(--fari-mint)" }}>●</span> {playerName}
            </span>
            <button
              type="button"
              onClick={() => {
                signOut();
                window.location.href = "/";
              }}
              style={{
                background: "transparent",
                border: "1px solid var(--line-soft)",
                color: "white",
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="tab is-active"
            style={{ padding: "7px 16px", textDecoration: "none", fontSize: 12 }}
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        color: isActive ? "white" : "rgba(255,255,255,0.65)",
        textDecoration: "none",
        fontSize: 13,
        fontWeight: 600,
        borderBottom: isActive
          ? "2px solid var(--fari-mint)"
          : "2px solid transparent",
        paddingBottom: 2,
      })}
    >
      {label}
    </NavLink>
  );
}

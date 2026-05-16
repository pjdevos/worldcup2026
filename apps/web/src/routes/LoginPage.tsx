import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function LoginPage() {
  const { playerName, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (playerName) {
    const from = (location.state as { from?: string })?.from || "/";
    return <Navigate to={from} replace />;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!password) {
      setError("Please enter the password");
      return;
    }

    setStatus("submitting");

    // Simulate a small delay to feel more like a real submission
    await new Promise((resolve) => setTimeout(resolve, 300));

    const correctPassword = import.meta.env.VITE_APP_PASSWORD;
    if (!correctPassword) {
      setError("Password not configured");
      setStatus("error");
      return;
    }

    if (password !== correctPassword) {
      setError("Incorrect password");
      setStatus("error");
      return;
    }

    // Store the player name in localStorage
    localStorage.setItem("worldcup_player_name", name.trim());

    // Reload to pick up the new player name from localStorage
    const from = (location.state as { from?: string })?.from || "/";
    window.location.href = from;
  }

  return (
    <div className="section" style={{ maxWidth: 460, margin: "60px auto" }}>
      <div className="section-head">
        <h2>Sign in</h2>
        <div className="hint">Enter your name and the shared password to continue.</div>
      </div>

      <form
        onSubmit={submit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <div>
          <label
            htmlFor="name"
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
              opacity: 0.7,
              display: "block",
              marginBottom: 6,
            }}
          >
            Your name
          </label>
          <input
            id="name"
            type="text"
            required
            autoFocus
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={status === "submitting"}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid var(--line-soft)",
              borderRadius: 8,
              padding: "12px 14px",
              font: "inherit",
              color: "white",
              fontSize: 15,
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
              opacity: 0.7,
              display: "block",
              marginBottom: 6,
            }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            placeholder="Enter the password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={status === "submitting"}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid var(--line-soft)",
              borderRadius: 8,
              padding: "12px 14px",
              font: "inherit",
              color: "white",
              fontSize: 15,
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div style={{ color: "#ff8a8a", fontSize: 12 }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={status === "submitting" || !name.trim() || !password}
          className="tab is-active"
          style={{
            alignSelf: "flex-start",
            padding: "10px 22px",
            cursor: status === "submitting" ? "wait" : "pointer",
            opacity: status === "submitting" ? 0.7 : 1,
          }}
        >
          {status === "submitting" ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

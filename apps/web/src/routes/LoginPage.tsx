import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

export function LoginPage() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (err) {
      setError(err.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="section" style={{ maxWidth: 460, margin: "60px auto" }}>
      <div className="section-head">
        <h2>Sign in</h2>
        <div className="hint">
          We'll email you a magic link — no password needed.
        </div>
      </div>

      {status === "sent" ? (
        <div
          className="match"
          style={{
            display: "block",
            background: "rgba(47,212,176,0.12)",
            border: "1px solid rgba(47,212,176,0.5)",
            padding: 20,
          }}
        >
          <strong style={{ color: "var(--fari-mint-bright)" }}>Email sent.</strong>
          <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.85 }}>
            Click the link in your inbox ({email}) to sign in. Nothing received?
            Check your spam folder or try again.
          </p>
        </div>
      ) : (
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <label
            htmlFor="email"
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
              opacity: 0.7,
            }}
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            placeholder="you@fari.brussels"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid var(--line-soft)",
              borderRadius: 8,
              padding: "12px 14px",
              font: "inherit",
              color: "white",
              fontSize: 15,
            }}
          />
          {error && (
            <div style={{ color: "#ff8a8a", fontSize: 12 }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={status === "sending" || !email}
            className="tab is-active"
            style={{
              alignSelf: "flex-start",
              padding: "10px 22px",
              cursor: status === "sending" ? "wait" : "pointer",
              opacity: status === "sending" ? 0.7 : 1,
            }}
          >
            {status === "sending" ? "Sending…" : "Send magic link"}
          </button>
        </form>
      )}
    </div>
  );
}

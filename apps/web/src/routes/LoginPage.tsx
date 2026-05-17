import { useState, type FormEvent, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useIdentity, useIdentityActions } from "../lib/identity";

export function LoginPage() {
  const identity = useIdentity();
  const { login, loading } = useIdentityActions();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (identity) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(name, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="section" style={{ maxWidth: 460, margin: "60px auto" }}>
      <div className="section-head">
        <h2>Sign in</h2>
        <div className="hint">
          Enter your name and the shared FARI pool password.
        </div>
      </div>

      <form
        onSubmit={submit}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <Field label="Your name" required>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pieter-Jan"
            autoComplete="username"
            style={inputStyle}
          />
        </Field>
        <Field label="Pool password" required>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={inputStyle}
          />
        </Field>

        {error && (
          <div style={{ color: "#ff8a8a", fontSize: 12 }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim() || !password}
          className="tab is-active"
          style={{
            alignSelf: "flex-start",
            padding: "10px 22px",
            cursor: loading ? "wait" : "pointer",
            opacity: loading || !name.trim() || !password ? 0.6 : 1,
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 18, lineHeight: 1.5 }}>
        Use the same name on every visit — that's how your predictions are
        tracked. Type a fresh name to claim a new player slot.
      </p>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 700,
          opacity: 0.7,
        }}
      >
        {label}
        {required && <span style={{ color: "var(--fari-mint)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid var(--line-soft)",
  borderRadius: 8,
  padding: "12px 14px",
  font: "inherit",
  color: "white",
  fontSize: 15,
};

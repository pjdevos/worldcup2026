import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function OnboardingPage() {
  const { playerName, loading } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(playerName || "");
  const [teamName, setTeamName] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) return null;
  if (!playerName) return <Navigate to="/login" replace />;

  // If player already has a name (not just the default), skip onboarding
  if (playerName && playerName.trim()) {
    navigate("/", { replace: true });
    return null;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;

    setSaving(true);

    // Simulate a small delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Update the player name in localStorage
    localStorage.setItem("worldcup_player_name", displayName.trim());

    setSaving(false);

    // Reload to pick up the updated name
    window.location.href = "/";
  }

  return (
    <div className="section" style={{ maxWidth: 520, margin: "60px auto" }}>
      <div className="section-head">
        <h2>Welcome to the FARI prediction pool</h2>
        <div className="hint">
          Pick how you'd like to appear on the leaderboard.
        </div>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field
          label="Display name"
          required
          hint="Shown on the leaderboard."
        >
          <Input
            value={displayName}
            onChange={setDisplayName}
            placeholder="Your name"
            autoFocus
          />
        </Field>

        <button
          type="submit"
          disabled={saving || !displayName.trim()}
          className="tab is-active"
          style={{
            alignSelf: "flex-start",
            padding: "10px 22px",
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
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
      {hint && <span style={{ fontSize: 11, opacity: 0.6 }}>{hint}</span>}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
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
  );
}

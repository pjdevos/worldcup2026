import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth, useProfile } from "../lib/auth";
import { updateProfile } from "../lib/queries";

export function OnboardingPage() {
  const { session, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const defaultName =
    profile?.display_name ??
    session?.user.email?.split("@")[0] ??
    "";

  const [displayName, setDisplayName] = useState(defaultName);
  const [teamName, setTeamName] = useState(profile?.team_name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && profile.display_name && profile.display_name !== "") {
      const emailLocal = session?.user.email?.split("@")[0] ?? "";
      const hasRealName =
        profile.display_name !== emailLocal && profile.display_name.length > 0;
      if (hasRealName) navigate("/", { replace: true });
    }
  }, [profile, session, navigate]);

  if (authLoading || profileLoading) return null;
  if (!session) return <Navigate to="/login" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile(session.user.id, {
        display_name: displayName.trim(),
        team_name: teamName.trim() || null,
      });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      navigate("/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="section" style={{ maxWidth: 520, margin: "60px auto" }}>
      <div className="section-head">
        <h2>Welcome to the FARI prediction pool</h2>
        <div className="hint">
          Pick how you'd like to appear on the leaderboard. You can change this later.
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

        <Field
          label="Team (optional)"
          hint="e.g. 'Policy team', 'AI Lab' — for the FARI sub-team rankings."
        >
          <Input
            value={teamName}
            onChange={setTeamName}
            placeholder="No team"
          />
        </Field>

        {error && <div style={{ color: "#ff8a8a", fontSize: 12 }}>{error}</div>}

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

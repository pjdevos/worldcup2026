import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  TOP_SCORER_OPTIONS,
  TOURNAMENT_LOCK,
  isCanonicalTopScorer,
} from "../data/topScorers";
import { useIdentity, useProfile } from "../lib/identity";
import { updateTournamentPicks } from "../lib/queries";

const OTHER_SENTINEL = "__OTHER__";

export function TournamentPicks() {
  const identity = useIdentity();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const userId = identity?.userId;

  const [goals, setGoals] = useState<number>(profile?.tiebreaker_bel_goals ?? 0);
  const [scorer, setScorer] = useState<string>(profile?.top_scorer ?? "");
  const [otherMode, setOtherMode] = useState<boolean>(
    profile?.top_scorer !== null &&
      profile?.top_scorer !== undefined &&
      profile.top_scorer !== "" &&
      !isCanonicalTopScorer(profile.top_scorer),
  );

  // When the profile prop updates (initial load / external change), sync.
  useEffect(() => {
    if (profile) {
      setGoals(profile.tiebreaker_bel_goals ?? 0);
      setScorer(profile.top_scorer ?? "");
      setOtherMode(
        profile.top_scorer !== null &&
          profile.top_scorer !== "" &&
          !isCanonicalTopScorer(profile.top_scorer),
      );
    }
  }, [profile?.user_id, profile?.tiebreaker_bel_goals, profile?.top_scorer]);

  const save = useMutation({
    mutationFn: async (patch: {
      tiebreaker_bel_goals?: number | null;
      top_scorer?: string | null;
    }) => {
      if (!userId) throw new Error("Not signed in");
      await updateTournamentPicks(userId, patch);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  // Debounced save for each field — bundles rapid stepper / typing into one
  // upsert 600ms after the last change.
  const goalsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scorerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function changeGoals(next: number) {
    setGoals(next);
    if (goalsTimer.current) clearTimeout(goalsTimer.current);
    goalsTimer.current = setTimeout(() => {
      save.mutate({ tiebreaker_bel_goals: next });
    }, 600);
  }

  function changeScorer(next: string) {
    setScorer(next);
    if (scorerTimer.current) clearTimeout(scorerTimer.current);
    scorerTimer.current = setTimeout(() => {
      save.mutate({ top_scorer: next.trim() || null });
    }, 600);
  }

  const locked = new Date() >= TOURNAMENT_LOCK;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid var(--line-soft)",
        borderRadius: 14,
        padding: "18px 20px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--fari-mint)",
          }}
        >
          Tournament picks
        </h3>
        <span style={{ fontSize: 11, opacity: 0.65 }}>
          {locked
            ? "🔒 Locked since the opening match kicked off."
            : `Locks at the opening match · 11 Jun 21:00 Brussels${
                save.isSuccess && !save.isPending ? " · saved" : ""
              }${save.isPending ? " · saving…" : ""}`}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {/* Tiebreaker card */}
        <Card
          label="Tiebreaker"
          subLabel="Used only if the leaderboard ends tied"
        >
          <div style={{ fontSize: 13, marginBottom: 12, opacity: 0.85 }}>
            How many goals will <b>Belgium</b> score across the whole tournament?
          </div>
          {locked ? (
            <StaticValue
              value={
                profile?.tiebreaker_bel_goals !== null &&
                profile?.tiebreaker_bel_goals !== undefined
                  ? `${profile.tiebreaker_bel_goals} goal${
                      profile.tiebreaker_bel_goals === 1 ? "" : "s"
                    }`
                  : "—"
              }
            />
          ) : (
            <Stepper value={goals} onChange={changeGoals} max={50} />
          )}
        </Card>

        {/* Top scorer card */}
        <Card
          label="Top scorer"
          subLabel="Worth 25 points if correct"
        >
          {locked ? (
            <StaticValue value={profile?.top_scorer ?? "—"} />
          ) : (
            <TopScorerInput
              value={scorer}
              onChange={changeScorer}
              otherMode={otherMode}
              setOtherMode={setOtherMode}
            />
          )}
        </Card>
      </div>

      {save.isError && (
        <div style={{ color: "#ff8a8a", fontSize: 12, marginTop: 10 }}>
          {save.error instanceof Error ? save.error.message : String(save.error)}
        </div>
      )}
    </div>
  );
}

function Card({
  label,
  subLabel,
  children,
}: {
  label: string;
  subLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.045)",
        border: "1px solid var(--line-soft)",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.6)",
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {subLabel && (
        <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 10 }}>
          {subLabel}
        </div>
      )}
      {children}
    </div>
  );
}

function StaticValue({ value }: { value: string }) {
  return (
    <div
      style={{
        fontSize: 18,
        fontWeight: 700,
        fontFamily: "JetBrains Mono, monospace",
        opacity: 0.85,
      }}
    >
      {value}
    </div>
  );
}

function Stepper({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <button
        type="button"
        disabled={value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        style={stepperBtn}
        aria-label="decrease"
      >
        −
      </button>
      <span
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 28,
          fontWeight: 700,
          width: 44,
          textAlign: "center",
        }}
      >
        {value}
      </span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        style={stepperBtn}
        aria-label="increase"
      >
        +
      </button>
    </div>
  );
}

function TopScorerInput({
  value,
  onChange,
  otherMode,
  setOtherMode,
}: {
  value: string;
  onChange: (v: string) => void;
  otherMode: boolean;
  setOtherMode: (v: boolean) => void;
}) {
  const selectValue = otherMode ? OTHER_SENTINEL : value;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <select
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === OTHER_SENTINEL) {
            setOtherMode(true);
            onChange("");
          } else {
            setOtherMode(false);
            onChange(v);
          }
        }}
        style={inputStyle}
      >
        <option value="" style={optionStyle}>
          Pick a player…
        </option>
        {TOP_SCORER_OPTIONS.map((p) => (
          <option key={p} value={p} style={optionStyle}>
            {p}
          </option>
        ))}
        <option value={OTHER_SENTINEL} style={optionStyle}>
          Someone else…
        </option>
      </select>
      {otherMode && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Player name"
          maxLength={80}
          style={inputStyle}
        />
      )}
    </div>
  );
}

const stepperBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.10)",
  border: "1px solid var(--line-soft)",
  borderRadius: 6,
  width: 30,
  height: 30,
  cursor: "pointer",
  color: "white",
  font: "inherit",
  fontSize: 16,
  fontWeight: 700,
  lineHeight: 1,
  padding: 0,
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid var(--line-soft)",
  borderRadius: 8,
  padding: "10px 12px",
  font: "inherit",
  color: "white",
  fontSize: 14,
  width: "100%",
};

// The native dropdown popup (rendered by the browser, not our DOM) doesn't
// inherit the select's `background`, so it falls back to system colors —
// often white. Forcing a dark background + light text on each <option>
// makes the open list readable in our dark theme. Works in Chrome/Firefox/
// Edge; Safari ignores some of this but degrades to system default which
// is also readable.
const optionStyle: React.CSSProperties = {
  background: "#14306f", // var(--fari-blue-deep)
  color: "white",
};

import { useQuery } from "@tanstack/react-query";
import { useIdentity } from "../lib/identity";
import type { DbScoringRule } from "../lib/database.types";
import {
  getLeaderboard,
  listScoringRules,
  type LeaderboardRow,
} from "../lib/queries";

export function LeaderboardPage() {
  const identity = useIdentity();
  const { data, isLoading } = useQuery<LeaderboardRow[]>({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
  });

  const me = identity?.userId;

  return (
    <div className="section">
      <div className="section-head">
        <h2>Leaderboard</h2>
        <div className="hint">
          Total points across all played matches. Updates as soon as a match is finalised.
        </div>
      </div>

      {isLoading && <div className="hint">Loading…</div>}

      {data && data.length === 0 && (
        <div className="hint">
          Nobody on the board yet — add your predictions starting 11 June!
        </div>
      )}

      {data && data.length > 0 && (
        <Table data={data} me={me} />
      )}

      <RulesSection />
    </div>
  );
}

function Table({
  data,
  me,
}: {
  data: LeaderboardRow[];
  me: string | undefined;
}) {
  return (
    <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
          }}
        >
          <thead>
            <tr style={{ textAlign: "left" }}>
              <Th style={{ width: 60 }}>#</Th>
              <Th>Name</Th>
              <Th>Team</Th>
              <Th style={{ textAlign: "right", width: 80 }}>Scored</Th>
              <Th style={{ textAlign: "right", width: 80 }}>Bonus</Th>
              <Th style={{ textAlign: "right", width: 100 }}>Points</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const isMe = row.user_id === me;
              return (
                <tr
                  key={row.user_id}
                  style={{
                    background: isMe ? "rgba(47,212,176,0.10)" : undefined,
                  }}
                >
                  <Td style={{ fontFamily: "JetBrains Mono, monospace", color: i < 3 ? "var(--fari-mint)" : "rgba(255,255,255,0.65)" }}>
                    {i + 1}
                  </Td>
                  <Td style={{ fontWeight: 700 }}>{row.display_name}</Td>
                  <Td style={{ opacity: 0.7 }}>{row.team_name ?? "—"}</Td>
                  <Td style={{ textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{row.scored}</Td>
                  <Td
                    style={{
                      textAlign: "right",
                      fontFamily: "JetBrains Mono, monospace",
                      opacity: row.bonus_points > 0 ? 1 : 0.35,
                      color: row.bonus_points > 0 ? "var(--fari-mint)" : undefined,
                    }}
                    title={row.bonus_points > 0 ? "Tournament bonus (top scorer, etc.)" : ""}
                  >
                    {row.bonus_points > 0 ? `+${row.bonus_points}` : "—"}
                  </Td>
                  <Td
                    style={{
                      textAlign: "right",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 16,
                      fontWeight: 700,
                      color: i === 0 ? "var(--fari-mint-bright)" : "white",
                    }}
                  >
                    {row.points}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
  );
}

// ── Rules section ──────────────────────────────────────────────────────

function RulesSection() {
  const { data } = useQuery<DbScoringRule[]>({
    queryKey: ["scoring-rules"],
    queryFn: listScoringRules,
  });
  const map = new Map<string, number>((data ?? []).map((r) => [r.key, r.value]));
  const v = (k: string): string =>
    map.has(k) ? `${map.get(k)} pt` : "—";

  return (
    <section style={{ marginTop: 56 }}>
      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>Pool rules</h2>
      </div>

      <div
        style={{
          fontSize: 13,
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.82)",
          maxWidth: 760,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <p style={{ margin: 0 }}>
          Entry is <b style={{ color: "white" }}>€5</b> per player. Winner
          takes the pot — winner takes it all.
        </p>
        <p style={{ margin: 0 }}>
          <b style={{ color: "white" }}>Before the World Cup starts</b>, fill
          in all 72 group-stage matches. In this phase what mostly counts is
          who wins / draws / loses, who tops the group and finishes second,
          and who advances as one of the best thirds.
        </p>
        <p style={{ margin: 0 }}>
          <b style={{ color: "white" }}>
            After the last group match and before the first Round-of-32 fixture
          </b>
          , fill in the entire knockout bracket.
        </p>
        <p style={{ margin: 0 }}>
          <b style={{ color: "white" }}>Tiebreakers.</b> If two players end on
          the same total, the <b>Belgium goals</b> tiebreaker decides (closest
          to the actual number of goals Belgium scores across the tournament).
          If still tied, we compare the <b>number of correctly predicted matches</b>.
        </p>
      </div>

      <h3
        style={{
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--fari-mint)",
          marginTop: 32,
          marginBottom: 14,
        }}
      >
        Scoring
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 18,
          maxWidth: 960,
        }}
      >
        <RuleGroup
          title="Group stage"
          subtitle="prediction is the exact score"
          rows={[
            { label: "Correct winner or draw", value: v("group_winner") },
            { label: "Exact score (replaces above)", value: v("group_exact") },
          ]}
        />
        <RuleGroup
          title="Knockout · winner pick"
          subtitle="picked via the score you enter"
          rows={[
            { label: "Round of 32", value: v("r32_winner") },
            { label: "Round of 16", value: v("r16_winner") },
            { label: "Quarter-final", value: v("qf_winner") },
            { label: "Semi-final", value: v("sf_winner") },
            { label: "Final", value: v("final_winner") },
            { label: "Exact final score (bonus)", value: `+${v("final_exact_bonus").replace(" pt","")} pt` },
          ]}
        />
        <RuleGroup
          title="Tournament bonus"
          subtitle="awarded at the end"
          rows={[
            { label: "Top scorer correct", value: v("top_scorer") },
          ]}
        />
      </div>
    </section>
  );
}

function RuleGroup({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.045)",
        border: "1px solid var(--line-soft)",
        borderRadius: 12,
        padding: "16px 18px",
        fontSize: 13,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "var(--fari-mint)",
          marginBottom: 2,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 11,
          opacity: 0.55,
          marginBottom: 14,
        }}
      >
        {subtitle}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r) => (
          <div
            key={r.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 10,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.85)" }}>{r.label}</span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontWeight: 700,
                color: "white",
                whiteSpace: "nowrap",
              }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Th({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th
      style={{
        padding: "10px 14px",
        fontSize: 10,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.6)",
        fontWeight: 700,
        borderBottom: "1px solid var(--line-soft)",
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  style,
  title,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
}) {
  return (
    <td
      title={title}
      style={{
        padding: "12px 14px",
        borderBottom: "1px solid var(--line-soft)",
        ...style,
      }}
    >
      {children}
    </td>
  );
}

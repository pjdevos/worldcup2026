import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { getLeaderboard, type LeaderboardRow } from "../lib/queries";

export function LeaderboardPage() {
  const { session } = useAuth();
  const { data, isLoading } = useQuery<LeaderboardRow[]>({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
  });

  const me = session?.user.id;

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
              <Th style={{ textAlign: "right", width: 100 }}>Scored</Th>
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
      )}
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

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td
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

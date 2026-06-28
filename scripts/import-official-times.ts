// Open-work #5/#6 — pull authoritative kickoff times from football-data.org and
// compare them against the times in apps/web/src/data/wk.ts. Covers the group
// stage AND any RESOLVED knockout tie (both sides are real team codes, not
// "2A"/"W73" placeholders) — the latter are matched to FD by TLA pair, so you
// must first replace a round's placeholders with the qualified teams in wk.ts.
//
// Usage (default = dry run, prints a diff table, writes nothing):
//   $env:FOOTBALL_DATA_API_KEY="xxxx"; pnpm dlx tsx scripts/import-official-times.ts
//   ... --write   also patches date/kick back into wk.ts (group + knockouts)
//   ... --sql     also emits supabase/seed/fix-group-kickoffs.sql (kick_at) and
//                 supabase/seed/fix-knockouts.sql (teams + slots + kick_at)
//
// Typical per-round flow once a round resolves: edit wk.ts to fill the round's
// team codes, then run with `--write --sql`, then `pnpm seed:gen`, then apply
// the emitted fix-knockouts.sql in the Supabase SQL editor.

import {
  FINAL,
  GROUP_STAGE,
  GROUPS,
  QF,
  R16,
  R32,
  SF,
  TEAMS,
  THIRD_PLACE,
  type KnockoutTie,
} from "../apps/web/src/data/wk.ts";

// Every knockout tie, tagged with its DB stage. A tie is "resolved" once both
// sides are real team codes; only resolved ties can be matched to FD by TLA.
const KNOCKOUTS: { tie: KnockoutTie; stage: string }[] = [
  ...R32.map((t) => ({ tie: t, stage: "r32" })),
  ...R16.map((t) => ({ tie: t, stage: "r16" })),
  ...QF.map((t) => ({ tie: t, stage: "qf" })),
  ...SF.map((t) => ({ tie: t, stage: "sf" })),
  { tie: THIRD_PLACE, stage: "third" },
  { tie: FINAL, stage: "final" },
];
const isResolved = (t: KnockoutTie) => Boolean(TEAMS[t.left] && TEAMS[t.right]);

// Our TLA -> football-data.org TLA, where they differ.
const TLA_ALIAS: Record<string, string> = { URU: "URY" };
const fd = (code: string) => TLA_ALIAS[code] ?? code;

const KEY = process.env.FOOTBALL_DATA_API_KEY;
if (!KEY) {
  console.error("Missing FOOTBALL_DATA_API_KEY in environment.");
  process.exit(1);
}

const FD = "https://api.football-data.org/v4/competitions/WC/matches?season=2026";

interface FdMatch {
  utcDate: string;
  status: string;
  stage: string;
  homeTeam: { tla: string | null; name: string };
  awayTeam: { tla: string | null; name: string };
}

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Brussels",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Brussels",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function toBrussels(utc: string): { date: string; kick: string } {
  const d = new Date(utc);
  return { date: dateFmt.format(d), kick: timeFmt.format(d) };
}

async function main(): Promise<void> {
const res = await fetch(FD, { headers: { "X-Auth-Token": KEY } });
if (!res.ok) {
  console.error(`football-data.org returned ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const json = (await res.json()) as { matches: FdMatch[] };
const fdMatches = json.matches ?? [];

// Index FD group matches by "HOME-AWAY" TLA pair AND by name-set (fallback for
// TLA mismatches, e.g. our URU vs football-data's URY for Uruguay).
const fdByPair = new Map<string, FdMatch>();
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const fdByNameSet = new Map<string, FdMatch>();
for (const m of fdMatches) {
  const h = m.homeTeam?.tla?.toUpperCase();
  const a = m.awayTeam?.tla?.toUpperCase();
  if (h && a) fdByPair.set(`${h}-${a}`, m);
  if (m.homeTeam?.name && m.awayTeam?.name) {
    const key = [norm(m.homeTeam.name), norm(m.awayTeam.name)].sort().join("|");
    fdByNameSet.set(key, m);
  }
}

function findFd(home: string, away: string): FdMatch | undefined {
  const h = fd(home);
  const a = fd(away);
  const byPair = fdByPair.get(`${h}-${a}`) ?? fdByPair.get(`${a}-${h}`);
  if (byPair) return byPair;
  const hn = TEAMS[home]?.name;
  const an = TEAMS[away]?.name;
  if (hn && an) {
    return fdByNameSet.get([norm(hn), norm(an)].sort().join("|"));
  }
  return undefined;
}

let changed = 0;
const unmatched: string[] = [];

console.log("M#   pair        current (wk.ts)      official (Brussels)   change");
console.log("─".repeat(74));

for (const g of GROUP_STAGE) {
  const pair = `${g.home}-${g.away}`;
  const fd = findFd(g.home, g.away);
  if (!fd) {
    unmatched.push(`M${g.n} ${pair} (${TEAMS[g.home]?.name} vs ${TEAMS[g.away]?.name})`);
    continue;
  }
  const off = toBrussels(fd.utcDate);
  const diff = off.date !== g.date || off.kick !== g.kick;
  if (diff) changed++;
  console.log(
    `M${String(g.n).padEnd(3)} ${pair.padEnd(10)} ${g.date} ${g.kick}   ` +
      `->  ${off.date} ${off.kick}   ${diff ? "CHANGED" : ""}`,
  );
}

console.log("─".repeat(74));
console.log(`${changed} of ${GROUP_STAGE.length} group matches differ.`);
if (unmatched.length) {
  console.log(`\n${unmatched.length} could NOT be matched to football-data.org (team-pair mismatch):`);
  unmatched.forEach((u) => console.log("  " + u));
}

// ── Resolved knockout ties (placeholders already filled with team codes) ──
const koResolved = KNOCKOUTS.filter((k) => isResolved(k.tie));
const koOfficial = new Map<number, { date: string; kick: string }>();
if (koResolved.length) {
  let koChanged = 0;
  const koUnmatched: string[] = [];
  console.log("\nResolved knockout ties:");
  console.log("M#   pair        current (wk.ts)      official (Brussels)   change");
  console.log("─".repeat(74));
  for (const { tie } of koResolved) {
    const pair = `${tie.left}-${tie.right}`;
    const fdM = findFd(tie.left, tie.right);
    if (!fdM) {
      koUnmatched.push(`M${tie.n} ${pair} (${TEAMS[tie.left]?.name} vs ${TEAMS[tie.right]?.name})`);
      continue;
    }
    const off = toBrussels(fdM.utcDate);
    koOfficial.set(tie.n, off);
    const diff = off.date !== tie.date || off.kick !== tie.kick;
    if (diff) koChanged++;
    console.log(
      `M${String(tie.n).padEnd(3)} ${pair.padEnd(10)} ${tie.date} ${tie.kick}   ` +
        `->  ${off.date} ${off.kick}   ${diff ? "CHANGED" : ""}`,
    );
  }
  console.log("─".repeat(74));
  console.log(`${koChanged} of ${koResolved.length} resolved knockout ties differ.`);
  if (koUnmatched.length) {
    console.log(`\n${koUnmatched.length} resolved tie(s) could NOT be matched to football-data.org:`);
    koUnmatched.forEach((u) => console.log("  " + u));
  }
} else {
  console.log("\nNo resolved knockout ties yet (both sides still placeholders).");
}

// Build official Brussels date+kick per match number.
const official = new Map<number, { date: string; kick: string }>();
for (const g of GROUP_STAGE) {
  const m = findFd(g.home, g.away);
  if (m) official.set(g.n, toBrussels(m.utcDate));
}

if (process.argv.includes("--sql")) {
  const { writeFileSync } = await import("node:fs");
  const lines = ["-- Official group-stage kickoff times (UTC, from football-data.org).",
    "-- Safe to re-run: touches only matches.kick_at, never scores/status."];
  for (const g of GROUP_STAGE) {
    const m = findFd(g.home, g.away);
    if (m) lines.push(`update matches set kick_at = '${m.utcDate}' where id = ${g.n};`);
  }
  const sqlPath = new URL("../supabase/seed/fix-group-kickoffs.sql", import.meta.url);
  writeFileSync(sqlPath, lines.join("\n") + "\n", "utf8");
  console.log(`--sql: wrote ${lines.length - 2} UPDATE statements to supabase/seed/fix-group-kickoffs.sql`);

  // Knockouts: full resolution (teams + cleared slots + kick_at), like the
  // hand-written supabase/seed/fix-r32-resolved.sql but for every resolved tie.
  if (koResolved.length) {
    const koLines = [
      "-- Resolved knockout ties — teams + official kick_at (UTC), slots cleared.",
      "-- Safe to re-run: never touches home_score / away_score / status.",
    ];
    for (const { tie } of koResolved) {
      const m = findFd(tie.left, tie.right);
      if (m) {
        koLines.push(
          `update matches set home_team = '${tie.left}', away_team = '${tie.right}', ` +
            `home_slot = null, away_slot = null, kick_at = '${m.utcDate}' where id = ${tie.n};`,
        );
      }
    }
    if (koLines.length > 2) {
      const koPath = new URL("../supabase/seed/fix-knockouts.sql", import.meta.url);
      writeFileSync(koPath, koLines.join("\n") + "\n", "utf8");
      console.log(`--sql: wrote ${koLines.length - 2} UPDATE statements to supabase/seed/fix-knockouts.sql`);
    }
  }
}

if (process.argv.includes("--write")) {
  const { readFileSync, writeFileSync } = await import("node:fs");
  const wkPath = new URL("../apps/web/src/data/wk.ts", import.meta.url);
  let src = readFileSync(wkPath, "utf8");
  let applied = 0;
  for (const [n, { date, kick }] of official) {
    // Replace only the date and kick of the `m( n, "G", "date", "kick", ...)` line.
    const re = new RegExp(
      `(m\\(\\s*${n},\\s*"[A-Z]",\\s*)"[\\d-]+",\\s*"[\\d:]+"`,
    );
    const before = src;
    src = src.replace(re, `$1"${date}", "${kick}"`);
    if (src !== before) applied++;
    else console.error(`WARN: no match for M${n}`);
  }
  let koApplied = 0;
  for (const [n, { date, kick }] of koOfficial) {
    // Replace date/kick in the knockout object literal
    // `{ n: N, date: "....", kick: "..", left: ... }`.
    const re = new RegExp(
      `(\\{\\s*n:\\s*${n},\\s*date:\\s*)"[\\d-]+",(\\s*kick:\\s*)"[\\d:]+"`,
    );
    const before = src;
    src = src.replace(re, `$1"${date}",$2"${kick}"`);
    if (src !== before) koApplied++;
    else console.error(`WARN: no knockout match for M${n}`);
  }
  writeFileSync(wkPath, src, "utf8");
  console.log(
    `\n--write: updated ${applied}/${official.size} GROUP_STAGE + ` +
      `${koApplied}/${koOfficial.size} knockout rows in wk.ts.`,
  );
} else {
  console.log("\n(run again with --write to apply these to wk.ts)");
}
}

void main();

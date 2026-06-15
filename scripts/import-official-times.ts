// Open-work #5 — pull authoritative kickoff times from football-data.org and
// compare them against the illustrative times in apps/web/src/data/wk.ts.
//
// Usage:
//   FOOTBALL_DATA_API_KEY=xxxx pnpm dlx tsx scripts/import-official-times.ts
//   (or: $env:FOOTBALL_DATA_API_KEY="xxxx"; pnpm dlx tsx scripts/import-official-times.ts)
//
// It does NOT write anything — it prints a diff table (current vs official,
// in Brussels time) plus any matches it could not map, so the wk.ts edits can
// be applied deliberately and reviewed.

import { GROUP_STAGE, GROUPS, TEAMS } from "../apps/web/src/data/wk.ts";

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
  writeFileSync(wkPath, src, "utf8");
  console.log(`\n--write: updated ${applied}/${official.size} GROUP_STAGE rows in wk.ts.`);
} else {
  console.log("\n(run again with --write to apply these to wk.ts)");
}
}

void main();

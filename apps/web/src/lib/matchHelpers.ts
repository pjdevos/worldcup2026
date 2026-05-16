import { TEAMS } from "../data/wk";
import type { DbMatch } from "./database.types";

export interface DisplayTeam {
  code: string;
  name: string;
  flag: string;
  isPlaceholder: boolean;
}

export function resolveSide(
  teamCode: string | null,
  slot: string | null,
): DisplayTeam {
  if (teamCode && TEAMS[teamCode]) {
    const t = TEAMS[teamCode];
    return { code: t.code, name: t.name, flag: t.flag, isPlaceholder: false };
  }
  return {
    code: slot ?? "?",
    name: slot ?? "TBD",
    flag: "?",
    isPlaceholder: true,
  };
}

export function formatKickoff(kickAtIso: string): {
  date: string;
  time: string;
  full: string;
} {
  const d = new Date(kickAtIso);
  const date = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Brussels",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
  });
  return { date, time, full: `${date} · ${time}` };
}

/**
 * The lock cutoff: kickoff minus 5 minutes.
 */
export function lockAt(kickAtIso: string): Date {
  return new Date(new Date(kickAtIso).getTime() - 5 * 60 * 1000);
}

export function isLocked(kickAtIso: string, now: Date = new Date()): boolean {
  return now >= lockAt(kickAtIso);
}

export function isFinished(match: DbMatch): boolean {
  return match.status === "FINISHED";
}

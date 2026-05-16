const MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const FULL_WEEKDAYS_EN: Record<(typeof WEEKDAYS_EN)[number], string> = {
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

export interface FormatDateOptions {
  short?: boolean;
  weekdayDay?: boolean;
}

export function fmtDate(iso: string, opts: FormatDateOptions = {}): string {
  const d = new Date(`${iso}T12:00:00`);
  const wd = WEEKDAYS_EN[d.getDay()];
  const day = d.getDate();
  const mo = MONTHS_EN[d.getMonth()];
  if (opts.short) return `${day} ${mo}`;
  if (opts.weekdayDay) return `${wd} ${day} ${mo}`;
  return `${wd} ${day} ${mo}`;
}

export function fullWeekday(iso: string): string {
  const wd = WEEKDAYS_EN[new Date(`${iso}T12:00:00`).getDay()];
  return FULL_WEEKDAYS_EN[wd];
}

/**
 * Resolve a bracket placeholder like "1A", "2B", "3A/B/C/D/F", "W73", "V101"
 * into an English label.
 */
export function parsePlaceholder(p: string): string {
  if (/^[123][A-L]$/.test(p)) {
    const pos = p[0];
    const grp = p[1];
    const ord = pos === "1" ? "Winner" : pos === "2" ? "Runner-up" : "Third";
    return `${ord} Group ${grp}`;
  }
  if (/^3[A-L/]+$/.test(p)) return "Best 3rd";
  if (/^W\d+$/.test(p)) return `Winner M${p.slice(1)}`;
  if (/^V\d+$/.test(p)) return `Loser M${p.slice(1)}`;
  return p;
}

const MONTHS_NL = [
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
] as const;

const WEEKDAYS_NL = ["zo", "ma", "di", "wo", "do", "vr", "za"] as const;

const FULL_WEEKDAYS_NL: Record<(typeof WEEKDAYS_NL)[number], string> = {
  zo: "zondag",
  ma: "maandag",
  di: "dinsdag",
  wo: "woensdag",
  do: "donderdag",
  vr: "vrijdag",
  za: "zaterdag",
};

export interface FormatDateOptions {
  short?: boolean;
  weekdayDay?: boolean;
}

export function fmtDate(iso: string, opts: FormatDateOptions = {}): string {
  const d = new Date(`${iso}T12:00:00`);
  const wd = WEEKDAYS_NL[d.getDay()];
  const day = d.getDate();
  const mo = MONTHS_NL[d.getMonth()];
  if (opts.short) return `${day} ${mo}`;
  if (opts.weekdayDay) return `${wd} ${day} ${mo}`;
  return `${wd} ${day} ${mo}`;
}

export function fullWeekday(iso: string): string {
  const wd = WEEKDAYS_NL[new Date(`${iso}T12:00:00`).getDay()];
  return FULL_WEEKDAYS_NL[wd];
}

/**
 * Resolve a bracket placeholder like "1A", "2B", "3A/B/C/D/F", "W73", "V101"
 * into a Dutch label.
 */
export function parsePlaceholder(p: string): string {
  if (/^[123][A-L]$/.test(p)) {
    const pos = p[0];
    const grp = p[1];
    const ord = pos === "1" ? "Winnaar" : pos === "2" ? "Tweede" : "Derde";
    return `${ord} Groep ${grp}`;
  }
  if (/^3[A-L/]+$/.test(p)) return "Beste 3de";
  if (/^W\d+$/.test(p)) return `Winnaar M${p.slice(1)}`;
  if (/^V\d+$/.test(p)) return `Verliezer M${p.slice(1)}`;
  return p;
}

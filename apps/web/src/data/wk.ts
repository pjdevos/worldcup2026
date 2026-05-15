// WK 2026 — typed port of handoff/data.js.
// Single source of truth for fixtures, teams, venues. The supabase seed
// generator will import this file when seeding the DB.
//
// Times are kickoff in Brussels (CEST), illustrative only — they get
// overwritten before launch via scripts/import-official-times.ts.

export type TeamCode = string;

export interface Team {
  name: string;
  code: TeamCode;
  flag: string;
  host?: boolean;
  home?: boolean;
}

export interface Group {
  id: string;
  teams: TeamCode[];
}

export interface GroupMatch {
  date: string;
  kick: string;
  group: string;
  home: TeamCode;
  away: TeamCode;
  venue: string;
}

export interface KnockoutTie {
  n: number;
  date: string;
  kick: string;
  /** Either a team code, a placeholder ("2A", "W73", "3A/B/C/D/F"), or null until resolved. */
  left: string;
  right: string;
  venue: string;
}

export interface Venue {
  city: string;
  country: "MEX" | "CAN" | "USA";
  name: string;
  cap: number;
}

export const TEAMS: Record<TeamCode, Team> = {
  MEX: { name: "Mexico", code: "MEX", flag: "🇲🇽", host: true },
  RSA: { name: "Zuid-Afrika", code: "RSA", flag: "🇿🇦" },
  KOR: { name: "Zuid-Korea", code: "KOR", flag: "🇰🇷" },
  CZE: { name: "Tsjechië", code: "CZE", flag: "🇨🇿" },
  CAN: { name: "Canada", code: "CAN", flag: "🇨🇦", host: true },
  BIH: { name: "Bosnië-Herz.", code: "BIH", flag: "🇧🇦" },
  QAT: { name: "Qatar", code: "QAT", flag: "🇶🇦" },
  SUI: { name: "Zwitserland", code: "SUI", flag: "🇨🇭" },
  BRA: { name: "Brazilië", code: "BRA", flag: "🇧🇷" },
  MAR: { name: "Marokko", code: "MAR", flag: "🇲🇦" },
  HAI: { name: "Haïti", code: "HAI", flag: "🇭🇹" },
  SCO: { name: "Schotland", code: "SCO", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  USA: { name: "VS (USA)", code: "USA", flag: "🇺🇸", host: true },
  PAR: { name: "Paraguay", code: "PAR", flag: "🇵🇾" },
  AUS: { name: "Australië", code: "AUS", flag: "🇦🇺" },
  TUR: { name: "Turkije", code: "TUR", flag: "🇹🇷" },
  GER: { name: "Duitsland", code: "GER", flag: "🇩🇪" },
  CUW: { name: "Curaçao", code: "CUW", flag: "🇨🇼" },
  CIV: { name: "Ivoorkust", code: "CIV", flag: "🇨🇮" },
  ECU: { name: "Ecuador", code: "ECU", flag: "🇪🇨" },
  NED: { name: "Nederland", code: "NED", flag: "🇳🇱" },
  JPN: { name: "Japan", code: "JPN", flag: "🇯🇵" },
  SWE: { name: "Zweden", code: "SWE", flag: "🇸🇪" },
  TUN: { name: "Tunesië", code: "TUN", flag: "🇹🇳" },
  BEL: { name: "België", code: "BEL", flag: "🇧🇪", home: true },
  EGY: { name: "Egypte", code: "EGY", flag: "🇪🇬" },
  IRN: { name: "Iran", code: "IRN", flag: "🇮🇷" },
  NZL: { name: "Nieuw-Zeeland", code: "NZL", flag: "🇳🇿" },
  ESP: { name: "Spanje", code: "ESP", flag: "🇪🇸" },
  CPV: { name: "Kaapverdië", code: "CPV", flag: "🇨🇻" },
  KSA: { name: "Saoedi-Arabië", code: "KSA", flag: "🇸🇦" },
  URU: { name: "Uruguay", code: "URU", flag: "🇺🇾" },
  FRA: { name: "Frankrijk", code: "FRA", flag: "🇫🇷" },
  SEN: { name: "Senegal", code: "SEN", flag: "🇸🇳" },
  IRQ: { name: "Irak", code: "IRQ", flag: "🇮🇶" },
  NOR: { name: "Noorwegen", code: "NOR", flag: "🇳🇴" },
  ARG: { name: "Argentinië", code: "ARG", flag: "🇦🇷" },
  ALG: { name: "Algerije", code: "ALG", flag: "🇩🇿" },
  AUT: { name: "Oostenrijk", code: "AUT", flag: "🇦🇹" },
  JOR: { name: "Jordanië", code: "JOR", flag: "🇯🇴" },
  POR: { name: "Portugal", code: "POR", flag: "🇵🇹" },
  COD: { name: "DR Congo", code: "COD", flag: "🇨🇩" },
  UZB: { name: "Oezbekistan", code: "UZB", flag: "🇺🇿" },
  COL: { name: "Colombia", code: "COL", flag: "🇨🇴" },
  ENG: { name: "Engeland", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  CRO: { name: "Kroatië", code: "CRO", flag: "🇭🇷" },
  GHA: { name: "Ghana", code: "GHA", flag: "🇬🇭" },
  PAN: { name: "Panama", code: "PAN", flag: "🇵🇦" },
};

export const GROUPS: Group[] = [
  { id: "A", teams: ["MEX", "RSA", "KOR", "CZE"] },
  { id: "B", teams: ["CAN", "BIH", "QAT", "SUI"] },
  { id: "C", teams: ["BRA", "MAR", "HAI", "SCO"] },
  { id: "D", teams: ["USA", "PAR", "AUS", "TUR"] },
  { id: "E", teams: ["GER", "CUW", "CIV", "ECU"] },
  { id: "F", teams: ["NED", "JPN", "SWE", "TUN"] },
  { id: "G", teams: ["BEL", "EGY", "IRN", "NZL"] },
  { id: "H", teams: ["ESP", "CPV", "KSA", "URU"] },
  { id: "I", teams: ["FRA", "SEN", "IRQ", "NOR"] },
  { id: "J", teams: ["ARG", "ALG", "AUT", "JOR"] },
  { id: "K", teams: ["POR", "COD", "UZB", "COL"] },
  { id: "L", teams: ["ENG", "CRO", "GHA", "PAN"] },
];

function m(
  group: string,
  date: string,
  kick: string,
  posA: 1 | 2 | 3 | 4,
  posB: 1 | 2 | 3 | 4,
  venue: string,
): GroupMatch {
  const teams = GROUPS.find((g) => g.id === group)!.teams;
  return {
    date,
    kick,
    group,
    home: teams[posA - 1],
    away: teams[posB - 1],
    venue,
  };
}

export const GROUP_STAGE: GroupMatch[] = [
  // ── Matchday 1 ──
  m("A", "2026-06-11", "21:00", 1, 2, "Estadio Banorte, Mexico-Stad"),
  m("A", "2026-06-11", "00:00", 3, 4, "AT&T Stadium, Dallas"),
  m("B", "2026-06-12", "19:00", 1, 2, "BMO Field, Toronto"),
  m("D", "2026-06-12", "22:00", 1, 2, "SoFi Stadium, Los Angeles"),
  m("B", "2026-06-13", "18:00", 3, 4, "BC Place, Vancouver"),
  m("C", "2026-06-13", "21:00", 1, 2, "MetLife, New York/New Jersey"),
  m("C", "2026-06-13", "00:00", 3, 4, "Hard Rock Stadium, Miami"),
  m("D", "2026-06-13", "03:00", 3, 4, "Levi's Stadium, San Francisco Bay"),
  m("E", "2026-06-14", "18:00", 1, 2, "Mercedes-Benz, Atlanta"),
  m("F", "2026-06-14", "21:00", 1, 2, "GEHA Field, Kansas City"),
  m("E", "2026-06-14", "00:00", 3, 4, "Lincoln Financial, Philadelphia"),
  m("F", "2026-06-14", "03:00", 3, 4, "Lumen Field, Seattle"),
  m("G", "2026-06-15", "18:00", 1, 2, "Hard Rock Stadium, Miami"),
  m("H", "2026-06-15", "21:00", 1, 2, "AT&T Stadium, Dallas"),
  m("G", "2026-06-15", "00:00", 3, 4, "Gillette Stadium, Boston"),
  m("H", "2026-06-15", "03:00", 3, 4, "NRG Stadium, Houston"),
  m("I", "2026-06-16", "18:00", 1, 2, "Estadio Akron, Guadalajara"),
  m("J", "2026-06-16", "21:00", 1, 2, "Estadio BBVA, Monterrey"),
  m("I", "2026-06-16", "00:00", 3, 4, "BMO Field, Toronto"),
  m("J", "2026-06-16", "03:00", 3, 4, "BC Place, Vancouver"),
  m("K", "2026-06-17", "18:00", 1, 2, "MetLife, New York/New Jersey"),
  m("L", "2026-06-17", "21:00", 1, 2, "Mercedes-Benz, Atlanta"),
  m("K", "2026-06-17", "00:00", 3, 4, "GEHA Field, Kansas City"),
  m("L", "2026-06-17", "03:00", 3, 4, "Lincoln Financial, Philadelphia"),
  // ── Matchday 2 ──
  m("A", "2026-06-18", "19:00", 1, 3, "Estadio Akron, Guadalajara"),
  m("B", "2026-06-18", "22:00", 1, 3, "BMO Field, Toronto"),
  m("A", "2026-06-18", "01:00", 4, 2, "NRG Stadium, Houston"),
  m("B", "2026-06-18", "04:00", 4, 2, "Lumen Field, Seattle"),
  m("C", "2026-06-19", "18:00", 1, 3, "SoFi Stadium, Los Angeles"),
  m("D", "2026-06-19", "21:00", 1, 3, "AT&T Stadium, Dallas"),
  m("C", "2026-06-19", "00:00", 4, 2, "Hard Rock Stadium, Miami"),
  m("D", "2026-06-19", "03:00", 4, 2, "Mercedes-Benz, Atlanta"),
  m("E", "2026-06-20", "18:00", 1, 3, "MetLife, New York/New Jersey"),
  m("F", "2026-06-20", "21:00", 1, 3, "NRG Stadium, Houston"),
  m("E", "2026-06-20", "00:00", 4, 2, "Levi's Stadium, San Francisco Bay"),
  m("F", "2026-06-20", "03:00", 4, 2, "BC Place, Vancouver"),
  m("G", "2026-06-21", "18:00", 1, 3, "Gillette Stadium, Boston"),
  m("H", "2026-06-21", "21:00", 1, 3, "GEHA Field, Kansas City"),
  m("G", "2026-06-21", "00:00", 4, 2, "Lincoln Financial, Philadelphia"),
  m("H", "2026-06-21", "03:00", 4, 2, "Hard Rock Stadium, Miami"),
  m("I", "2026-06-22", "18:00", 1, 3, "AT&T Stadium, Dallas"),
  m("J", "2026-06-22", "21:00", 1, 3, "Mercedes-Benz, Atlanta"),
  m("I", "2026-06-22", "00:00", 4, 2, "Estadio Banorte, Mexico-Stad"),
  m("J", "2026-06-22", "03:00", 4, 2, "Estadio BBVA, Monterrey"),
  m("K", "2026-06-23", "18:00", 1, 3, "Lumen Field, Seattle"),
  m("L", "2026-06-23", "21:00", 1, 3, "BMO Field, Toronto"),
  m("K", "2026-06-23", "00:00", 4, 2, "Levi's Stadium, San Francisco Bay"),
  m("L", "2026-06-23", "03:00", 4, 2, "BC Place, Vancouver"),
  // ── Matchday 3 (simultaneous kickoff) ──
  m("A", "2026-06-24", "20:00", 4, 1, "Estadio Banorte, Mexico-Stad"),
  m("A", "2026-06-24", "20:00", 2, 3, "AT&T Stadium, Dallas"),
  m("B", "2026-06-24", "00:00", 4, 1, "BMO Field, Toronto"),
  m("B", "2026-06-24", "00:00", 2, 3, "BC Place, Vancouver"),
  m("C", "2026-06-24", "04:00", 4, 1, "Hard Rock Stadium, Miami"),
  m("C", "2026-06-24", "04:00", 2, 3, "Lumen Field, Seattle"),
  m("D", "2026-06-25", "18:00", 4, 1, "SoFi Stadium, Los Angeles"),
  m("D", "2026-06-25", "18:00", 2, 3, "Levi's Stadium, San Francisco Bay"),
  m("E", "2026-06-25", "22:00", 4, 1, "Mercedes-Benz, Atlanta"),
  m("E", "2026-06-25", "22:00", 2, 3, "Lincoln Financial, Philadelphia"),
  m("F", "2026-06-25", "02:00", 4, 1, "GEHA Field, Kansas City"),
  m("F", "2026-06-25", "02:00", 2, 3, "NRG Stadium, Houston"),
  m("G", "2026-06-26", "18:00", 4, 1, "Gillette Stadium, Boston"),
  m("G", "2026-06-26", "18:00", 2, 3, "Hard Rock Stadium, Miami"),
  m("H", "2026-06-26", "22:00", 4, 1, "AT&T Stadium, Dallas"),
  m("H", "2026-06-26", "22:00", 2, 3, "NRG Stadium, Houston"),
  m("I", "2026-06-26", "02:00", 4, 1, "Estadio Akron, Guadalajara"),
  m("I", "2026-06-26", "02:00", 2, 3, "Estadio Banorte, Mexico-Stad"),
  m("J", "2026-06-27", "18:00", 4, 1, "Estadio BBVA, Monterrey"),
  m("J", "2026-06-27", "18:00", 2, 3, "BC Place, Vancouver"),
  m("K", "2026-06-27", "22:00", 4, 1, "MetLife, New York/New Jersey"),
  m("K", "2026-06-27", "22:00", 2, 3, "GEHA Field, Kansas City"),
  m("L", "2026-06-27", "02:00", 4, 1, "Mercedes-Benz, Atlanta"),
  m("L", "2026-06-27", "02:00", 2, 3, "Lincoln Financial, Philadelphia"),
];

export const R32: KnockoutTie[] = [
  { n: 73, date: "2026-06-28", kick: "21:00", left: "2A", right: "2B", venue: "SoFi Stadium, Los Angeles" },
  { n: 74, date: "2026-06-29", kick: "19:00", left: "1E", right: "3A/B/C/D/F", venue: "Lincoln Financial, Philadelphia" },
  { n: 75, date: "2026-06-29", kick: "22:30", left: "1F", right: "2C", venue: "Estadio BBVA, Monterrey" },
  { n: 76, date: "2026-06-30", kick: "03:00", left: "1C", right: "2F", venue: "NRG Stadium, Houston" },
  { n: 77, date: "2026-06-30", kick: "19:00", left: "1I", right: "3C/D/F/G/H", venue: "MetLife, New York/New Jersey" },
  { n: 78, date: "2026-06-30", kick: "23:00", left: "2E", right: "2I", venue: "AT&T Stadium, Dallas" },
  { n: 79, date: "2026-07-01", kick: "03:00", left: "1A", right: "3C/E/F/H/I", venue: "Estadio Banorte, Mexico-Stad" },
  { n: 80, date: "2026-07-01", kick: "18:00", left: "1L", right: "3E/H/I/J/K", venue: "Mercedes-Benz, Atlanta" },
  { n: 81, date: "2026-07-02", kick: "22:00", left: "1D", right: "3B/E/F/I/J", venue: "Levi's Stadium, San Francisco Bay" },
  { n: 82, date: "2026-07-03", kick: "02:00", left: "1G", right: "3A/E/H/I/J", venue: "Lumen Field, Seattle" },
  { n: 83, date: "2026-07-03", kick: "21:00", left: "2K", right: "2L", venue: "BMO Field, Toronto" },
  { n: 84, date: "2026-07-03", kick: "01:00", left: "1H", right: "2J", venue: "SoFi Stadium, Los Angeles" },
  { n: 85, date: "2026-07-03", kick: "05:00", left: "1B", right: "3E/F/G/I/J", venue: "BC Place, Vancouver" },
  { n: 86, date: "2026-07-04", kick: "20:00", left: "1J", right: "2H", venue: "Hard Rock Stadium, Miami" },
  { n: 87, date: "2026-07-04", kick: "00:00", left: "1K", right: "3D/E/I/J/L", venue: "GEHA Field, Kansas City" },
  { n: 88, date: "2026-07-04", kick: "03:30", left: "2D", right: "2G", venue: "AT&T Stadium, Dallas" },
];

export const R16: KnockoutTie[] = [
  { n: 89, date: "2026-07-04", kick: "23:00", left: "W74", right: "W77", venue: "Lincoln Financial, Philadelphia" },
  { n: 90, date: "2026-07-05", kick: "22:00", left: "W73", right: "W75", venue: "NRG Stadium, Houston" },
  { n: 91, date: "2026-07-06", kick: "02:00", left: "W76", right: "W78", venue: "MetLife, New York/New Jersey" },
  { n: 92, date: "2026-07-06", kick: "21:00", left: "W79", right: "W80", venue: "Estadio Banorte, Mexico-Stad" },
  { n: 93, date: "2026-07-07", kick: "02:00", left: "W83", right: "W84", venue: "Gillette Stadium, Boston" },
  { n: 94, date: "2026-07-07", kick: "18:00", left: "W81", right: "W82", venue: "Lumen Field, Seattle" },
  { n: 95, date: "2026-07-07", kick: "22:00", left: "W86", right: "W88", venue: "Mercedes-Benz, Atlanta" },
  { n: 96, date: "2026-07-07", kick: "01:00", left: "W85", right: "W87", venue: "BC Place, Vancouver" },
];

export const QF: KnockoutTie[] = [
  { n: 97, date: "2026-07-09", kick: "22:00", left: "W89", right: "W90", venue: "Gillette Stadium, Boston" },
  { n: 98, date: "2026-07-10", kick: "02:00", left: "W93", right: "W94", venue: "SoFi Stadium, Los Angeles" },
  { n: 99, date: "2026-07-10", kick: "21:00", left: "W91", right: "W92", venue: "Hard Rock Stadium, Miami" },
  { n: 100, date: "2026-07-11", kick: "03:00", left: "W95", right: "W96", venue: "AT&T Stadium, Dallas" },
];

export const SF: KnockoutTie[] = [
  { n: 101, date: "2026-07-14", kick: "21:00", left: "W97", right: "W98", venue: "AT&T Stadium, Dallas" },
  { n: 102, date: "2026-07-15", kick: "21:00", left: "W99", right: "W100", venue: "Mercedes-Benz, Atlanta" },
];

export const THIRD_PLACE: KnockoutTie = {
  n: 103,
  date: "2026-07-18",
  kick: "23:00",
  left: "V101",
  right: "V102",
  venue: "Hard Rock Stadium, Miami",
};

export const FINAL: KnockoutTie = {
  n: 104,
  date: "2026-07-19",
  kick: "21:00",
  left: "W101",
  right: "W102",
  venue: "MetLife, New York/New Jersey",
};

export const VENUES: Venue[] = [
  { city: "Mexico-Stad", country: "MEX", name: "Estadio Banorte", cap: 83000 },
  { city: "Guadalajara", country: "MEX", name: "Estadio Akron", cap: 48000 },
  { city: "Monterrey", country: "MEX", name: "Estadio BBVA", cap: 53500 },
  { city: "Toronto", country: "CAN", name: "BMO Field", cap: 45000 },
  { city: "Vancouver", country: "CAN", name: "BC Place", cap: 54000 },
  { city: "Atlanta", country: "USA", name: "Mercedes-Benz Stadium", cap: 75000 },
  { city: "Boston", country: "USA", name: "Gillette Stadium", cap: 65000 },
  { city: "Dallas", country: "USA", name: "AT&T Stadium", cap: 94000 },
  { city: "Houston", country: "USA", name: "NRG Stadium", cap: 72000 },
  { city: "Kansas City", country: "USA", name: "GEHA Field at Arrowhead", cap: 73000 },
  { city: "Los Angeles", country: "USA", name: "SoFi Stadium", cap: 70000 },
  { city: "Miami", country: "USA", name: "Hard Rock Stadium", cap: 65000 },
  { city: "New York/NJ", country: "USA", name: "MetLife Stadium", cap: 82500 },
  { city: "Philadelphia", country: "USA", name: "Lincoln Financial Field", cap: 69000 },
  { city: "S.F. Bay", country: "USA", name: "Levi's Stadium", cap: 71000 },
  { city: "Seattle", country: "USA", name: "Lumen Field", cap: 69000 },
];

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
  /** Official FIFA match number (1-72). Used directly as matches.id in the DB. */
  n: number;
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
  RSA: { name: "South Africa", code: "RSA", flag: "🇿🇦" },
  KOR: { name: "South Korea", code: "KOR", flag: "🇰🇷" },
  CZE: { name: "Czechia", code: "CZE", flag: "🇨🇿" },
  CAN: { name: "Canada", code: "CAN", flag: "🇨🇦", host: true },
  BIH: { name: "Bosnia-Herz.", code: "BIH", flag: "🇧🇦" },
  QAT: { name: "Qatar", code: "QAT", flag: "🇶🇦" },
  SUI: { name: "Switzerland", code: "SUI", flag: "🇨🇭" },
  BRA: { name: "Brazil", code: "BRA", flag: "🇧🇷" },
  MAR: { name: "Morocco", code: "MAR", flag: "🇲🇦" },
  HAI: { name: "Haiti", code: "HAI", flag: "🇭🇹" },
  SCO: { name: "Scotland", code: "SCO", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  USA: { name: "United States", code: "USA", flag: "🇺🇸", host: true },
  PAR: { name: "Paraguay", code: "PAR", flag: "🇵🇾" },
  AUS: { name: "Australia", code: "AUS", flag: "🇦🇺" },
  TUR: { name: "Türkiye", code: "TUR", flag: "🇹🇷" },
  GER: { name: "Germany", code: "GER", flag: "🇩🇪" },
  CUW: { name: "Curaçao", code: "CUW", flag: "🇨🇼" },
  CIV: { name: "Côte d'Ivoire", code: "CIV", flag: "🇨🇮" },
  ECU: { name: "Ecuador", code: "ECU", flag: "🇪🇨" },
  NED: { name: "Netherlands", code: "NED", flag: "🇳🇱" },
  JPN: { name: "Japan", code: "JPN", flag: "🇯🇵" },
  SWE: { name: "Sweden", code: "SWE", flag: "🇸🇪" },
  TUN: { name: "Tunisia", code: "TUN", flag: "🇹🇳" },
  BEL: { name: "Belgium", code: "BEL", flag: "🇧🇪", home: true },
  EGY: { name: "Egypt", code: "EGY", flag: "🇪🇬" },
  IRN: { name: "Iran", code: "IRN", flag: "🇮🇷" },
  NZL: { name: "New Zealand", code: "NZL", flag: "🇳🇿" },
  ESP: { name: "Spain", code: "ESP", flag: "🇪🇸" },
  CPV: { name: "Cabo Verde", code: "CPV", flag: "🇨🇻" },
  KSA: { name: "Saudi Arabia", code: "KSA", flag: "🇸🇦" },
  URU: { name: "Uruguay", code: "URU", flag: "🇺🇾" },
  FRA: { name: "France", code: "FRA", flag: "🇫🇷" },
  SEN: { name: "Senegal", code: "SEN", flag: "🇸🇳" },
  IRQ: { name: "Iraq", code: "IRQ", flag: "🇮🇶" },
  NOR: { name: "Norway", code: "NOR", flag: "🇳🇴" },
  ARG: { name: "Argentina", code: "ARG", flag: "🇦🇷" },
  ALG: { name: "Algeria", code: "ALG", flag: "🇩🇿" },
  AUT: { name: "Austria", code: "AUT", flag: "🇦🇹" },
  JOR: { name: "Jordan", code: "JOR", flag: "🇯🇴" },
  POR: { name: "Portugal", code: "POR", flag: "🇵🇹" },
  COD: { name: "DR Congo", code: "COD", flag: "🇨🇩" },
  UZB: { name: "Uzbekistan", code: "UZB", flag: "🇺🇿" },
  COL: { name: "Colombia", code: "COL", flag: "🇨🇴" },
  ENG: { name: "England", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  CRO: { name: "Croatia", code: "CRO", flag: "🇭🇷" },
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
  n: number,
  group: string,
  date: string,
  kick: string,
  posA: 1 | 2 | 3 | 4,
  posB: 1 | 2 | 3 | 4,
  venue: string,
): GroupMatch {
  const teams = GROUPS.find((g) => g.id === group)!.teams;
  return {
    n,
    date,
    kick,
    group,
    home: teams[posA - 1],
    away: teams[posB - 1],
    venue,
  };
}

/**
 * 72 group-stage fixtures in official FIFA match-number order (M1..M72).
 * The `n` value is the same as matches.id in the DB — never renumber.
 * Kickoff times are still illustrative Brussels-CEST; FIFA's official
 * times overwrite matches.kick_at before launch via the official import.
 */
export const GROUP_STAGE: GroupMatch[] = [
  m(  1, "A", "2026-06-11", "21:00", 1, 2, "Estadio Banorte, Mexico-Stad"),
  m(  2, "A", "2026-06-12", "04:00", 3, 4, "AT&T Stadium, Dallas"),
  m(  3, "B", "2026-06-12", "21:00", 1, 2, "BMO Field, Toronto"),
  m(  4, "D", "2026-06-13", "03:00", 1, 2, "SoFi Stadium, Los Angeles"),
  m(  5, "C", "2026-06-14", "03:00", 3, 4, "Hard Rock Stadium, Miami"),
  m(  6, "D", "2026-06-14", "06:00", 3, 4, "Levi's Stadium, San Francisco Bay"),
  m(  7, "C", "2026-06-14", "00:00", 1, 2, "MetLife, New York/New Jersey"),
  m(  8, "B", "2026-06-13", "21:00", 3, 4, "BC Place, Vancouver"),
  m(  9, "E", "2026-06-15", "01:00", 3, 4, "Lincoln Financial, Philadelphia"),
  m( 10, "E", "2026-06-14", "19:00", 1, 2, "Mercedes-Benz, Atlanta"),
  m( 11, "F", "2026-06-14", "22:00", 1, 2, "GEHA Field, Kansas City"),
  m( 12, "F", "2026-06-15", "04:00", 3, 4, "Lumen Field, Seattle"),
  m( 13, "H", "2026-06-16", "00:00", 3, 4, "NRG Stadium, Houston"),
  m( 14, "H", "2026-06-15", "18:00", 1, 2, "AT&T Stadium, Dallas"),
  m( 15, "G", "2026-06-16", "03:00", 3, 4, "Gillette Stadium, Boston"),
  m( 16, "G", "2026-06-15", "21:00", 1, 2, "Hard Rock Stadium, Miami"),
  m( 17, "I", "2026-06-16", "21:00", 1, 2, "Estadio Akron, Guadalajara"),
  m( 18, "I", "2026-06-17", "00:00", 3, 4, "BMO Field, Toronto"),
  m( 19, "J", "2026-06-17", "03:00", 1, 2, "Estadio BBVA, Monterrey"),
  m( 20, "J", "2026-06-17", "06:00", 3, 4, "BC Place, Vancouver"),
  m( 21, "L", "2026-06-18", "01:00", 3, 4, "Lincoln Financial, Philadelphia"),
  m( 22, "L", "2026-06-17", "22:00", 1, 2, "Mercedes-Benz, Atlanta"),
  m( 23, "K", "2026-06-17", "19:00", 1, 2, "MetLife, New York/New Jersey"),
  m( 24, "K", "2026-06-18", "04:00", 3, 4, "GEHA Field, Kansas City"),
  m( 25, "A", "2026-06-18", "18:00", 4, 2, "NRG Stadium, Houston"),
  m( 26, "B", "2026-06-18", "21:00", 4, 2, "Lumen Field, Seattle"),
  m( 27, "B", "2026-06-19", "00:00", 1, 3, "BMO Field, Toronto"),
  m( 28, "A", "2026-06-19", "03:00", 1, 3, "Estadio Akron, Guadalajara"),
  m( 29, "C", "2026-06-20", "02:30", 1, 3, "SoFi Stadium, Los Angeles"),
  m( 30, "C", "2026-06-20", "00:00", 4, 2, "Hard Rock Stadium, Miami"),
  m( 31, "D", "2026-06-20", "05:00", 4, 2, "Mercedes-Benz, Atlanta"),
  m( 32, "D", "2026-06-19", "21:00", 1, 3, "AT&T Stadium, Dallas"),
  m( 33, "E", "2026-06-20", "22:00", 1, 3, "MetLife, New York/New Jersey"),
  m( 34, "E", "2026-06-21", "02:00", 4, 2, "Levi's Stadium, San Francisco Bay"),
  m( 35, "F", "2026-06-20", "19:00", 1, 3, "NRG Stadium, Houston"),
  m( 36, "F", "2026-06-21", "06:00", 4, 2, "BC Place, Vancouver"),
  m( 37, "H", "2026-06-22", "00:00", 4, 2, "Hard Rock Stadium, Miami"),
  m( 38, "H", "2026-06-21", "18:00", 1, 3, "GEHA Field, Kansas City"),
  m( 39, "G", "2026-06-21", "21:00", 1, 3, "Gillette Stadium, Boston"),
  m( 40, "G", "2026-06-22", "03:00", 4, 2, "Lincoln Financial, Philadelphia"),
  m( 41, "I", "2026-06-23", "02:00", 4, 2, "Estadio Banorte, Mexico-Stad"),
  m( 42, "I", "2026-06-22", "23:00", 1, 3, "AT&T Stadium, Dallas"),
  m( 43, "J", "2026-06-22", "19:00", 1, 3, "Mercedes-Benz, Atlanta"),
  m( 44, "J", "2026-06-23", "05:00", 4, 2, "Estadio BBVA, Monterrey"),
  m( 45, "L", "2026-06-23", "22:00", 1, 3, "BMO Field, Toronto"),
  m( 46, "L", "2026-06-24", "01:00", 4, 2, "BC Place, Vancouver"),
  m( 47, "K", "2026-06-23", "19:00", 1, 3, "Lumen Field, Seattle"),
  m( 48, "K", "2026-06-24", "04:00", 4, 2, "Levi's Stadium, San Francisco Bay"),
  m( 49, "C", "2026-06-25", "00:00", 4, 1, "Hard Rock Stadium, Miami"),
  m( 50, "C", "2026-06-25", "00:00", 2, 3, "Lumen Field, Seattle"),
  m( 51, "B", "2026-06-24", "21:00", 4, 1, "BMO Field, Toronto"),
  m( 52, "B", "2026-06-24", "21:00", 2, 3, "BC Place, Vancouver"),
  m( 53, "A", "2026-06-25", "03:00", 4, 1, "Estadio Banorte, Mexico-Stad"),
  m( 54, "A", "2026-06-25", "03:00", 2, 3, "AT&T Stadium, Dallas"),
  m( 55, "E", "2026-06-25", "22:00", 2, 3, "Lincoln Financial, Philadelphia"),
  m( 56, "E", "2026-06-25", "22:00", 4, 1, "Mercedes-Benz, Atlanta"),
  m( 57, "F", "2026-06-26", "01:00", 2, 3, "NRG Stadium, Houston"),
  m( 58, "F", "2026-06-26", "01:00", 4, 1, "GEHA Field, Kansas City"),
  m( 59, "D", "2026-06-26", "04:00", 4, 1, "SoFi Stadium, Los Angeles"),
  m( 60, "D", "2026-06-26", "04:00", 2, 3, "Levi's Stadium, San Francisco Bay"),
  m( 61, "I", "2026-06-26", "21:00", 4, 1, "Estadio Akron, Guadalajara"),
  m( 62, "I", "2026-06-26", "21:00", 2, 3, "Estadio Banorte, Mexico-Stad"),
  m( 63, "G", "2026-06-27", "05:00", 2, 3, "Hard Rock Stadium, Miami"),
  m( 64, "G", "2026-06-27", "05:00", 4, 1, "Gillette Stadium, Boston"),
  m( 65, "H", "2026-06-27", "02:00", 2, 3, "NRG Stadium, Houston"),
  m( 66, "H", "2026-06-27", "02:00", 4, 1, "AT&T Stadium, Dallas"),
  m( 67, "L", "2026-06-27", "23:00", 4, 1, "Mercedes-Benz, Atlanta"),
  m( 68, "L", "2026-06-27", "23:00", 2, 3, "Lincoln Financial, Philadelphia"),
  m( 69, "J", "2026-06-28", "04:00", 2, 3, "BC Place, Vancouver"),
  m( 70, "J", "2026-06-28", "04:00", 4, 1, "Estadio BBVA, Monterrey"),
  m( 71, "K", "2026-06-28", "01:30", 4, 1, "MetLife, New York/New Jersey"),
  m( 72, "K", "2026-06-28", "01:30", 2, 3, "GEHA Field, Kansas City"),
];

// Round of 32 — RESOLVED after the group stage (2026-06-28). The `left`/`right`
// placeholders (2A, 1E, 3C/D/F/G/H, …) have been replaced with the actual
// qualified teams; dates, kickoff times (Brussels-CEST = UTC+2) and venues are
// the official FIFA schedule. R16+ stay as W## placeholders until they resolve.
export const R32: KnockoutTie[] = [
  { n: 73, date: "2026-06-28", kick: "21:00", left: "RSA", right: "CAN", venue: "SoFi Stadium, Los Angeles" },
  { n: 74, date: "2026-06-29", kick: "22:30", left: "GER", right: "PAR", venue: "Gillette Stadium, Boston" },
  { n: 75, date: "2026-06-30", kick: "03:00", left: "NED", right: "MAR", venue: "Estadio BBVA, Monterrey" },
  { n: 76, date: "2026-06-29", kick: "19:00", left: "BRA", right: "JPN", venue: "NRG Stadium, Houston" },
  { n: 77, date: "2026-06-30", kick: "23:00", left: "FRA", right: "SWE", venue: "MetLife, New York/New Jersey" },
  { n: 78, date: "2026-06-30", kick: "19:00", left: "CIV", right: "NOR", venue: "AT&T Stadium, Dallas" },
  { n: 79, date: "2026-07-01", kick: "04:00", left: "MEX", right: "ECU", venue: "Estadio Banorte, Mexico-Stad" },
  { n: 80, date: "2026-07-01", kick: "18:00", left: "ENG", right: "COD", venue: "Mercedes-Benz, Atlanta" },
  { n: 81, date: "2026-07-02", kick: "02:00", left: "USA", right: "BIH", venue: "Levi's Stadium, San Francisco Bay" },
  { n: 82, date: "2026-07-01", kick: "22:00", left: "BEL", right: "SEN", venue: "Lumen Field, Seattle" },
  { n: 83, date: "2026-07-03", kick: "01:00", left: "POR", right: "CRO", venue: "BMO Field, Toronto" },
  { n: 84, date: "2026-07-02", kick: "21:00", left: "ESP", right: "AUT", venue: "SoFi Stadium, Los Angeles" },
  { n: 85, date: "2026-07-03", kick: "05:00", left: "SUI", right: "ALG", venue: "BC Place, Vancouver" },
  { n: 86, date: "2026-07-04", kick: "00:00", left: "ARG", right: "CPV", venue: "Hard Rock Stadium, Miami" },
  { n: 87, date: "2026-07-04", kick: "03:30", left: "COL", right: "GHA", venue: "GEHA Field, Kansas City" },
  { n: 88, date: "2026-07-03", kick: "20:00", left: "AUS", right: "EGY", venue: "AT&T Stadium, Dallas" },
];

export const R16: KnockoutTie[] = [
  // R16 fully resolved from official R32 results (football-data.org, 2026-07-04).
  { n: 89, date: "2026-07-04", kick: "23:00", left: "PAR", right: "FRA", venue: "Lincoln Financial, Philadelphia" },
  { n: 90, date: "2026-07-04", kick: "19:00", left: "CAN", right: "MAR", venue: "NRG Stadium, Houston" },
  { n: 91, date: "2026-07-05", kick: "22:00", left: "BRA", right: "NOR", venue: "MetLife, New York/New Jersey" },
  { n: 92, date: "2026-07-06", kick: "03:00", left: "MEX", right: "ENG", venue: "Estadio Banorte, Mexico-Stad" },
  { n: 93, date: "2026-07-06", kick: "21:00", left: "POR", right: "ESP", venue: "Gillette Stadium, Boston" },
  { n: 94, date: "2026-07-07", kick: "02:00", left: "USA", right: "BEL", venue: "Lumen Field, Seattle" },
  { n: 95, date: "2026-07-07", kick: "18:00", left: "ARG", right: "EGY", venue: "Mercedes-Benz, Atlanta" },
  { n: 96, date: "2026-07-07", kick: "22:00", left: "SUI", right: "COL", venue: "BC Place, Vancouver" },
];

export const QF: KnockoutTie[] = [
  // QF resolved from official R16 results (football-data.org, 2026-07-08).
  { n: 97, date: "2026-07-09", kick: "22:00", left: "FRA", right: "MAR", venue: "Gillette Stadium, Boston" },
  { n: 98, date: "2026-07-10", kick: "21:00", left: "ESP", right: "BEL", venue: "SoFi Stadium, Los Angeles" },
  { n: 99, date: "2026-07-11", kick: "23:00", left: "NOR", right: "ENG", venue: "Hard Rock Stadium, Miami" },
  { n: 100, date: "2026-07-12", kick: "03:00", left: "ARG", right: "SUI", venue: "AT&T Stadium, Dallas" },
];

export const SF: KnockoutTie[] = [
  // SF resolved from official QF results (football-data.org, 2026-07-12).
  { n: 101, date: "2026-07-14", kick: "21:00", left: "FRA", right: "ESP", venue: "AT&T Stadium, Dallas" },
  { n: 102, date: "2026-07-15", kick: "21:00", left: "ENG", right: "ARG", venue: "Mercedes-Benz, Atlanta" },
];

// 3rd place + final resolved from official SF results (football-data.org, 2026-07-15).
export const THIRD_PLACE: KnockoutTie = {
  n: 103,
  date: "2026-07-18",
  kick: "23:00",
  left: "FRA",
  right: "ENG",
  venue: "Hard Rock Stadium, Miami",
};

export const FINAL: KnockoutTie = {
  n: 104,
  date: "2026-07-19",
  kick: "21:00",
  left: "ESP",
  right: "ARG",
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

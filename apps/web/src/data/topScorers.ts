/**
 * Candidate list for the tournament top-scorer pick. Stable order — used as
 * dropdown options on the Calendar page. Players not in this list are
 * captured as free-text ("Someone else…") in `profiles.top_scorer`.
 */
export const TOP_SCORER_OPTIONS = [
  "Kylian Mbappé",
  "Julián Álvarez",
  "Erling Haaland",
  "Harry Kane",
  "Vinícius Júnior",
  "Victor Osimhen",
  "Lautaro Martínez",
  "Rasmus Højlund",
  "Benjamin Šeško",
  "Romelu Lukaku",
  "Lamine Yamal",
  "Alexander Isak",
  "Florian Wirtz",
  "Cole Palmer",
  "Gonçalo Ramos",
  "Lionel Messi",
  "Jérémy Doku",
] as const;

export type TopScorerOption = (typeof TOP_SCORER_OPTIONS)[number];

export function isCanonicalTopScorer(name: string | null): name is TopScorerOption {
  return name !== null && (TOP_SCORER_OPTIONS as readonly string[]).includes(name);
}

/**
 * The opening match kickoff — 11 June 2026 21:00 Brussels (19:00 UTC).
 * Tournament-wide picks lock at this moment.
 */
export const TOURNAMENT_LOCK = new Date("2026-06-11T19:00:00Z");

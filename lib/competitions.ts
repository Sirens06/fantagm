import type { Competition, SeasonStats } from "./types";

// Quanto una fantamedia fatta altrove vale in Serie A. Serve perche' un 7.0
// in Serie B e un 7.0 in Serie A non sono lo stesso numero.
export const LEAGUE_WEIGHT: Record<Competition, number> = {
  SERIE_A: 1,
  PREMIER_LEAGUE: 1,
  LA_LIGA: 0.98,
  BUNDESLIGA: 0.95,
  LIGUE_1: 0.92,
  EREDIVISIE: 0.85,
  PRIMEIRA_LIGA: 0.85,
  SERIE_B: 0.75,
  ALTRO: 0.8,
};

// Riporta la fantamedia verso il 6 in proporzione al peso del campionato:
// un 7.0 in Serie B diventa 6.75, un 7.0 in Serie A resta 7.0.
export function normalizedFantaAvg(stat: SeasonStats): number {
  const weight = LEAGUE_WEIGHT[stat.competition] ?? LEAGUE_WEIGHT.ALTRO;
  return 6 + (stat.avRatingFanta - 6) * weight;
}

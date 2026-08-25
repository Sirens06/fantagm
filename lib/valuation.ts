import { Player, Coach, Valuation } from "./types";
import { tacticalFit, clampScore } from "./tacticalFit";
import { normalizedFantaAvg } from "./competitions";
import { recentInjuries } from "./players";

export function evaluatePlayer(player: Player, coach: Coach): Valuation {
  const stats = player.stats;
  const lastSeason = stats.at(-1);

  const recentSeasons = stats.slice(-3);
  const weights = [0.2, 0.3, 0.5].slice(-recentSeasons.length);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const histAvg =
    recentSeasons.length === 0
      ? 6
      : recentSeasons.reduce((acc, s, i) => acc + normalizedFantaAvg(s) * weights[i], 0) / weightSum;

  const trend = lastSeason ? normalizedFantaAvg(lastSeason) - histAvg : 0;

  const tacticalScore = tacticalFit(player, coach);

  const fixtureBonus = (3 - player.team.fixtureDiffNext8) * 0.1;

  const injuries = recentInjuries(player);
  const totalDaysOut = injuries.reduce((acc, injury) => acc + injury.daysOut, 0);
  const injuryMalus = clampScore(totalDaysOut / 200, 0, 0.6);

  // Chi tira i rigori e' un fatto sul presente, non lo si deduce dallo storico:
  // un nuovo arrivato che li prende ha zero rigori l'anno scorso.
  const penaltyBonus = player.isPenaltyTaker ? 0.4 : 0;

  const projectedFantaAvg = clampScore(
    histAvg + trend * 0.5 + (tacticalScore - 50) / 100 + fixtureBonus - injuryMalus + penaltyBonus,
    4.5,
    9.5
  );

  const roleCurve: Record<string, [number, number]> = {
    P: [5.7, 8],
    D: [5.7, 10],
    C: [6.0, 22],
    A: [6.3, 35],
  };
  const [reference, maxPct] = roleCurve[player.role];
  const over = Math.max(0, projectedFantaAvg - reference);
  const suggestedPrice = clampScore(
    Math.round(Math.pow(over + 0.3, 2.1) * (maxPct / 4) * (player.team.reliability / 8)),
    1,
    maxPct * 1.4
  );

  const confidence: Valuation["confidence"] =
    stats.length >= 3 && totalDaysOut < 60 ? "alta" : stats.length >= 2 ? "media" : "bassa";

  return {
    suggestedPrice,
    projectedFantaAvg: Math.round(projectedFantaAvg * 100) / 100,
    confidence,
    breakdown: {
      storico: Math.round(histAvg * 100) / 100,
      trend: Math.round(trend * 100) / 100,
      tattica: tacticalScore,
      calendario: fixtureBonus,
      infortuni: -injuryMalus,
      rigori: penaltyBonus,
    },
  };
}

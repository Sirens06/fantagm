import type { Coach, Player } from "./types";
import { evaluatePlayer } from "./valuation";
import { availabilityFactor } from "./players";
import { normalizedFantaAvg } from "./competitions";

export function projectSeason(
  squad: Player[],
  coaches: Map<string, Coach>,
  remainingMatchdays = 38
): { total: number; perPlayer: { player: Player; expectedPoints: number }[] } {
  const perPlayer = squad.map((p) => {
    const coach = coaches.get(p.team.name);
    const lastSeason = p.stats.at(-1);
    const fantaAvg = coach
      ? evaluatePlayer(p, coach).projectedFantaAvg
      : lastSeason
        ? normalizedFantaAvg(lastSeason)
        : 6;
    const availability = availabilityFactor(p);
    return {
      player: p,
      expectedPoints: Math.round(fantaAvg * remainingMatchdays * availability),
    };
  });

  const sorted = [...perPlayer].sort((a, b) => b.expectedPoints - a.expectedPoints);
  const startingXI = sorted.slice(0, 11).reduce((a, x) => a + x.expectedPoints, 0);
  const bench = sorted.slice(11).reduce((a, x) => a + x.expectedPoints * 0.1, 0);
  return { total: Math.round(startingXI + bench), perPlayer: sorted };
}

import type { Coach, Player, TradeSuggestion } from "./types";
import { tacticalFit, clampScore } from "./tacticalFit";
import { evaluatePlayer } from "./valuation";
import { formaRecente } from "./form";

function clampTrend(n: number): number {
  return clampScore(n, -1, 1);
}

export function suggestTrades(
  playerOut: Player,
  pool: Player[],
  coaches: Map<string, Coach>,
  opts: { limit?: number } = {}
): TradeSuggestion[] {
  const { limit = 5 } = opts;

  return pool
    .filter((p) => p.id !== playerOut.id && p.role === playerOut.role)
    .map((p) => {
      const coach = coaches.get(p.team.name);
      const fit = coach ? tacticalFit(p, coach) : 50;
      const val = coach ? evaluatePlayer(p, coach) : null;

      const outCoach = coaches.get(playerOut.team.name);
      const outVal = outCoach ? evaluatePlayer(playerOut, outCoach) : null;

      // La forma delle ultime giornate se ci sono i dati, altrimenti il
      // confronto fra stagioni: formaRecente() sceglie da sola.
      const forma = formaRecente(p);
      const formTrend = clampTrend(forma.trend);

      const fixtureScore = Math.round((5 - p.team.fixtureDiffNext8) * 25);
      const gain = val && outVal ? val.projectedFantaAvg - outVal.projectedFantaAvg : 0;

      const score =
        fit * 0.35 +
        fixtureScore * 0.25 +
        (formTrend + 1) * 50 * 0.2 +
        p.team.reliability * 10 * 0.1 +
        (gain + 1) * 50 * 0.1;

      const reasons: string[] = [];
      if (fit >= 70) reasons.push(`Perfetto nel ${coach?.formation ?? "modulo"}`);
      if (fixtureScore >= 60) reasons.push("Calendario favorevole");
      if (formTrend > 0.15) {
        reasons.push(
          forma.fonte === "giornate"
            ? `In crescita nelle ultime ${forma.partite}`
            : "Trend in crescita"
        );
      }
      if (formTrend < -0.2 && forma.fonte === "giornate") {
        reasons.push(`In calo nelle ultime ${forma.partite}`);
      }

      return {
        player: p,
        score: Math.round(score),
        reasons,
        tacticalFit: fit,
        fixtureScore,
        formTrend,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

import type { Player, Tier } from "./types";
import { ageOf, recentInjuries } from "./players";
import { normalizedFantaAvg } from "./competitions";

/**
 * Che TIPO di giocatore e', letto dallo storico.
 *
 * Da non confondere con fasciaDa() in pricing.ts, che dice quanto COSTA.
 * Un esotico puo' costare tanto e una certezza poco: sono due domande diverse.
 *
 * L'ordine dei controlli conta. I casi piu' specifici vanno prima, altrimenti
 * un criterio largo se li mangia: e' il motivo per cui "esotico" e
 * "scommessa" prima non uscivano mai.
 */
export function classifyTier(player: Player): Tier {
  const stats = player.stats;
  const seasons = stats.length;
  const lastSeason = stats.at(-1);
  const totalDaysOut = recentInjuries(player).reduce((acc, i) => acc + i.daysOut, 0);

  // 1. Da evitare: fisico fragile o rendimento sotto la sufficienza.
  if (totalDaysOut >= 90) return "sconsigliato";
  if (lastSeason && normalizedFantaAvg(lastSeason) < 5.5) return "sconsigliato";
  if (player.status === "FUORI_ROSA") return "sconsigliato";

  // 2. Certezza: tre stagioni di continuita' vera in Serie A, da titolare.
  const certezza =
    seasons >= 3 &&
    stats.every(
      (s) => s.competition === "SERIE_A" && s.avRatingFanta >= 6.3 && s.startingAppearances >= 25
    ) &&
    totalDaysOut < 45 &&
    player.status === "TITOLARE";
  if (certezza) return "certezza";

  // 3. Esotico: non hai abbastanza storico per giudicarlo, o e' un giovane
  //    che ha reso bene nei pochi minuti avuti. Va PRIMA di equilibrio,
  //    altrimenti chi ha una stagione discreta finisce li' dentro.
  const pocoStorico = seasons <= 1;
  const giovanePromettente =
    ageOf(player.birthDate) <= 22 &&
    !!lastSeason &&
    lastSeason.minutes < 1800 &&
    normalizedFantaAvg(lastSeason) >= 6.2;
  const fuoriSerieA = seasons > 0 && stats.every((s) => s.competition !== "SERIE_A");
  if (pocoStorico || giovanePromettente || fuoriSerieA) return "esotico";

  // 4. Equilibrio: ultima stagione solida e giocata da titolare.
  const equilibrio =
    !!lastSeason &&
    normalizedFantaAvg(lastSeason) >= 6.0 &&
    lastSeason.startingAppearances >= 15 &&
    player.status !== "RISERVA";
  if (equilibrio) return "equilibrio";

  // 5. Il resto: ha giocato, ma non abbastanza o non abbastanza bene.
  return "scommessa";
}

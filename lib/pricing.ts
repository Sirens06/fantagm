import type { Coach, Player, Tier } from "./types";
import { tacticalFit, clampScore } from "./tacticalFit";
import { evaluatePlayer } from "./valuation";
import { recentInjuries } from "./players";

// ---------------------------------------------------------------------------
// DUE MODI DI CALCOLARE IL PREZZO
//
// ANCORATO - quando c'e' la quotazione di listino. E' gia' un prezzo di
// mercato, calibrato sui 500 crediti da chi ha molti piu' dati di noi. Non ha
// senso ignorarla: il valore che aggiungiamo e' dire DOVE ci discostiamo, e
// perche'.
//
// FORMULA - quando la quotazione manca, o durante la stagione con fantamedie
// vere. Allora il prezzo si costruisce da capo, ed e' evaluatePlayer().
//
// Tutto esce in CREDITI, non in percentuale: e' l'unita' in cui si rilancia.
// Il listino e' tarato su 500 crediti, quindi con budget diversi si riscala.
// ---------------------------------------------------------------------------

export const BUDGET_LISTINO = 500;

/** Il moltiplicatore di fascia, dedotto dall'affidabilita' 1-10 del club.
 *  Lo stesso giocatore vale di piu' in una squadra che produce bonus. */
export function moltFascia(reliability: number): number {
  if (reliability >= 9) return 1.15; // top
  if (reliability >= 7) return 1.05; // europa
  if (reliability >= 5) return 0.95; // media
  return 0.85; // salvezza
}

/** Tenuta fisica 0-100 ricavata dalle giornate saltate di recente.
 *  Non e' un campo: e' una lettura degli infortuni. */
export function tenutaDa(player: Player): number {
  const saltate = recentInjuries(player).reduce((acc, i) => acc + i.matchesMissed, 0);
  return Math.round(clampScore(100 - (saltate / 38) * 100, 40, 100));
}

/** Di quanto mi discosto dal listino, fra 0.70 e 1.40.
 *  Sopra 1 = secondo me vale piu' di quanto dice il mercato. */
export function correzioneContesto(player: Player, coach?: Coach): number {
  const fit = coach ? tacticalFit(player, coach) : 50;
  const tenuta = tenutaDa(player);

  const c =
    1 +
    ((fit - 50) / 100) * 0.3 + // rende nel modulo del suo allenatore
    (3 - player.team.fixtureDiffNext8) * 0.06 + // avvio morbido
    (moltFascia(player.team.reliability) - 1) * 0.8 + // squadra che segna
    ((tenuta - 88) / 100) * 0.25 + // affidabilita' fisica
    (player.isPenaltyTaker ? 0.06 : 0); // i rigori sono bonus quasi certi

  return clampScore(c, 0.7, 1.4);
}

/** Prezzo ancorato al listino, in crediti sul budget dato. */
export function prezzoAncorato(player: Player, coach?: Coach, budget = BUDGET_LISTINO): number {
  const quotazione = player.officialPrice ?? 1;
  const scala = budget / BUDGET_LISTINO;
  return Math.max(1, Math.round(quotazione * correzioneContesto(player, coach) * scala));
}

/** Prezzo da formula pura, convertito da percentuale di budget a crediti. */
export function prezzoFormula(player: Player, coach: Coach, budget = BUDGET_LISTINO): number {
  const pct = evaluatePlayer(player, coach).suggestedPrice;
  return Math.max(1, Math.round((pct / 100) * budget));
}

/** Il prezzo consigliato. Sceglie da solo la modalita' giusta. */
export function prezzoConsigliato(player: Player, coach?: Coach, budget = BUDGET_LISTINO): number {
  const haQuotazione = typeof player.officialPrice === "number" && player.officialPrice > 1;
  if (haQuotazione) return prezzoAncorato(player, coach, budget);
  if (coach) return prezzoFormula(player, coach, budget);
  return 1; // niente quotazione e niente allenatore: non ho su cosa basarmi
}

/** Lo scarto dal listino, in crediti. Positivo = vale piu' di quanto costa.
 *  E' questo il numero che fa vincere l'asta. */
export function scarto(player: Player, coach?: Coach, budget = BUDGET_LISTINO): number {
  if (!player.officialPrice || player.officialPrice <= 1) return 0;
  const quotazioneScalata = Math.round(player.officialPrice * (budget / BUDGET_LISTINO));
  return prezzoConsigliato(player, coach, budget) - quotazioneScalata;
}

/** La fascia, dedotta dal prezzo. Le soglie sono tarate su 500 crediti e
 *  si riscalano col budget della stanza. */
export function fasciaDa(prezzo: number, budget = BUDGET_LISTINO): Tier {
  const s = budget / BUDGET_LISTINO;
  if (prezzo >= 30 * s) return "certezza";
  if (prezzo >= 13 * s) return "equilibrio";
  if (prezzo >= 5 * s) return "scommessa";
  return "esotico";
}

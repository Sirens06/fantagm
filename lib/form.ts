import type { MatchPerformance, Player } from "./types";
import { normalizedFantaAvg } from "./competitions";
import { clampScore } from "./tacticalFit";

// ---------------------------------------------------------------------------
// La forma non e' la media della stagione.
//
// SeasonStats dice come e' andato un giocatore in dieci mesi. La forma sono
// le ultime quattro o cinque partite, ed e' l'unica cosa che ti dice se sta
// salendo o crollando adesso.
//
// Con MatchPerformance vuota si ricade sul confronto fra le ultime due
// stagioni: peggio, ma meglio di niente. Il codice non cambia quando i dati
// arrivano, si limita a diventare piu' preciso.
// ---------------------------------------------------------------------------

export type Forma = {
  /** Fantamedia delle ultime partite giocate. Null se non hai dati. */
  media: number | null;
  /** Da -1 (crollo) a +1 (in ascesa). */
  trend: number;
  /** Su quante partite e' calcolata. */
  partite: number;
  /** Da dove viene il numero: serve a sapere quanto fidarsi. */
  fonte: "giornate" | "stagioni" | "nessuna";
};

/** Le partite in cui ha davvero preso un voto, dalla piu' recente. */
function conVoto(matches: MatchPerformance[]): MatchPerformance[] {
  return matches
    .filter((m) => m.played && m.fantaRating !== null && m.fantaRating !== undefined)
    .slice()
    .sort((a, b) =>
      a.season === b.season ? b.matchday - a.matchday : b.season.localeCompare(a.season)
    );
}

function media(valori: number[]): number {
  return valori.reduce((a, b) => a + b, 0) / valori.length;
}

/**
 * La forma recente su una finestra di giornate.
 *
 * Il trend confronta le ultime `giornate` con le `giornate` precedenti:
 * se hai 10 partite e finestra 5, sono le ultime 5 contro le 5 prima.
 */
export function formaRecente(player: Player, giornate = 5): Forma {
  const partite = conVoto(player.matches ?? []);

  if (partite.length >= 2) {
    const recenti = partite.slice(0, giornate);
    const precedenti = partite.slice(giornate, giornate * 2);

    const mediaRecente = media(recenti.map((m) => m.fantaRating!));

    // La differenza grezza si normalizza prima di limitarla. Sulla fantamedia
    // un gol vale +3, quindi due finestre di cinque partite differiscono
    // facilmente di oltre un punto: limitando subito, chiunque sia in forma
    // finirebbe appiattito su +1 e perderesti l'ordine proprio in cima.
    const SPREAD = 2.5;
    const trend =
      precedenti.length > 0
        ? clampScore(
            (mediaRecente - media(precedenti.map((m) => m.fantaRating!))) / SPREAD,
            -1,
            1
          )
        : 0;

    return {
      media: Math.round(mediaRecente * 100) / 100,
      trend: Math.round(trend * 100) / 100,
      partite: recenti.length,
      fonte: "giornate",
    };
  }

  // Ricaduta: confronto fra le ultime due stagioni.
  const stats = player.stats;
  const ultima = stats.at(-1);
  const penultima = stats.length >= 2 ? stats[stats.length - 2] : undefined;

  if (!ultima) return { media: null, trend: 0, partite: 0, fonte: "nessuna" };

  const mediaUltima = normalizedFantaAvg(ultima);
  return {
    media: Math.round(mediaUltima * 100) / 100,
    trend: penultima
      ? Math.round(clampScore(mediaUltima - normalizedFantaAvg(penultima), -1, 1) * 100) / 100
      : 0,
    partite: ultima.appareances,
    fonte: "stagioni",
  };
}

/**
 * Quanto e' continuo: la dispersione delle sue stesse prestazioni.
 * Alto = affidabile, basso = un giorno 7.5 e un giorno 4.5.
 *
 * Si calcola sul VOTO PURO, non sulla fantamedia: un gol vale +3 e farebbe
 * sembrare incostante un attaccante che segna a fasi alterne, che invece e'
 * esattamente quello che vuoi. Qui misuri la prestazione, non i bonus.
 */
export function costanza(player: Player, giornate = 10): number | null {
  const partite = (player.matches ?? [])
    .filter((m) => m.played && m.rating !== null && m.rating !== undefined)
    .slice()
    .sort((a, b) =>
      a.season === b.season ? b.matchday - a.matchday : b.season.localeCompare(a.season)
    )
    .slice(0, giornate);

  if (partite.length < 4) return null;

  const voti = partite.map((m) => m.rating!);
  const m = media(voti);
  const scarto = Math.sqrt(media(voti.map((v) => (v - m) ** 2)));

  // Sui voti puri uno scarto tipo e' 0.5-0.7; oltre 1.2 sei imprevedibile.
  return Math.round(clampScore(100 - (scarto / 1.2) * 100, 0, 100));
}

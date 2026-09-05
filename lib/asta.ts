import { customAlphabet } from "nanoid";
import { db } from "./db";
import { toCoreCoach, toCorePlayer, playerInclude } from "./mappers";
import { prezzoConsigliato, scarto, fasciaDa } from "./pricing";
import type { Coach, GiocatoreDTO, Role, StatoAsta, SquadraDTO } from "./types";

// Niente 0/O e 1/I: si confondono quando qualcuno detta il codice a voce
// in una stanza rumorosa.
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export const auctionRoom = () => `AUC-${nanoid()}`;

/**
 * Il token di chi conduce l'asta.
 *
 * Criterio opposto al codice stanza: quello va dettato a voce, questo va solo
 * copiato — quindi non serve leggibile, serve non indovinabile. Non c'e'
 * login: chi ha questo token puo' aggiudicare al posto tuo.
 *
 * randomUUID() usa il generatore crittografico di Node, a differenza di
 * Math.random() che e' prevedibile se qualcuno ci si mette d'impegno.
 */
export const nuovoAdminToken = () => crypto.randomUUID();


/** Gli allenatori in carica, indicizzati per nome squadra. Serve al motore
 *  prezzi: il fit tattico dipende dal modulo di chi allena adesso. */
export async function mappaAllenatori(): Promise<Map<string, Coach>> {
  const coaches = await db.coach.findMany({
    where: { isCurrent: true },
    include: { team: true },
  });
  return new Map(coaches.map(toCoreCoach).map((c) => [c.team.name, c]));
}

/** Il DTO di un giocatore per la sala d'asta. */
export async function giocatoreDTO(
  playerId: string,
  budget: number,
  venduto = false,
  coachMap?: Map<string, Coach>
): Promise<GiocatoreDTO | null> {
  const row = await db.player.findUnique({ where: { id: playerId }, include: playerInclude });
  if (!row) return null;

  const player = toCorePlayer(row);
  const coaches = coachMap ?? (await mappaAllenatori());
  const coach = coaches.get(player.team.name);
  const prezzo = prezzoConsigliato(player, coach, budget);

  return {
    id: player.id,
    nome: player.name,
    squadra: player.team.name,
    ruolo: player.role,
    quotazione: player.officialPrice ?? null,
    prezzoConsigliato: prezzo,
    scarto: scarto(player, coach, budget),
    fascia: fasciaDa(prezzo, budget),
    venduto,
  };
}

/**
 * Lo stato completo dell'asta, in una query sola.
 *
 * E' il punto unico che alimenta il polling: tutte le route di azione
 * restituiscono questo, cosi' chi agisce vede subito il risultato senza
 * aspettare il giro successivo.
 */
export async function costruisciStato(codice: string): Promise<StatoAsta | null> {
  const stanza = await db.stanza.findUnique({
    where: { codice },
    include: {
      squadre: { orderBy: { nome: "asc" } },
      acquisti: true,
      lotti: {
        where: { stato: "APERTO" },
        take: 1,
        orderBy: { apertoIl: "desc" },
        include: {
          leader: true,
          rilanci: { orderBy: { quando: "asc" }, include: { squadra: true } },
        },
      },
    },
  });

  if (!stanza) return null;

  const slotMax: Record<Role, number> = {
    P: stanza.slotP,
    D: stanza.slotD,
    C: stanza.slotC,
    A: stanza.slotA,
  };

  const squadre: SquadraDTO[] = stanza.squadre.map((s) => {
    const suoi = stanza.acquisti.filter((a) => a.squadraId === s.id);
    const slot: Record<Role, number> = { P: 0, D: 0, C: 0, A: 0 };
    let spesa = 0;
    for (const a of suoi) {
      slot[a.ruolo as Role]++;
      spesa += a.prezzo;
    }
    return { id: s.id, nome: s.nome, budget: s.budget, spesa, slot };
  });

  const l = stanza.lotti[0];
  let lotto: StatoAsta["lotto"] = null;

  if (l) {
    const giocatore = await giocatoreDTO(l.playerId, stanza.budget, false);
    if (giocatore) {
      lotto = {
        id: l.id,
        giocatore,
        offerta: l.offerta,
        leader: l.leader ? { id: l.leader.id, nome: l.leader.nome } : null,
        rilanci: l.rilanci.map((r) => ({
          squadraId: r.squadraId,
          squadraNome: r.squadra.nome,
          importo: r.importo,
          quando: r.quando.toISOString(),
        })),
      };
    }
  }

  return {
    codice: stanza.codice,
    nome: stanza.nome,
    stato: stanza.stato,
    budget: stanza.budget,
    slotMax,
    maxSquadre: stanza.maxSquadre,
    lotto,
    squadre,
    aggiornatoIl: new Date().toISOString(),
  };
}

/** Risposta d'errore uniforme: un codice per il programma, un messaggio
 *  per chi sta guardando lo schermo. */
export function errore(codice: string, messaggio: string, status: number) {
  return Response.json({ errore: codice, messaggio }, { status });
}

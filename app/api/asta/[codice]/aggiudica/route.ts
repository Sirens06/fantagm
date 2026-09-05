import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { costruisciStato, errore } from "@/lib/asta";

import { rotta } from "@/lib/api";
async function postHandler(req: NextRequest, ctx: { params: Promise<{ codice: string }> }) {
  const { codice } = await ctx.params;
  const { adminToken } = await req.json().catch(() => ({}));

  const stanza = await db.stanza.findUnique({
    where: { codice },
    include: {
      lotti: {
        where: { stato: "APERTO" },
        take: 1,
        orderBy: { apertoIl: "desc" },
        include: { player: true },
      },
    },
  });
  if (!stanza) return errore("stanza_non_trovata", "Codice non valido", 404);

  if (stanza.adminToken !== adminToken) {
    return errore("non_autorizzato", "Solo chi conduce puo' aggiudicare", 403);
  }

  const lotto = stanza.lotti[0];
  if (!lotto) return errore("nessun_lotto", "Nessun giocatore in asta", 400);
  if (!lotto.leaderId || lotto.offerta < 1) {
    return errore("nessuna_offerta", "Serve almeno un rilancio", 400);
  }

  // Le tre operazioni devono stare insieme. Se creassi l'acquisto e il server
  // cadesse prima di scalare il budget, quella squadra avrebbe un giocatore
  // gratis. La transazione lo rende impossibile.
  await db.$transaction([
    db.acquisto.create({
      data: {
        stanzaId: stanza.id,
        squadraId: lotto.leaderId,
        playerId: lotto.playerId,
        prezzo: lotto.offerta,
        ruolo: lotto.player.role,
      },
    }),
    db.squadra.update({
      where: { id: lotto.leaderId },
      data: { budget: { decrement: lotto.offerta } },
    }),
    db.lotto.update({ where: { id: lotto.id }, data: { stato: "CHIUSO" } }),
  ]);

  return NextResponse.json(await costruisciStato(codice));
}

export const POST = rotta(postHandler);

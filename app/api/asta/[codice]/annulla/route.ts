import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { costruisciStato, errore } from "@/lib/asta";

import { rotta } from "@/lib/api";
// Chiamo un giocatore, nessuno lo vuole, passo al prossimo.
async function postHandler(req: NextRequest, ctx: { params: Promise<{ codice: string }> }) {
  const { codice } = await ctx.params;
  const { adminToken } = await req.json().catch(() => ({}));

  const stanza = await db.stanza.findUnique({ where: { codice } });
  if (!stanza) return errore("stanza_non_trovata", "Codice non valido", 404);
  if (stanza.adminToken !== adminToken) {
    return errore("non_autorizzato", "Solo chi conduce puo' annullare un lotto", 403);
  }

  const esito = await db.lotto.updateMany({
    where: { stanzaId: stanza.id, stato: "APERTO" },
    data: { stato: "ANNULLATO" },
  });
  if (esito.count === 0) return errore("nessun_lotto", "Nessun giocatore in asta", 400);

  return NextResponse.json(await costruisciStato(codice));
}

export const POST = rotta(postHandler);

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { costruisciStato, errore } from "@/lib/asta";

export async function POST(req: NextRequest, ctx: { params: Promise<{ codice: string }> }) {
  const { codice } = await ctx.params;
  const { playerId, adminToken } = await req.json().catch(() => ({}));

  const stanza = await db.stanza.findUnique({ where: { codice } });
  if (!stanza) return errore("stanza_non_trovata", "Codice non valido", 404);

  if (stanza.adminToken !== adminToken) {
    return errore("non_autorizzato", "Solo chi conduce puo' aprire un lotto", 403);
  }
  if (stanza.stato === "FINITA") {
    return errore("asta_finita", "Questa asta e' gia' terminata", 400);
  }

  const player = await db.player.findUnique({ where: { id: String(playerId ?? "") } });
  if (!player) return errore("giocatore_non_trovato", "Giocatore inesistente", 404);

  const giaVenduto = await db.acquisto.findUnique({
    where: { stanzaId_playerId: { stanzaId: stanza.id, playerId: player.id } },
  });
  if (giaVenduto) {
    return errore("gia_venduto", `${player.name} e' gia' stato assegnato`, 400);
  }

  // Le tre cose devono succedere insieme, altrimenti si finisce con due
  // lotti aperti e l'asta perde il filo.
  await db.$transaction([
    db.lotto.updateMany({
      where: { stanzaId: stanza.id, stato: "APERTO" },
      data: { stato: "ANNULLATO" },
    }),
    db.lotto.create({
      data: { stanzaId: stanza.id, playerId: player.id, stato: "APERTO", offerta: 0 },
    }),
    db.stanza.update({ where: { id: stanza.id }, data: { stato: "CORSO" } }),
  ]);

  return NextResponse.json(await costruisciStato(codice));
}

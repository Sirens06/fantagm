import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { costruisciStato, errore } from "@/lib/asta";
import type { Role } from "@/lib/types";

export async function POST(req: NextRequest, ctx: { params: Promise<{ codice: string }> }) {
  const { codice } = await ctx.params;
  const { squadraId, importo } = await req.json().catch(() => ({}));

  // 1. L'importo e' un intero positivo?
  const offerta = Math.round(Number(importo));
  if (!Number.isFinite(offerta) || offerta < 1) {
    return errore("importo_non_valido", "Inserisci un numero intero positivo", 400);
  }

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

  // 2. C'e' un lotto aperto?
  const lotto = stanza.lotti[0];
  if (!lotto) return errore("nessun_lotto", "Nessun giocatore in asta", 400);

  // 3. La squadra appartiene a questa stanza?
  const squadra = await db.squadra.findUnique({ where: { id: String(squadraId ?? "") } });
  if (!squadra || squadra.stanzaId !== stanza.id) {
    return errore("squadra_non_valida", "Squadra non riconosciuta", 400);
  }

  // 4. Ce li ha, i crediti?
  if (offerta > squadra.budget) {
    return errore("budget_insufficiente", `Hai ${squadra.budget} crediti`, 400);
  }

  const ruolo = lotto.player.role as Role;
  const slotMax = { P: stanza.slotP, D: stanza.slotD, C: stanza.slotC, A: stanza.slotA }[ruolo];
  const acquisti = await db.acquisto.findMany({ where: { squadraId: squadra.id } });

  // 5. Lo slot del ruolo e' gia' pieno?
  const nelRuolo = acquisti.filter((a) => a.ruolo === ruolo).length;
  if (nelRuolo >= slotMax) {
    return errore("slot_pieni", `Hai gia' ${slotMax} giocatori in questo ruolo`, 400);
  }

  // 6. Gli resterebbero crediti per riempire la rosa?
  // E' il controllo che nessuno pensa di mettere e che salva l'asta: con 40
  // crediti e 15 slot vuoti non puoi spenderne 38 su un giocatore solo.
  const slotTotali = stanza.slotP + stanza.slotD + stanza.slotC + stanza.slotA;
  const slotDaRiempire = slotTotali - acquisti.length - 1;
  if (squadra.budget - offerta < slotDaRiempire) {
    return errore(
      "rosa_incompletabile",
      `Ti servono almeno ${slotDaRiempire} crediti per gli altri slot`,
      400
    );
  }

  // 7. Il cuore. Aggiorno solo se l'offerta e' ancora piu' bassa della mia:
  // Postgres esegue questa updateMany in modo atomico, mettendo un lucchetto
  // sulla riga. Se due rilanciano nello stesso istante, il secondo trova la
  // condizione falsa e count vale 0. Leggere-confrontare-scrivere invece
  // lascerebbe una finestra in cui l'altro passa.
  //
  // Update e cronologia stanno nella stessa transazione: se la seconda
  // fallisse da sola, l'offerta salirebbe senza che risulti chi l'ha fatta.
  const vinto = await db.$transaction(async (tx) => {
    const esito = await tx.lotto.updateMany({
      where: { id: lotto.id, stato: "APERTO", offerta: { lt: offerta } },
      data: { offerta, leaderId: squadra.id },
    });

    if (esito.count === 0) return false;

    await tx.rilancio.create({
      data: { lottoId: lotto.id, squadraId: squadra.id, importo: offerta },
    });
    return true;
  });

  if (!vinto) {
    const fresco = await db.lotto.findUnique({ where: { id: lotto.id } });
    return errore(
      "offerta_superata",
      `Qualcuno ti ha preceduto: siamo a ${fresco?.offerta ?? "?"}`,
      409
    );
  }

  return NextResponse.json(await costruisciStato(codice));
}

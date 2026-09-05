import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errore } from "@/lib/asta";

import { rotta } from "@/lib/api";
async function postHandler(req: NextRequest, ctx: { params: Promise<{ codice: string }> }) {
  const { codice } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const nome = String(body.nomeSquadra ?? "").trim().slice(0, 40);
  if (!nome) {
    return errore("nome_mancante", "Scegli un nome per la tua squadra", 400);
  }

  const stanza = await db.stanza.findUnique({ where: { codice } });
  if (!stanza) {
    return errore("stanza_non_trovata", "Codice non valido", 404);
  }

  // Se il nome esiste gia' restituisco quella squadra invece di rifiutare:
  // e' cosi' che chi ricarica la pagina a meta' asta si ritrova al suo posto,
  // senza login.
  const esistente = await db.squadra.findUnique({
    where: { stanzaId_nome: { stanzaId: stanza.id, nome } },
  });
  if (esistente) {
    return NextResponse.json({
      squadraId: esistente.id,
      nome: esistente.nome,
      budget: esistente.budget,
      rientro: true,
    });
  }

  if (stanza.stato === "FINITA") {
    return errore("asta_finita", "Questa asta e' gia' terminata", 400);
  }

  // Il tetto e la creazione stanno nella stessa transazione, e serializzata:
  // otto persone inquadrano il QR nello stesso momento, e con il conteggio
  // fuori dalla transazione due di loro lo leggerebbero entrambe a 7 e
  // creerebbero la nona squadra. Postgres qui fa fallire la seconda.
  //
  // Nota l'ordine: il rientro di chi c'e' gia' e' passato piu' sopra e non
  // arriva mai qui. A stanza piena chi ricarica il telefono rientra sempre.
  let squadra;
  try {
    squadra = await db.$transaction(
      async (tx) => {
        const quante = await tx.squadra.count({ where: { stanzaId: stanza.id } });
        if (quante >= stanza.maxSquadre) return null;
        return tx.squadra.create({
          data: { stanzaId: stanza.id, nome, budget: stanza.budget },
        });
      },
      { isolationLevel: "Serializable" }
    );
  } catch {
    return errore("stanza_affollata", "Troppe registrazioni insieme, riprova", 409);
  }

  if (!squadra) {
    return errore(
      "stanza_piena",
      `La stanza e' al completo: ci sono gia' ${stanza.maxSquadre} squadre`,
      409
    );
  }

  return NextResponse.json({
    squadraId: squadra.id,
    nome: squadra.nome,
    budget: squadra.budget,
    rientro: false,
  });
}

export const POST = rotta(postHandler);

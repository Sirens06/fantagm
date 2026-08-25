import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errore } from "@/lib/asta";

export async function POST(req: NextRequest, ctx: { params: Promise<{ codice: string }> }) {
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

  const squadra = await db.squadra.create({
    data: { stanzaId: stanza.id, nome, budget: stanza.budget },
  });

  return NextResponse.json({
    squadraId: squadra.id,
    nome: squadra.nome,
    budget: squadra.budget,
    rientro: false,
  });
}

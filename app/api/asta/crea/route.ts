import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auctionRoom, nuovoAdminToken, errore } from "@/lib/asta";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const nome = String(body.nome ?? "Asta").trim().slice(0, 60) || "Asta";
  const budget = Math.max(50, Math.min(5000, Number(body.budget) || 1000));

  const slot = (v: unknown, fallback: number) =>
    Math.max(0, Math.min(30, Number(v) || fallback));

  const slotP = slot(body.slotP, 3);
  const slotD = slot(body.slotD, 8);
  const slotC = slot(body.slotC, 8);
  const slotA = slot(body.slotA, 6);

  // Il tetto di squadre. Minimo due, altrimenti non e' un'asta.
  const maxSquadre = Math.max(2, Math.min(20, Number(body.maxSquadre) || 8));

  if (slotP + slotD + slotC + slotA === 0) {
    return errore("slot_vuoti", "La rosa non puo' essere di zero giocatori", 400);
  }
  if (slotP + slotD + slotC + slotA > budget) {
    return errore(
      "budget_insufficiente",
      `Con ${budget} crediti non riempi ${slotP + slotD + slotC + slotA} slot: serve almeno 1 credito a giocatore`,
      400
    );
  }

  const stanza = await db.stanza.create({
    data: {
      codice: auctionRoom(),
      adminToken: nuovoAdminToken(),
      nome,
      budget,
      slotP,
      slotD,
      slotC,
      slotA,
      maxSquadre,
    },
  });

  // adminToken esce SOLO qui. Il GET dello stato non lo espone mai, e se lo
  // perdi si recupera solo da `npx prisma studio`. Salvalo.
  return NextResponse.json({
    codice: stanza.codice,
    nome: stanza.nome,
    budget: stanza.budget,
    slotMax: { P: stanza.slotP, D: stanza.slotD, C: stanza.slotC, A: stanza.slotA },
    maxSquadre: stanza.maxSquadre,
    adminToken: stanza.adminToken,
  });
}

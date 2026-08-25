import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nuovoCodice, errore } from "@/lib/asta";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const nome = String(body.nome ?? "Asta").trim().slice(0, 60) || "Asta";
  const budget = Math.max(50, Math.min(2000, Number(body.budget) || 500));

  const slot = (v: unknown, fallback: number) =>
    Math.max(0, Math.min(30, Number(v) || fallback));

  const slotP = slot(body.slotP, 3);
  const slotD = slot(body.slotD, 8);
  const slotC = slot(body.slotC, 8);
  const slotA = slot(body.slotA, 6);

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
    data: { codice: nuovoCodice(), nome, budget, slotP, slotD, slotC, slotA },
  });

  // adminToken esce SOLO qui. Salvalo, non lo rivedrai piu' da nessuna API.
  return NextResponse.json({
    codice: stanza.codice,
    nome: stanza.nome,
    budget: stanza.budget,
    adminToken: stanza.adminToken,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { costruisciStato, errore } from "@/lib/asta";

import { rotta } from "@/lib/api";
// Senza questo Vercel mette in cache la risposta e tutti vedono l'asta
// congelata. Non e' opzionale.
export const dynamic = "force-dynamic";

async function getHandler(_req: NextRequest, ctx: { params: Promise<{ codice: string }> }) {
  const { codice } = await ctx.params;
  const stato = await costruisciStato(codice);

  if (!stato) {
    return errore("stanza_non_trovata", "Codice non valido", 404);
  }

  return NextResponse.json(stato, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export const GET = rotta(getHandler);

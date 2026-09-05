import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCorePlayer, playerInclude } from "@/lib/mappers";
import { mappaAllenatori, errore } from "@/lib/asta";
import { projectSeason } from "@/lib/projection";
import { prezzoConsigliato } from "@/lib/pricing";
import type { Role } from "@/lib/types";

import { rotta } from "@/lib/api";
export const dynamic = "force-dynamic";

// La rosa di una squadra, con i punti attesi a fine stagione.
//
//   /api/asta/[codice]/rosa?squadraId=...
//
// Non serve un modello nuovo: durante l'asta la rosa SONO gli acquisti.
// Per una rosa ipotetica fuori dall'asta c'e' gia' POST /api/projection,
// che accetta una lista di id.
async function getHandler(req: NextRequest, ctx: { params: Promise<{ codice: string }> }) {
  const { codice } = await ctx.params;
  const squadraId = req.nextUrl.searchParams.get("squadraId");
  if (!squadraId) return errore("squadraid_mancante", "Serve il parametro squadraId", 400);

  const stanza = await db.stanza.findUnique({ where: { codice } });
  if (!stanza) return errore("stanza_non_trovata", "Codice non valido", 404);

  const squadra = await db.squadra.findUnique({ where: { id: squadraId } });
  if (!squadra || squadra.stanzaId !== stanza.id) {
    return errore("squadra_non_valida", "Squadra non riconosciuta", 404);
  }

  const acquisti = await db.acquisto.findMany({
    where: { squadraId },
    include: { player: { include: playerInclude } },
    orderBy: [{ ruolo: "asc" }, { prezzo: "desc" }],
  });

  const coaches = await mappaAllenatori();
  const giocatori = acquisti.map((a) => toCorePlayer(a.player));
  const proiezione = projectSeason(giocatori, coaches);
  const puntiPerId = new Map(proiezione.perPlayer.map((x) => [x.player.id, x.expectedPoints]));

  const slot: Record<Role, number> = { P: 0, D: 0, C: 0, A: 0 };
  for (const a of acquisti) slot[a.ruolo as Role]++;

  const slotMax: Record<Role, number> = {
    P: stanza.slotP,
    D: stanza.slotD,
    C: stanza.slotC,
    A: stanza.slotA,
  };

  return NextResponse.json({
    squadra: {
      id: squadra.id,
      nome: squadra.nome,
      budget: squadra.budget,
      spesa: acquisti.reduce((t, a) => t + a.prezzo, 0),
      slot,
      slotMax,
      completa: (Object.keys(slot) as Role[]).every((r) => slot[r] >= slotMax[r]),
    },
    rosa: acquisti.map((a) => {
      const p = toCorePlayer(a.player);
      const coach = coaches.get(p.team.name);
      return {
        id: p.id,
        nome: p.name,
        squadra: p.team.name,
        ruolo: a.ruolo,
        prezzo: a.prezzo,
        consigliato: prezzoConsigliato(p, coach, stanza.budget),
        // Positivo = l'hai pagato meno di quanto vale.
        affare: prezzoConsigliato(p, coach, stanza.budget) - a.prezzo,
        puntiAttesi: puntiPerId.get(p.id) ?? 0,
        status: p.status,
      };
    }),
    puntiAttesi: proiezione.total,
  });
}

export const GET = rotta(getHandler);

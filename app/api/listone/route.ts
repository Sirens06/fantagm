import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCorePlayer, playerInclude } from "@/lib/mappers";
import { mappaAllenatori } from "@/lib/asta";
import { prezzoConsigliato, scarto, fasciaDa } from "@/lib/pricing";
import type { GiocatoreDTO, Role } from "@/lib/types";

import { rotta } from "@/lib/api";
export const dynamic = "force-dynamic";

// Il listone con il prezzo consigliato. Lo usa il conduttore per cercare chi
// chiamare, e la pagina scouting per sfogliare.
//
//   /api/listone?q=lauta&ruolo=A&stanzaId=...&take=60
//
// Con stanzaId marca chi e' gia' stato venduto in quell'asta.
async function getHandler(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const ruolo = sp.get("ruolo") as Role | null;
  // 600 e' il listone intero: la pagina che lo sfoglia lo chiede in un colpo
  // solo. Il default resta piccolo perche' la ricerca del banditore vuole
  // dieci righe, non seicento.
  const take = Math.min(600, Math.max(1, Number(sp.get("take")) || 60));
  const skip = Math.max(0, Number(sp.get("skip")) || 0);

  // La stanza si indica per id o per codice: il browser conosce solo il
  // secondo, che e' quello che sta nell'URL della sala d'asta.
  const idParam = sp.get("stanzaId");
  const codiceParam = sp.get("codice");
  const stanza =
    idParam || codiceParam
      ? await db.stanza.findUnique({
          where: idParam ? { id: idParam } : { codice: codiceParam! },
          select: { id: true, budget: true },
        })
      : null;
  const stanzaId = stanza?.id ?? null;
  // Senza stanza i prezzi si calcolano sul budget di lega: il consigliato
  // scala col budget, quindi la stessa cifra su 500 varrebbe il doppio.
  const budget = stanza?.budget ?? 1000;

  const players = await db.player.findMany({
    where: {
      ...(ruolo && ["P", "D", "C", "A"].includes(ruolo) ? { role: ruolo } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { team: { name: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: playerInclude,
    orderBy: [{ officialPrice: "desc" }, { name: "asc" }],
    take,
    skip,
  });

  const venduti = stanzaId
    ? new Set(
        (
          await db.acquisto.findMany({
            where: { stanzaId },
            select: { playerId: true },
          })
        ).map((a) => a.playerId)
      )
    : new Set<string>();

  const coaches = await mappaAllenatori();

  const dto: GiocatoreDTO[] = players.map((row) => {
    const p = toCorePlayer(row);
    const coach = coaches.get(p.team.name);
    const prezzo = prezzoConsigliato(p, coach, budget);
    return {
      id: p.id,
      nome: p.name,
      squadra: p.team.name,
      ruolo: p.role,
      quotazione: p.officialPrice ?? null,
      prezzoConsigliato: prezzo,
      scarto: scarto(p, coach, budget),
      fascia: fasciaDa(prezzo, budget),
      venduto: venduti.has(p.id),
    };
  });

  return NextResponse.json(dto, { headers: { "Cache-Control": "no-store" } });
}

export const GET = rotta(getHandler);

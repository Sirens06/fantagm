import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCorePlayer, playerInclude } from "@/lib/mappers";
import { mappaAllenatori } from "@/lib/asta";
import { prezzoConsigliato, scarto, fasciaDa } from "@/lib/pricing";
import type { GiocatoreDTO, Role } from "@/lib/types";

export const dynamic = "force-dynamic";

// Il listone con il prezzo consigliato. Lo usa il conduttore per cercare chi
// chiamare, e la pagina scouting per sfogliare.
//
//   /api/listone?q=lauta&ruolo=A&stanzaId=...&take=60
//
// Con stanzaId marca chi e' gia' stato venduto in quell'asta.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const ruolo = sp.get("ruolo") as Role | null;
  const stanzaId = sp.get("stanzaId");
  const take = Math.min(200, Math.max(1, Number(sp.get("take")) || 60));

  const stanza = stanzaId
    ? await db.stanza.findUnique({ where: { id: stanzaId }, select: { budget: true } })
    : null;
  const budget = stanza?.budget ?? 500;

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

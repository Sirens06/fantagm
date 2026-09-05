import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCorePlayer, playerInclude } from "@/lib/mappers";
import { mappaAllenatori, errore } from "@/lib/asta";
import { evaluatePlayer } from "@/lib/valuation";
import { classifyTier } from "@/lib/tiers";
import { rotta } from "@/lib/api";
import {
  prezzoConsigliato,
  prezzoAncorato,
  prezzoFormula,
  correzioneContesto,
  scarto,
  fasciaDa,
  BUDGET_LISTINO,
} from "@/lib/pricing";

export const dynamic = "force-dynamic";

// La scheda completa di un giocatore.
//
//   /api/valuation?playerId=...&budget=500
//
// Il prezzo esce da pricing.ts, lo stesso modulo che usa la sala d'asta:
// una sola verita' su quanto vale un giocatore. Il breakdown di
// evaluatePlayer resta perche' spiega il perche', non il quanto.
async function getHandler(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) return errore("playerid_mancante", "Serve il parametro playerId", 400);

  const budget = Math.max(50, Math.min(2000, Number(req.nextUrl.searchParams.get("budget")) || BUDGET_LISTINO));

  const [row, coaches] = await Promise.all([
    db.player.findUnique({ where: { id: playerId }, include: playerInclude }),
    mappaAllenatori(),
  ]);

  if (!row) return errore("giocatore_non_trovato", "Giocatore inesistente", 404);

  const player = toCorePlayer(row);
  const coach = coaches.get(player.team.name);

  const prezzo = prezzoConsigliato(player, coach, budget);
  const modalita = player.officialPrice && player.officialPrice > 1 ? "ancorato" : "formula";

  return NextResponse.json({
    player,
    prezzo: {
      consigliato: prezzo,
      modalita,
      quotazione: player.officialPrice ?? null,
      scarto: scarto(player, coach, budget),
      correzione: Math.round(correzioneContesto(player, coach) * 100) / 100,
      budget,
      // Le due modalita' affiancate: utile per capire quanto il listino e la
      // formula la pensano diversamente.
      ancorato: player.officialPrice ? prezzoAncorato(player, coach, budget) : null,
      formula: coach ? prezzoFormula(player, coach, budget) : null,
    },
    // Due domande diverse: "fascia" e' quanto costa, "tier" e' che tipo di
    // giocatore e'. Un esotico puo' costare caro, una certezza poco.
    fascia: fasciaDa(prezzo, budget),
    tier: classifyTier(player),
    // Il perche': fantamedia storica, trend, fit tattico, calendario,
    // infortuni, rigori. Richiede l'allenatore.
    breakdown: coach ? evaluatePlayer(player, coach) : null,
  });
}

export const GET = rotta(getHandler);

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseListone, normalizza } from "@/lib/listone";
import { errore } from "@/lib/asta";

import { rotta } from "@/lib/api";
// 600 giocatori richiedono tempo: il default di 10s non basta.
export const maxDuration = 60;

async function postHandler(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || typeof file === "string") {
    return errore("file_mancante", "Nessun file caricato", 400);
  }

  const esito = parseListone(await file.arrayBuffer());

  if (esito.righe.length === 0) {
    return NextResponse.json(
      {
        errore: "listone_illeggibile",
        messaggio: esito.scartate[0]?.motivo ?? "Nessuna riga valida nel file",
        colonneTrovate: esito.colonneTrovate,
      },
      { status: 400 }
    );
  }

  const teams = await db.team.findMany({ select: { id: true, name: true } });
  const teamByName = new Map(teams.map((t) => [normalizza(t.name), t.id]));

  let creati = 0;
  let aggiornati = 0;
  const squadreIgnote = new Set<string>();
  const scartate = [...esito.scartate];

  for (const r of esito.righe) {
    const teamId = teamByName.get(normalizza(r.squadra));
    if (!teamId) {
      squadreIgnote.add(r.squadra);
      scartate.push({ riga: 0, motivo: `${r.nome}: squadra "${r.squadra}" non a database` });
      continue;
    }

    // Aggancio per externalId, in mancanza per nome ignorando le maiuscole:
    // il listone li scrive tutti in maiuscolo.
    const esistente =
      (r.externalId ? await db.player.findUnique({ where: { externalId: r.externalId } }) : null) ??
      (await db.player.findFirst({
        where: { teamId, name: { equals: r.nome, mode: "insensitive" } },
      }));

    if (esistente) {
      await db.player.update({
        where: { id: esistente.id },
        // Il nome non lo tocco: il listone e' tutto maiuscolo e in interfaccia
        // si legge peggio di quello che c'e' gia'.
        data: { teamId, role: r.ruolo, officialPrice: r.quotazione, externalId: r.externalId },
      });
      aggiornati++;
    } else {
      await db.player.create({
        data: {
          name: r.nome,
          teamId,
          role: r.ruolo,
          officialPrice: r.quotazione,
          externalId: r.externalId,
          // Il listone non dice altro. Valori neutri, li arricchiscono le
          // altre fonti quando ci saranno.
          birthDate: new Date("2000-01-01T00:00:00.000Z"),
          detailedPosition: "",
          prFormation: [],
        },
      });
      creati++;
    }
  }

  return NextResponse.json({
    creati,
    aggiornati,
    scartate: scartate.length,
    dettaglioScarti: scartate.slice(0, 20),
    squadreIgnote: [...squadreIgnote],
    colonneTrovate: esito.colonneTrovate,
  });
}

export const POST = rotta(postHandler);

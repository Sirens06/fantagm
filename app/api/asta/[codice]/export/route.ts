import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { errore } from "@/lib/asta";

const ORDINE = { P: 0, D: 1, C: 2, A: 3 } as const;

export async function GET(_req: NextRequest, ctx: { params: Promise<{ codice: string }> }) {
  const { codice } = await ctx.params;

  const stanza = await db.stanza.findUnique({
    where: { codice },
    include: {
      squadre: {
        orderBy: { nome: "asc" },
        include: {
          acquisti: { include: { player: { include: { team: true } } } },
        },
      },
    },
  });

  if (!stanza) return errore("stanza_non_trovata", "Codice non valido", 404);
  if (stanza.squadre.length === 0) {
    return errore("nessuna_squadra", "Non e' entrato nessuno in questa asta", 400);
  }

  const wb = XLSX.utils.book_new();

  for (const s of stanza.squadre) {
    const righe: Record<string, string | number>[] = s.acquisti
      .slice()
      .sort(
        (a, b) =>
          ORDINE[a.ruolo as keyof typeof ORDINE] - ORDINE[b.ruolo as keyof typeof ORDINE] ||
          b.prezzo - a.prezzo
      )
      .map((a) => ({
        Ruolo: a.ruolo,
        Nome: a.player.name,
        Squadra: a.player.team.name,
        Quotazione: a.player.officialPrice ?? "",
        Prezzo: a.prezzo,
      }));

    const spesa = s.acquisti.reduce((t, a) => t + a.prezzo, 0);
    righe.push({ Ruolo: "", Nome: "TOTALE SPESO", Squadra: "", Quotazione: "", Prezzo: spesa });
    righe.push({ Ruolo: "", Nome: "RESIDUO", Squadra: "", Quotazione: "", Prezzo: s.budget });

    const ws = XLSX.utils.json_to_sheet(righe);
    // I nomi dei fogli Excel non possono superare 31 caratteri.
    XLSX.utils.book_append_sheet(wb, ws, s.nome.slice(0, 31));
  }

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rose-${codice}.xlsx"`,
    },
  });
}

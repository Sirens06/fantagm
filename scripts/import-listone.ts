import "dotenv/config";
import { readFileSync } from "node:fs";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

// Importa il listone ufficiale (Fantacalcio.it) da CSV.
//
//   npm run import:listone -- percorso/al/listone.csv
//
// Il file scaricato e' .xlsx: aprilo e salva come CSV. Le colonne attese sono
// quelle standard del listone, in qualunque ordine:
//
//   Id | R | RM | Nome | Squadra | Qt.A | Qt.I | Diff. | ... | FVM
//
// L'import e' idempotente: aggancia i giocatori per Id del listone
// (-> externalId) e in mancanza per nome+squadra. Rilanciarlo aggiorna
// le quotazioni invece di duplicare.
//
// NON tocca statistiche, infortuni e calendario: quelli hanno altre fonti.

const ALIASES: Record<string, string> = {
  verona: "Hellas Verona",
  "hellas verona": "Hellas Verona",
  inter: "Inter",
  milan: "Milan",
  juve: "Juventus",
  juventus: "Juventus",
  napoli: "Napoli",
};

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Il separatore va deciso una volta sola sull'intero file: la colonna RM
// contiene i ruoli Mantra separati da ';' ("T;C"), quindi trattare sia ','
// che ';' come delimitatori spezzerebbe quel campo.
function detectDelimiter(text: string): string {
  const line = text.split("\n").find((l) => l.trim() !== "") ?? "";
  return (line.match(/;/g)?.length ?? 0) > (line.match(/,/g)?.length ?? 0) ? ";" : ",";
}

// Parser CSV minimale ma corretto sui campi quotati.
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function findHeaderRow(rows: string[][]): number {
  return rows.findIndex((r) => {
    const cells = r.map(normalize);
    return cells.includes("nome") && cells.includes("squadra");
  });
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Uso: npm run import:listone -- percorso/al/listone.csv");
    process.exit(1);
  }

  const text = readFileSync(path, "utf8");
  const rows = parseCsv(text, detectDelimiter(text));
  const headerIndex = findHeaderRow(rows);
  if (headerIndex === -1) {
    console.error("Intestazione non trovata: servono almeno le colonne 'Nome' e 'Squadra'.");
    process.exit(1);
  }

  const header = rows[headerIndex].map(normalize);
  const col = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(normalize(n));
      if (i !== -1) return i;
    }
    return -1;
  };

  const iId = col("id");
  const iRole = col("r", "ruolo");
  const iName = col("nome");
  const iTeam = col("squadra");
  const iPrice = col("qt.a", "qta", "qt. a", "quotazione");

  if (iName === -1 || iTeam === -1 || iRole === -1) {
    console.error("Mancano colonne obbligatorie: Nome, Squadra, R.");
    process.exit(1);
  }

  const teams = await db.team.findMany({ select: { id: true, name: true } });
  const teamByName = new Map(teams.map((t) => [normalize(t.name), t.id]));

  const resolveTeam = (raw: string): string | undefined => {
    const key = normalize(raw);
    const alias = ALIASES[key];
    return teamByName.get(alias ? normalize(alias) : key);
  };

  let created = 0;
  let updated = 0;
  const skipped: string[] = [];
  const unknownTeams = new Set<string>();

  for (const row of rows.slice(headerIndex + 1)) {
    const name = row[iName]?.trim();
    const rawTeam = row[iTeam]?.trim();
    const role = row[iRole]?.trim().toUpperCase();

    if (!name || !rawTeam) continue;

    if (!["P", "D", "C", "A"].includes(role)) {
      skipped.push(`${name}: ruolo "${role}" non valido`);
      continue;
    }

    const teamId = resolveTeam(rawTeam);
    if (!teamId) {
      unknownTeams.add(rawTeam);
      skipped.push(`${name}: squadra "${rawTeam}" non presente a database`);
      continue;
    }

    const externalId = iId !== -1 ? row[iId]?.trim() || undefined : undefined;
    const parsedPrice = iPrice !== -1 ? Number(row[iPrice]?.replace(",", ".")) : NaN;
    const officialPrice = Number.isFinite(parsedPrice) ? Math.round(parsedPrice) : undefined;

    // Il listone scrive i nomi in maiuscolo, il database no: il confronto
    // deve ignorare le maiuscole, altrimenti ogni import crea un doppione.
    const existing =
      (externalId ? await db.player.findUnique({ where: { externalId } }) : null) ??
      (await db.player.findFirst({
        where: { teamId, name: { equals: name, mode: "insensitive" } },
      }));

    if (existing) {
      await db.player.update({
        where: { id: existing.id },
        // Il nome non lo tocco: il listone lo scrive tutto maiuscolo e in
        // interfaccia si legge peggio di quello che c'e' gia'.
        data: { teamId, role: role as Role, officialPrice, externalId },
      });
      updated++;
    } else {
      await db.player.create({
        data: {
          name,
          teamId,
          role: role as Role,
          officialPrice,
          externalId,
          // Il listone non dice nulla di questo: valori neutri, da arricchire
          // con le altre fonti.
          birthDate: new Date("2000-01-01T00:00:00.000Z"),
          detailedPosition: "",
          prFormation: [],
        },
      });
      created++;
    }
  }

  console.log(`creati ${created} | aggiornati ${updated} | saltati ${skipped.length}`);

  if (unknownTeams.size) {
    console.log(`\nSquadre del listone non trovate a database:`);
    for (const t of unknownTeams) console.log(`  - ${t}`);
    console.log(`Aggiungile in prisma/data/serieA.ts oppure mappale in ALIASES.`);
  }

  if (skipped.length) {
    console.log(`\nPrime righe saltate:`);
    for (const s of skipped.slice(0, 10)) console.log(`  - ${s}`);
  }

  console.log(`\nControlla il risultato con: npm run check:data`);
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});

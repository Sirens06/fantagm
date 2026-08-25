import * as XLSX from "xlsx";
import type { Role } from "./types";

export type RigaListone = {
  externalId?: string;
  nome: string;
  squadra: string;
  ruolo: Role;
  quotazione: number;
};

export type EsitoParsing = {
  righe: RigaListone[];
  scartate: { riga: number; motivo: string }[];
  colonneTrovate: Record<string, string>;
};

// I listoni cambiano intestazione ogni anno. Invece di pretendere nomi
// esatti, cerco per parole chiave.
const ALIAS: Record<string, string[]> = {
  externalId: ["id"],
  nome: ["nome", "giocatore", "calciatore", "player"],
  squadra: ["squadra", "team", "club"],
  ruolo: ["r", "ruolo", "role", "pos"],
  quotazione: ["qta", "qtа", "quotazione", "quot", "qt", "prezzo", "crediti"],
};

// Il listone scrive i nomi delle squadre come gli pare.
const ALIAS_SQUADRE: Record<string, string> = {
  verona: "Hellas Verona",
  hellasverona: "Hellas Verona",
  acmilan: "Milan",
  juve: "Juventus",
};

export function normalizza(s: string): string {
  return String(s)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Riporta il nome squadra del listone a quello che usiamo a database. */
export function nomeSquadraCanonico(raw: string): string {
  const k = normalizza(raw);
  return ALIAS_SQUADRE[k] ?? raw.trim();
}

function trovaColonne(intestazioni: string[]): Record<string, string> {
  const mappa: Record<string, string> = {};
  for (const [campo, chiavi] of Object.entries(ALIAS)) {
    const trovata = intestazioni.find((h) => {
      const n = normalizza(h);
      return chiavi.some((k) => n === k || n.startsWith(k));
    });
    if (trovata) mappa[campo] = trovata;
  }
  return mappa;
}

function leggiRuolo(v: unknown): Role | null {
  const s = String(v ?? "").trim().toUpperCase();
  if (!s) return null;

  const primo = s[0];
  if (primo === "P") return "P";
  if (primo === "D") return "D";
  if (primo === "C") return "C";
  if (primo === "A") return "A";

  // Alcuni listoni usano le sigle estese o inglesi.
  if (s.startsWith("GK") || s.startsWith("POR")) return "P";
  if (s.startsWith("DEF")) return "D";
  if (s.startsWith("MID") || s.startsWith("CEN")) return "C";
  if (s.startsWith("FW") || s.startsWith("ATT")) return "A";
  return null;
}

function leggiNumero(v: unknown, fallback: number): number {
  if (v === null || v === undefined || v === "") return fallback;
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isNaN(n) ? fallback : n;
}

/** Accetta il buffer di un .xlsx, .xls o .csv. XLSX li legge tutti,
 *  quindi non serve convertire a mano. */
export function parseListone(buffer: ArrayBuffer): EsitoParsing {
  const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });

  // Alcuni listoni hanno un foglio di istruzioni per primo: prendo quello
  // con piu' righe.
  let foglio = wb.Sheets[wb.SheetNames[0]];
  let maxRighe = 0;
  for (const nome of wb.SheetNames) {
    const n = XLSX.utils.sheet_to_json(wb.Sheets[nome]).length;
    if (n > maxRighe) {
      maxRighe = n;
      foglio = wb.Sheets[nome];
    }
  }

  // Il listone ufficiale ha due righe di titolo prima delle intestazioni:
  // cerco la riga che contiene davvero "Nome".
  const griglia = XLSX.utils.sheet_to_json<unknown[]>(foglio, { header: 1, defval: "" });
  const headerIndex = griglia.findIndex((r) =>
    r.some((cell) => normalizza(String(cell)) === "nome")
  );

  if (headerIndex === -1) {
    return {
      righe: [],
      scartate: [{ riga: 0, motivo: "Non trovo la riga di intestazione con la colonna 'Nome'" }],
      colonneTrovate: {},
    };
  }

  const intestazioni = griglia[headerIndex].map((c) => String(c));
  const col = trovaColonne(intestazioni);

  if (!col.nome || !col.ruolo) {
    return {
      righe: [],
      scartate: [
        {
          riga: headerIndex + 1,
          motivo: `Mancano le colonne Nome e R. Intestazioni lette: ${intestazioni.filter(Boolean).join(", ")}`,
        },
      ],
      colonneTrovate: col,
    };
  }

  const indice = (campo: string) =>
    col[campo] ? intestazioni.indexOf(col[campo]) : -1;

  const iId = indice("externalId");
  const iNome = indice("nome");
  const iSquadra = indice("squadra");
  const iRuolo = indice("ruolo");
  const iQuot = indice("quotazione");

  const righe: RigaListone[] = [];
  const scartate: { riga: number; motivo: string }[] = [];
  const visti = new Set<string>();

  griglia.slice(headerIndex + 1).forEach((r, i) => {
    const numeroRiga = headerIndex + i + 2;

    const nome = String(r[iNome] ?? "").trim();
    if (!nome) return; // riga vuota, non e' uno scarto

    const ruolo = leggiRuolo(r[iRuolo]);
    if (!ruolo) {
      scartate.push({ riga: numeroRiga, motivo: `${nome}: ruolo non riconosciuto ("${r[iRuolo]}")` });
      return;
    }

    const squadra = iSquadra !== -1 ? nomeSquadraCanonico(String(r[iSquadra] ?? "")) : "";
    if (!squadra) {
      scartate.push({ riga: numeroRiga, motivo: `${nome}: squadra mancante` });
      return;
    }

    const chiave = `${normalizza(nome)}|${normalizza(squadra)}`;
    if (visti.has(chiave)) {
      scartate.push({ riga: numeroRiga, motivo: `${nome}: doppione` });
      return;
    }
    visti.add(chiave);

    righe.push({
      externalId: iId !== -1 ? String(r[iId] ?? "").trim() || undefined : undefined,
      nome,
      squadra,
      ruolo,
      quotazione: Math.max(1, Math.round(leggiNumero(iQuot !== -1 ? r[iQuot] : "", 1))),
    });
  });

  return { righe, scartate, colonneTrovate: col };
}

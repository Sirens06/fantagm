import type { GiocatoreDTO, Role } from "@/lib/types";
import { BadgeFascia } from "./BadgeFascia";

const ruoli: Record<Role, string> = {
  P: "Portiere",
  D: "Difensore",
  C: "Centrocampista",
  A: "Attaccante",
};

function abbrName(nome: string) {
  const abbrName = nome.split(" ").at(0)?.charAt(0) ?? "";
  const abbrS = nome.split(" ").at(-1)?.charAt(0) ?? "";
  return abbrName + abbrS;
}

export function GiocatoreInAsta({ giocatore }: { giocatore: GiocatoreDTO }) {
  // Fisso, non dipende dall'offerta: e' una proprieta' del giocatore.
  // Positivo = vale piu' di quanto costa a listino.
  const inGuadagno = giocatore.scarto > 0;

  return (
    <section className="rounded-lg border border-riga bg-superficie p-4">
      <div className="flex items-center gap-3">
        {/* Niente foto: non c'e' una fonte. Le iniziali bastano a distinguere
            due giocatori chiamati di fila. */}
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-riga bg-campo font-display text-xl text-nebbia">
          {abbrName(giocatore.nome)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-display text-3xl leading-none tracking-wide">
            {giocatore.nome}
          </h2>
          <p className="mt-1 truncate text-xs text-nebbia">
            {giocatore.squadra} · {ruoli[giocatore.ruolo]}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-riga pt-3 text-xs">
        <BadgeFascia tier={giocatore.fascia} />
        <span className="text-nebbia">
          Quotazione <span className="text-gesso tabular-nums">{giocatore.quotazione ?? "—"}</span>
        </span>
        {/* Rosa: e' l'opinione di FantaGM, la stessa linea che vedi nella barra. */}
        <span className="text-nebbia">
          Consigliato{" "}
          <span className="text-rosa tabular-nums">{giocatore.prezzoConsigliato}</span>
        </span>
        <span className={`tabular-nums ${inGuadagno ? "text-affare" : "text-troppo"}`}>
          {inGuadagno ? `+${giocatore.scarto}` : giocatore.scarto}
        </span>
      </div>
    </section>
  );
}

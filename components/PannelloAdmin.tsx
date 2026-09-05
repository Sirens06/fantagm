import { useEffect, useState } from "react";
import type { GiocatoreDTO, StatoAsta } from "@/lib/types";

/**
 * I comandi di chi conduce l'asta.
 *
 * Compare solo se hai l'adminToken in localStorage. Non e' una difesa: il
 * controllo vero lo fa il server su ogni chiamata. Qui serve a non mettere
 * sotto il naso di otto persone dei bottoni che per loro fallirebbero.
 */
export function PannelloAdmin({
  codice,
  adminToken,
  lottoAperto,
  onStato,
}: {
  codice: string;
  adminToken: string;
  lottoAperto: boolean;
  onStato: (stato: StatoAsta) => void;
}) {
  const [q, setQ] = useState("");
  const [risultati, setRisultati] = useState<GiocatoreDTO[]>([]);
  const [occupato, setOccupato] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  // La ricerca la fa Postgres, non il browser: il listone vero sono
  // seicento giocatori e non ha senso spedirli tutti per filtrarli qui.
  // I 300ms aspettano che tu smetta di digitare, altrimenti parte una
  // chiamata per ogni lettera.
  useEffect(() => {
    if (q.trim().length < 2) return;
    const attesa = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/listone?q=${encodeURIComponent(q)}&codice=${codice}&take=15`,
          { cache: "no-store" },
        );
        if (res.ok) setRisultati(await res.json());
      } catch (error) {
        console.error("Ricerca listone fallita", error);
      }
    }, 300);
    return () => clearTimeout(attesa);
  }, [q, codice]);

  // Tutti i comandi hanno la stessa forma: POST con l'adminToken, e in
  // risposta lo stato completo dell'asta.
  async function comando(percorso: string, corpo: object = {}) {
    setErrore(null);
    setOccupato(true);
    try {
      const res = await fetch(`/api/asta/${codice}/${percorso}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken, ...corpo }),
      });
      const dati = await res.json();

      if (res.ok) {
        onStato(dati);
        setQ("");
        setRisultati([]);
      } else {
        setErrore(dati.messaggio || "Errore sconosciuto");
      }
    } catch (error) {
      console.error("Comando non riuscito", error);
      setErrore("Comando non riuscito, riprova");
    } finally {
      setOccupato(false);
    }
  }

  // Sotto le due lettere non svuoto lo stato — chiamare setState nel corpo
  // di un effetto fa ridisegnare due volte, e il lint lo vieta. Decido qui
  // cosa mostrare: e' un calcolo, non un dato da ricordare.
  const visibili = q.trim().length < 2 ? [] : risultati;

  function aggiudica() {
    if (!confirm("Aggiudicare al miglior offerente? Non si torna indietro.")) return;
    comando("aggiudica");
  }

  function chiudi() {
    if (!confirm("Chiudere l'asta? Da qui in poi nessuno puo' piu' rilanciare.")) return;
    comando("chiudi");
  }

  return (
    // Bordo tratteggiato: e' il banco del banditore, non un pezzo della sala.
    // Deve leggersi come uno strumento diverso da quello che usano gli altri.
    <section className="rounded-lg border border-dashed border-riga p-4">
      <h2 className="mb-3 text-xs uppercase tracking-widest text-nebbia">Banditore</h2>

      <input
        type="text"
        value={q}
        disabled={occupato}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cerca un giocatore o una squadra"
        className="w-full rounded-md border border-riga bg-campo px-3 py-2 text-sm text-gesso placeholder:text-nebbia disabled:opacity-40"
      />

      {visibili.length > 0 && (
        <ul className="mt-2 max-h-64 divide-y divide-riga overflow-y-auto rounded-md border border-riga">
          {visibili.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className={`min-w-0 truncate ${g.venduto ? "text-nebbia line-through" : ""}`}>
                {g.nome} · {g.squadra} · {g.ruolo} ·{" "}
                <span className="tabular-nums text-rosa">{g.prezzoConsigliato}</span>
              </span>
              <button
                type="button"
                disabled={occupato || g.venduto}
                onClick={() => comando("lotto", { playerId: g.id })}
                className="shrink-0 rounded-md border border-riga px-3 py-1 text-xs transition-colors hover:border-gesso/40 hover:bg-campo disabled:opacity-40"
              >
                {g.venduto ? "gia' venduto" : "Chiama"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={occupato || !lottoAperto}
          onClick={aggiudica}
          className="rounded-md bg-gesso py-2 text-sm font-medium text-campo transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Aggiudica
        </button>
        <button
          type="button"
          disabled={occupato || !lottoAperto}
          onClick={() => comando("annulla")}
          className="rounded-md border border-riga py-2 text-sm transition-colors hover:border-gesso/40 hover:bg-campo disabled:opacity-40"
        >
          Nessuno lo vuole
        </button>
        <button
          type="button"
          disabled={occupato}
          onClick={chiudi}
          className="rounded-md border border-troppo/40 py-2 text-sm text-troppo transition-colors hover:bg-troppo/10 disabled:opacity-40"
        >
          Chiudi asta
        </button>
      </div>

      {errore && <p className="mt-2 text-xs text-troppo">{errore}</p>}
    </section>
  );
}

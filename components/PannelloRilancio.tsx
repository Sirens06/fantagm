import { useState } from "react";
import type { StatoAsta } from "@/lib/types";

export function PannelloRilancio({
  codice,
  squadraId,
  offerta,
  onStato,
}: {
  codice: string;
  squadraId: string | null;
  offerta: number;
  onStato: (stato: StatoAsta) => void;
}) {
  const raiseBtns = [1, 5, 10, 50, 75, 100];
  const [importo, setImporto] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Un calcolo, mai uno stato: il minimo e' sempre un credito sopra l'offerta
  // di adesso, e cambia da solo quando qualcuno rilancia.
  const minOffer = offerta + 1;
  const rilancia = async () => {
    setErrore(null);
    setLoading(true);
    try {
      await fetch(`/api/asta/${codice}/rilancio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          squadraId,
          importo: Number(importo),
        }),
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          onStato(data);
          setImporto("");
        } else {
          const errorData = await res.json();
          setErrore(errorData.messaggio || "Errore sconosciuto");
        }
      });
    } catch (error) {
      console.error("Errore nella richiesta di rilancio", error);
      setErrore("Errore nel rilancio. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-lg border border-riga bg-superficie p-4">
      <div className="grid grid-cols-3 gap-2">
        {raiseBtns.map((rb) => (
          <button
            key={rb}
            type="button"
            disabled={!squadraId || loading}
            onClick={() => setImporto(String(offerta + rb))}
            className="rounded-md border border-riga py-2 text-sm tabular-nums text-gesso transition-colors hover:border-gesso/40 hover:bg-campo disabled:opacity-40"
          >
            +{rb}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={importo}
          disabled={!squadraId || loading}
          onChange={(e) => setImporto(e.target.value)}
          placeholder={`Minimo ${minOffer}`}
          className="min-w-0 flex-1 rounded-md border border-riga bg-campo px-3 py-2 font-display text-2xl tabular-nums text-gesso placeholder:font-body placeholder:text-sm placeholder:text-nebbia disabled:opacity-40"
        />
        <button
          type="button"
          disabled={!squadraId || loading}
          onClick={rilancia}
          className="shrink-0 rounded-md bg-gesso px-5 font-display text-xl tracking-wide text-campo transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Invio" : "Rilancia"}
        </button>
      </div>

      {errore && <p className="mt-2 text-xs text-troppo">{errore}</p>}
    </section>
  );
}

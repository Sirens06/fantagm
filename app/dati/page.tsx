"use client";

import { useState } from "react";

/** Quello che risponde POST /api/listone/importa. */
type Esito = {
  creati: number;
  aggiornati: number;
  /** Quante righe il parser ha buttato. */
  scartate: number;
  /** Le prime venti, con riga e motivo: il resto lo conta "scartate". */
  dettaglioScarti: { riga: number; motivo: string }[];
  /** Squadre del file che non stanno a database: i loro giocatori NON
   *  sono stati importati. E' il modo in cui questo import fallisce
   *  in silenzio. */
  squadreIgnote: string[];
  /** Come il parser ha interpretato le intestazioni del tuo file. */
  colonneTrovate: Record<string, string>;
};

export default function DatiPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  // Null finche' non hai caricato niente. Un oggetto solo, non sette stati:
  // cosi' "non ho ancora caricato" e "caricato, zero creati" restano due
  // cose diverse, e dopo la risposta c'e' un setter solo da chiamare.
  const [esito, setEsito] = useState<Esito | null>(null);

  async function carica() {
    // Serve anche a TypeScript: da qui in poi sa che il file non e' null,
    // e senza questo il FormData non compilerebbe.
    if (!file) return;
    setErrore(null);
    setCaricamento(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/listone/importa", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Errore: " + data.messaggio);
      }
      setEsito(data);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setErrore(err.message);
      } else {
        setErrore(String(err));
      }
    } finally {
      setCaricamento(false);
    }
  }

  return (
    <div>
      {/* L'etichetta resta sempre: con htmlFor e' lei il modo di riaprire la
          finestra, quindi nasconderla dopo la scelta toglie l'unico modo di
          cambiare file senza ricaricare la pagina. */}
      <label htmlFor="file-input">Seleziona un file:</label>
      <input
        type="file"
        accept=".csv, .xlsx, .xls"
        disabled={caricamento}
        onChange={(e) => {
          const file = e.target.files?.[0];
          setFile(file ?? null);
        }}
        id="file-input"
      />
      {/* Su un import che riscrive il listone, sapere cosa stai per caricare
          conta piu' di quanto sembri. */}
      {file && <p>{file.name}</p>}
      <button type="button" disabled={!file || caricamento} onClick={carica}>
        {caricamento ? "Carico\u2026" : "Carica"}
      </button>
      {errore && <div style={{ color: "red" }}>{errore}</div>}
      {esito && (
        <div>
          {/* Per primo, e non in fondo: i conteggi dicono cosa e' andato
              bene, questo dice cosa e' sparito senza che nessuno protesti.
              La condizione avvolge anche l'intestazione, cosi' quando non
              c'e' niente da dire non compare un elenco vuoto. */}
          {esito.squadreIgnote.length > 0 && (
            <div className="border border-troppo p-3 text-troppo">
              <p>
                <strong>Queste squadre non sono a database.</strong> I loro
                giocatori non sono stati importati e in asta non li troverai:
                controlla come sono scritte nel file.
              </p>
              <ul>
                {esito.squadreIgnote.map((squadra) => (
                  <li key={squadra}>{squadra}</li>
                ))}
              </ul>
            </div>
          )}

          <p>Creati: {esito.creati}</p>
          <p>Aggiornati: {esito.aggiornati}</p>
          <p>Scartate: {esito.scartate}</p>

          {esito.dettaglioScarti.length > 0 && (
            <div>
              <p>Dettaglio scarti (prime {esito.dettaglioScarti.length}):</p>
              <ul>
                {/* Qui l'indice come key va bene: l'array arriva completo dal
                    server e viene sostituito in blocco a ogni import, quindi
                    non si riordina e non cresce. "riga" da sola non basterebbe,
                    perche' vale 0 per tutti gli scarti da squadra ignota. */}
                {esito.dettaglioScarti.map((scarto, i) => (
                  <li key={i}>
                    {scarto.riga > 0 && <>riga {scarto.riga}: </>}
                    {scarto.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

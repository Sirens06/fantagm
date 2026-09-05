"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import type { StatoAsta } from "@/lib/types";
import { GiocatoreInAsta } from "@/components/GiocatoreInAsta";
import { OffertaCorrente } from "@/components/OffertaCorrente";
import { PannelloRilancio } from "@/components/PannelloRilancio";
import { PannelloAdmin } from "@/components/PannelloAdmin";
import { BarraTua } from "@/components/BarraTua";
import { PannelloStanza } from "@/components/PannelloStanza";
import { CronologiaRilanci } from "@/components/CronologiaRilanci";
import { GrigliaSquadre } from "@/components/GrigliaSquadre";
import { IndicatoreLinea } from "@/components/IndicatoreLinea";

import { leggiJson } from "@/lib/http";
// Fuori dal componente: useSyncExternalStore si riscrive all'evento solo se
// questa funzione resta la stessa. Dichiarata dentro, ne creeresti una nuova
// a ogni render e React si iscriverebbe daccapo ogni volta.
//
// L'evento "storage" scatta quando e' un'ALTRA scheda a scrivere: serve se
// apri due stanze in due tab. Nella stessa scheda non parte, ma non importa:
// al mount il valore viene comunque riletto.
function ascoltaStorage(cambiato: () => void) {
  window.addEventListener("storage", cambiato);
  return () => window.removeEventListener("storage", cambiato);
}

/**
 * Legge una chiave di localStorage senza rompere l'idratazione.
 *
 * Il terzo argomento e' la lettura "sul server": li' localStorage non
 * esiste, quindi null. React usa quel valore sia per l'HTML che genera il
 * server sia per il primo render nel browser — cosi' i due coincidono e non
 * c'e' errore di idratazione. Subito dopo passa alla lettura vera.
 */
function useValoreLocale(chiave: string) {
  return useSyncExternalStore(
    ascoltaStorage,
    () => localStorage.getItem(chiave),
    () => null,
  );
}

export default function AuctionRoom() {
  const params = useParams();
  const [nomeSquadra, setNomeSquadra] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [erroreEntrata, setErroreEntrata] = useState<string | null>(null);
  const [rientro, setRientro] = useState(false);
  const [stato, setStato] = useState<StatoAsta | null>(null);
  // Quando il server ha parlato l'ultima volta. Non "se l'ultima fetch e'
  // andata": l'indicatore di linea ragiona sul silenzio, non sull'errore.
  const [ultimoContatto, setUltimoContatto] = useState<number | null>(null);
  const hasFetched = useRef<boolean>(false);
  // Chi sono su QUESTO dispositivo. Null finche' non sei entrato: la pagina
  // deve saper vivere con "ancora non lo so".
  const teamId = useValoreLocale(`fantagm:${params.codice}:squadraId`);
  const adminToken = useValoreLocale(`fantagm:${params.codice}:adminToken`);

  useEffect(() => {
    async function fetchStato() {
      if (document.hidden) return; // Non fare fetch se la pagina non è visibile
      if (hasFetched.current) return;
      hasFetched.current = true;
      try {
        const res = await fetch(`/api/asta/${params.codice}`, {
          cache: "no-store",
        });
        // Una risposta d'errore e' JSON valido ma non e' lo stato: darla in
        // pasto a setStato riempirebbe la pagina di undefined. Per la linea
        // vale come silenzio, ed e' giusto cosi'.
        if (!res.ok) return;
        const data = await res.json();
        setStato(data);
        setUltimoContatto(Date.now());
      } catch (error) {
        console.error("Errore nel fetch dello stato dell'asta", error);
      } finally {
        hasFetched.current = false;
      }
    }
    fetchStato();

    const interval = setInterval(() => {
      fetchStato();
    }, 1500);

    document.addEventListener("visibilitychange", fetchStato);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", fetchStato);
    };
  }, [params.codice]);

  async function entra() {
    setErroreEntrata(null);
    setEntrando(true);
    try {
      const res = await fetch(`/api/asta/${params.codice}/entra`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeSquadra }),
      });
      const dati = await leggiJson<{ squadraId: string; rientro: boolean; messaggio?: string }>(res);

      if (!res.ok) {
        setErroreEntrata(dati.messaggio || "Errore sconosciuto");
        return;
      }

      localStorage.setItem(
        `fantagm:${params.codice}:squadraId`,
        dati.squadraId,
      );
      setRientro(dati.rientro);

      // Nella stessa scheda l'evento "storage" non parte da solo: lo lanciamo
      // a mano, cosi' useValoreLocale rilegge il valore e la pagina passa
      // alla sala d'asta senza ricaricare.
      window.dispatchEvent(new StorageEvent("storage"));
    } catch (error) {
      console.error("Errore nell'ingresso", error);
      setErroreEntrata("Ingresso non riuscito, riprova");
    } finally {
      setEntrando(false);
    }
  }

  // Finche' non sai chi sei, l'asta non serve: si entra e basta.
  if (!teamId) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-10">
        <header>
          <p className="text-xs uppercase tracking-widest text-nebbia">Stanza</p>
          <h1 className="font-display text-5xl leading-none tracking-wide">
            {params.codice}
          </h1>
        </header>
        <p className="text-sm text-nebbia">
          Scegli il nome della tua squadra per entrare.
        </p>
        <input
          type="text"
          value={nomeSquadra}
          maxLength={40}
          disabled={entrando}
          onChange={(e) => setNomeSquadra(e.target.value)}
          placeholder="Nome squadra"
          className="rounded-md border border-riga bg-superficie px-3 py-3 text-gesso placeholder:text-nebbia disabled:opacity-40"
        />
        <button
          type="button"
          disabled={entrando || !nomeSquadra.trim()}
          onClick={entra}
          className="rounded-md bg-gesso py-3 font-display text-xl tracking-wide text-campo transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {entrando ? "Entro" : "Entra"}
        </button>
        {erroreEntrata && <p className="text-sm text-troppo">{erroreEntrata}</p>}
      </div>
    );
  }

  const mia = stato?.squadre.find((s) => s.id === teamId);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-4xl leading-none tracking-wide">
          {params.codice}
        </h1>
        <IndicatoreLinea ultimoContatto={ultimoContatto} />
      </header>

      {rientro && (
        <p className="rounded-md border border-riga bg-superficie px-3 py-2 text-xs text-nebbia">
          Bentornato: sei rientrato nella tua squadra.
        </p>
      )}

      {adminToken && stato && (
        <PannelloAdmin
          codice={String(params.codice)}
          adminToken={adminToken}
          lottoAperto={Boolean(stato.lotto)}
          onStato={setStato}
        />
      )}

      {adminToken && stato && (
        <PannelloStanza
          codice={String(params.codice)}
          squadre={stato.squadre.length}
          maxSquadre={stato.maxSquadre}
        />
      )}

      {stato?.lotto ? (
        <>
          <GiocatoreInAsta giocatore={stato.lotto.giocatore} />
          <OffertaCorrente
            offerta={stato.lotto.offerta}
            leader={stato.lotto.leader ?? null}
            prezzoConsigliato={stato.lotto.giocatore.prezzoConsigliato}
          />
          <PannelloRilancio
            squadraId={teamId}
            codice={String(params.codice)}
            offerta={stato.lotto.offerta}
            onStato={setStato}
          />
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-riga px-4 py-10 text-center text-sm text-nebbia">
          Il banditore non ha ancora chiamato nessuno.
        </p>
      )}

      {stato?.lotto && (
        <section>
          <h2 className="mb-2 text-xs uppercase tracking-widest text-nebbia">
            Rilanci
          </h2>
          <CronologiaRilanci rilanci={stato.lotto.rilanci} />
        </section>
      )}

      {stato && (
        <section>
          <h2 className="mb-2 text-xs uppercase tracking-widest text-nebbia">
            Squadre
          </h2>
          <GrigliaSquadre
            squadre={stato.squadre}
            slotMax={stato.slotMax}
            mioId={teamId}
            leaderId={stato.lotto?.leader?.id ?? null}
          />
        </section>
      )}

      {/* Ultima nel DOM, non a meta' pagina: "sticky bottom-0" tiene un
          elemento incollato in basso finche' non raggiungi la sua posizione
          naturale. Se stesse in mezzo, scorrendo la griglia se ne andrebbe
          via — cioe' sparirebbe proprio mentre confronti i budget. */}
      {stato && mia && <BarraTua squadra={mia} slotMax={stato.slotMax} />}
    </div>
  );
}

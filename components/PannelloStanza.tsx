import { useEffect, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";

// L'origine della pagina non cambia mai finche' la scheda e' aperta, quindi
// non c'e' niente da ascoltare: la funzione di sottoscrizione restituisce
// subito il suo annullamento. Deve stare fuori dal componente, altrimenti
// React si riabbonerebbe a ogni render.
function nonCambiaMai() {
  return () => {};
}

/**
 * L'indirizzo del sito, letto senza rompere l'idratazione.
 *
 * Il terzo argomento e' la lettura "sul server", dove window non esiste:
 * stringa vuota. React usa quella sia per l'HTML che genera il server sia
 * per il primo render nel browser, cosi' i due coincidono. Subito dopo passa
 * alla lettura vera.
 *
 * Non un useEffect con setState: il lint set-state-in-effect lo vieta, ed e'
 * lo stesso motivo per cui la sala legge localStorage in questo modo.
 */
function useOrigine() {
  return useSyncExternalStore(
    nonCambiaMai,
    () => window.location.origin,
    () => "",
  );
}

/**
 * Il link e il QR con cui gli altri entrano, piu' quante squadre mancano.
 *
 * Lo vede solo chi conduce: e' lui che gira il telefono agli altri o proietta
 * lo schermo. Non e' una difesa — il codice stanza sta nell'URL di tutti —
 * ma tenerlo sotto il naso di otto persone durante l'asta e' rumore.
 */
export function PannelloStanza({
  codice,
  squadre,
  maxSquadre,
}: {
  codice: string;
  squadre: number;
  maxSquadre: number;
}) {
  const origine = useOrigine();
  // Un calcolo, non uno stato: dipende solo da origine e codice.
  const link = origine ? `${origine}/asta/${codice}` : "";

  const [qr, setQr] = useState("");
  const [copiato, setCopiato] = useState(false);

  useEffect(() => {
    if (!link) return; // primo render: l'origine non c'e' ancora

    // setQr sta dentro il .then, non nel corpo dell'effetto: la generazione
    // e' asincrona, e quando la promise risolve il render e' finito da un
    // pezzo. La bandierina evita di scrivere in un componente smontato se
    // il codice stanza cambia mentre il QR e' in lavorazione.
    let annullato = false;
    QRCode.toDataURL(link, { width: 256, margin: 1 })
      .then((url) => {
        if (!annullato) setQr(url);
      })
      .catch((errore) => console.error("QR non generato", errore));

    return () => {
      annullato = true;
    };
  }, [link]);

  async function copia() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2000);
    } catch (errore) {
      // Gli appunti esistono solo in contesto sicuro: https o localhost. Da
      // un indirizzo 192.168.x.x in http, navigator.clipboard non c'e'
      // proprio. Per questo il link resta scritto e selezionabile: il
      // bottone e' una comodita', non l'unica strada.
      console.error("Copia non riuscita", errore);
    }
  }

  const pieno = squadre >= maxSquadre;

  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-riga bg-superficie p-4">
      <div className="flex w-full items-baseline justify-between gap-3">
        <h2 className="text-xs uppercase tracking-widest text-nebbia">Chi manca</h2>
        <span className={`text-xs tabular-nums ${pieno ? "text-affare" : "text-nebbia"}`}>
          {squadre} / {maxSquadre} squadre
        </span>
      </div>

      {/* Il riquadro resta della sua misura anche da vuoto: senza, alla
          comparsa del QR tutto il resto della pagina salta in basso. */}
      <div className="size-40 rounded-md bg-gesso p-1.5">
        {/* Non next/image: e' un PNG gia' in memoria come data-URL, non c'e'
            niente da scaricare ne' da ottimizzare. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {qr && <img src={qr} alt={`QR per entrare nella stanza ${codice}`} className="size-full" />}
      </div>

      <p className="w-full select-all break-all text-center font-mono text-xs text-nebbia">
        {link || "…"}
      </p>

      <button
        type="button"
        onClick={copia}
        disabled={!link}
        className="w-full rounded-md border border-riga py-2 text-sm transition-colors hover:border-gesso/40 hover:bg-campo disabled:opacity-40"
      >
        {copiato ? "Copiato" : "Copia link"}
      </button>
    </section>
  );
}

import { useEffect, useState } from "react";

/**
 * Quanti millisecondi di silenzio prima di dire che la linea e' caduta.
 * Il polling gira ogni 1500ms: tre giri mancati sono un problema vero, uno
 * solo e' la rete che respira.
 */
const SOGLIA = 5000;

/**
 * Se la pagina sta ancora parlando col server.
 *
 * Non guarda l'esito dell'ultima fetch ma quanto tempo e' passato dall'ultima
 * riuscita: cosi' copre sia l'errore secco sia il caso peggiore, la richiesta
 * che resta appesa e non torna mai. Da fuori sono la stessa cosa — nessuno ti
 * sta dicendo l'offerta vera — e vanno dette allo stesso modo.
 */
export function IndicatoreLinea({ ultimoContatto }: { ultimoContatto: number | null }) {
  // L'orologio sta nello stato, non in un Date.now() dentro il render: durante
  // il render le funzioni impure sono vietate (react-hooks/purity), perche'
  // darebbero un risultato diverso a ogni ridisegno casuale.
  //
  // Ed e' un battito, non una prop: quando il server tace non arriva nessun
  // aggiornamento, quindi nessun ridisegno — senza questo l'indicatore
  // resterebbe verde per sempre proprio quando deve diventare rosso.
  const [adesso, setAdesso] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setAdesso(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const eta = ultimoContatto === null || adesso === null ? null : adesso - ultimoContatto;
  // eta null col contatto gia' preso = il battito non ha ancora ticchettato:
  // abbiamo appena sentito il server, la linea e' viva.
  const viva = ultimoContatto !== null && (eta === null || eta < SOGLIA);

  const testo =
    ultimoContatto === null
      ? "collegamento"
      : viva
        ? "in linea"
        : `ferma da ${Math.round((eta ?? 0) / 1000)}s`;

  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[11px] uppercase tracking-widest text-nebbia">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${viva ? "bg-affare" : "bg-troppo"}`}
      />
      {testo}
    </span>
  );
}

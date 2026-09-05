import { NextResponse } from "next/server";

/**
 * Avvolge un handler di route perche' non possa mai rispondere con un corpo
 * vuoto.
 *
 * Senza questo, un'eccezione non catturata dentro un handler diventa un 500
 * di Next con zero byte di corpo. Il client fa `await res.json()`, e quello
 * che l'utente legge non e' l'errore vero ma
 * "Unexpected end of JSON input" — cioe' l'errore vero sparito.
 *
 * Qui torna sempre la forma `{ errore, messaggio }` che usa gia' tutto il
 * resto dell'API, con `messaggio` in italiano e pronto da mostrare.
 */
export function rotta<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>,
) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (errore) {
      // Lo stack completo resta nei log della funzione (in locale il
      // terminale, su Vercel i Runtime Logs). Al client va solo la causa
      // classificata: basta per capire cosa fare, senza esporre la
      // stringa di connessione.
      console.error("Errore non gestito nella route:", errore);
      return NextResponse.json(
        { errore: "errore_server", messaggio: spiega(errore) },
        { status: 500 },
      );
    }
  };
}

/**
 * Traduce i modi in cui questa applicazione fallisce davvero. Non e' una
 * tassonomia completa: sono i casi in cui sapere la causa cambia cosa fai
 * dopo. Tutto il resto cade nel messaggio generico.
 */
function spiega(errore: unknown): string {
  const codice =
    typeof errore === "object" && errore !== null && "code" in errore
      ? String((errore as { code: unknown }).code)
      : "";
  const testo = errore instanceof Error ? errore.message : String(errore);

  // Prisma non trova le tabelle: lo schema non e' mai stato applicato a
  // questo database.
  if (codice === "P2021" || /does not exist/i.test(testo)) {
    return "Le tabelle non esistono su questo database: le migrazioni non sono state applicate.";
  }

  // Nessuno risponde all'altro capo.
  if (codice === "P1001" || codice === "ECONNREFUSED" || codice === "ENOTFOUND") {
    return "Database non raggiungibile: controlla DATABASE_URL.";
  }

  // Credenziali rifiutate.
  if (codice === "P1000" || codice === "28P01" || codice === "28000") {
    return "Il database ha rifiutato le credenziali: controlla DATABASE_URL.";
  }

  // Il server pretende TLS e noi ci siamo presentati in chiaro.
  if (/SSL|pg_hba/i.test(testo)) {
    return "Il database pretende una connessione SSL: aggiungi sslmode=require a DATABASE_URL.";
  }

  if (!process.env.DATABASE_URL) {
    return "DATABASE_URL non e' impostata su questo ambiente.";
  }

  return "Errore del server. Il dettaglio e' nei log.";
}

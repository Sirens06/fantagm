/**
 * Legge una risposta come JSON senza dare per scontato che ci sia un JSON.
 *
 * `res.json()` su un corpo vuoto lancia "Unexpected end of JSON input", che
 * non dice niente a chi lo legge e nasconde quello che e' successo davvero.
 * Un corpo vuoto arriva quando a fallire e' qualcosa sopra l'applicazione —
 * la piattaforma che uccide la funzione, un limite sulla dimensione della
 * richiesta, un gateway — perche' li' il nostro try/catch non arriva.
 */
export async function leggiJson<T>(res: Response): Promise<T> {
  const testo = await res.text();

  if (!testo.trim()) {
    throw new Error(
      res.ok
        ? "Il server ha risposto senza contenuto."
        : `Il server ha risposto ${res.status} senza dire altro. Il dettaglio e' nei log del server.`,
    );
  }

  try {
    return JSON.parse(testo) as T;
  } catch {
    // Tipicamente una pagina d'errore HTML della piattaforma.
    throw new Error(
      `Risposta non leggibile dal server (${res.status}). Il dettaglio e' nei log del server.`,
    );
  }
}

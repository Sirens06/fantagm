import type { RilancioDTO } from "@/lib/types";

/**
 * I rilanci del lotto in corso, dall'ultimo al primo.
 */
export function CronologiaRilanci({ rilanci }: { rilanci: RilancioDTO[] }) {
  // Il caso vuoto va prima e fuori dal return: all'apertura di ogni lotto la
  // lista e' vuota, non e' un'eccezione. Un "if" e' un'istruzione, quindi non
  // puo' stare dentro il JSX di un return — li' dentro vanno solo espressioni.
  if (rilanci.length === 0) {
    return <p className="text-xs text-nebbia">Nessuno ha ancora rilanciato.</p>;
  }

  // Il server li manda dal piu' vecchio (orderBy quando: "asc"), ma quello che
  // vuoi vedere senza scorrere e' l'ultimo. La copia non e' un vezzo: reverse()
  // riordina sul posto, e quell'array vive dentro lo stato della pagina.
  const dallUltimo = [...rilanci].reverse();

  return (
    <ol className="max-h-48 divide-y divide-riga overflow-y-auto rounded-lg border border-riga bg-superficie px-3">
      {dallUltimo.map((r) => (
        // Nessun id nel DTO, e l'indice non va bene: la lista cresce in testa,
        // quindi gli indici scalano tutti a ogni rilancio. Squadra + istante
        // invece e' unico: nessuno rilancia due volte nello stesso momento.
        <li
          key={`${r.squadraId}-${r.quando}`}
          className="flex items-baseline justify-between gap-3 py-2 text-sm"
        >
          <span className="truncate text-gesso">{r.squadraNome}</span>
          <span className="flex shrink-0 items-baseline gap-3">
            <strong className="tabular-nums">{r.importo}</strong>
            <time dateTime={r.quando} className="text-[11px] tabular-nums text-nebbia">
              {/* Locale scritta a mano: altrimenti otto telefoni con
                  impostazioni diverse mostrano formati diversi. */}
              {new Date(r.quando).toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </time>
          </span>
        </li>
      ))}
    </ol>
  );
}

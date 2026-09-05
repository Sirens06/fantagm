export function OffertaCorrente({
  offerta,
  leader,
  prezzoConsigliato,
}: {
  offerta: number;
  leader: { nome: string } | null;
  prezzoConsigliato: number;
}) {
  // Questo allarme non arriva dal server: e' un confronto fra l'offerta di
  // adesso e l'opinione di FantaGM sul giocatore.
  const sopra = offerta > prezzoConsigliato;

  // La scala e' il doppio del consigliato, quindi la linea rosa cade SEMPRE a
  // meta' barra e non si sposta mai, per nessun giocatore. E' un punto fisso
  // che impari a leggere in una sera: a sinistra e' affare, a destra stai
  // pagando troppo. Oltre il doppio la barra si ferma e parla il numero.
  const scala = Math.max(1, prezzoConsigliato * 2);
  const pieno = Math.min(100, (offerta / scala) * 100);

  return (
    <section className="rounded-lg border border-riga bg-superficie p-4 text-center">
      <p className="truncate text-xs uppercase tracking-widest text-nebbia">
        {leader ? leader.nome : "Base d'asta"}
      </p>

      {/* La key sul valore rimonta l'elemento a ogni cambio, e l'animazione
          riparte: l'offerta si muove perche' qualcuno ti ha superato, e devi
          accorgertene senza fissare lo schermo. */}
      <p
        key={offerta}
        className={`battito font-display text-7xl leading-none tabular-nums ${
          sopra ? "text-troppo" : "text-gesso"
        }`}
      >
        {offerta}
      </p>

      <div className="relative mt-4 h-2 rounded-full bg-campo">
        <div
          className={`barra-offerta h-2 rounded-full ${sopra ? "bg-troppo" : "bg-gesso"}`}
          style={{ width: `${pieno}%` }}
        />
        <span
          aria-hidden
          className="absolute -inset-y-1 left-1/2 w-px -translate-x-1/2 bg-rosa"
        />
      </div>

      <p className="mt-2 text-xs text-nebbia">
        Consigliato <span className="tabular-nums text-rosa">{prezzoConsigliato}</span>
      </p>
      {sopra && (
        <p className="mt-1 text-xs text-troppo">
          {offerta - prezzoConsigliato} sopra il consigliato
        </p>
      )}
    </section>
  );
}

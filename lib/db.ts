import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 non si connette piu' da solo: vuole un driver adapter esplicito.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Parametri che Prisma mette nella URL ma che `pg` non conosce. Vanno tolti,
 * altrimenti finiscono nella configurazione del pool dove non significano
 * niente.
 *
 * Quello che NON e' in questa lista resta: `sslmode` in particolare, che pg
 * capisce benissimo ed e' l'unica cosa che convince Neon, Supabase e Vercel
 * Postgres ad accettare la connessione. Tagliare tutta la query string
 * spegneva la TLS in silenzio.
 */
const SOLO_DI_PRISMA = [
  "connection_limit",
  "pool_timeout",
  "connect_timeout",
  "socket_timeout",
  "max_idle_connection_lifetime",
  "statement_cache_size",
  "pgbouncer",
  "sslidentity",
  "sslaccept",
];

function createClient() {
  const url = process.env.DATABASE_URL;

  // Senza, `pg` parserebbe la stringa vuota come un host che si chiama
  // "base" e fallirebbe la risoluzione DNS venti livelli piu' in basso.
  // Meglio dirlo qui, con il nome della variabile che manca.
  if (!url) {
    throw new Error(
      "DATABASE_URL non e' impostata: il database non e' configurato su questo ambiente.",
    );
  }

  const parsed = new URL(url);
  for (const chiave of SOLO_DI_PRISMA) {
    parsed.searchParams.delete(chiave);
  }

  // `schema` non va nella URL ma nelle opzioni dell'adapter.
  const schema = parsed.searchParams.get("schema") ?? undefined;
  parsed.searchParams.delete("schema");

  const adapter = new PrismaPg({
    connectionString: parsed.toString(),
    max: 10,
    idleTimeoutMillis: 30_000,
    ...(schema ? { schema } : {}),
  });

  return new PrismaClient({ adapter });
}

// La cache globale vale ANCHE in produzione. Senza, ogni valutazione del
// modulo apre un client nuovo con il suo pool: le connessioni esplodono e
// le query di richieste diverse finiscono per accavallarsi.
function client(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

/**
 * Il client vero nasce alla prima proprieta' letta, non all'import.
 *
 * La differenza conta quando la configurazione e' sbagliata: creandolo
 * all'import, l'errore esplode mentre il modulo viene valutato, cioe' fuori
 * dal try/catch di `rotta()` — e la risposta tornerebbe a essere un 500 con
 * il corpo vuoto. Cosi' invece scatta dentro l'handler, e il client riceve
 * un messaggio che si legge.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, proprieta) {
    const vero = client();
    const valore = Reflect.get(vero, proprieta, vero);
    return typeof valore === "function" ? valore.bind(vero) : valore;
  },
});

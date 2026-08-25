import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 non si connette piu' da solo: vuole un driver adapter esplicito.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const url = process.env.DATABASE_URL ?? "";

  // I parametri della connection string di Prisma (connection_limit,
  // pool_timeout, socket_timeout...) non li capisce `pg`, che li ignora o li
  // interpreta a modo suo. Il pool lo configuro qui, esplicitamente.
  const connectionString = url.split("?")[0];

  const adapter = new PrismaPg({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

  return new PrismaClient({ adapter });
}

// La cache globale vale ANCHE in produzione. Senza, ogni valutazione del
// modulo apre un client nuovo con il suo pool: le connessioni esplodono e
// le query di richieste diverse finiscono per accavallarsi.
export const db = globalForPrisma.prisma ?? createClient();
globalForPrisma.prisma = db;

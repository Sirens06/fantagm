-- CreateEnum
CREATE TYPE "StatoStanza" AS ENUM ('ATTESA', 'CORSO', 'FINITA');

-- CreateEnum
CREATE TYPE "StatoLotto" AS ENUM ('APERTO', 'CHIUSO', 'ANNULLATO');

-- CreateTable
CREATE TABLE "Stanza" (
    "id" TEXT NOT NULL,
    "codice" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "stato" "StatoStanza" NOT NULL DEFAULT 'ATTESA',
    "budget" INTEGER NOT NULL DEFAULT 500,
    "slotP" INTEGER NOT NULL DEFAULT 3,
    "slotD" INTEGER NOT NULL DEFAULT 8,
    "slotC" INTEGER NOT NULL DEFAULT 8,
    "slotA" INTEGER NOT NULL DEFAULT 6,
    "adminToken" TEXT NOT NULL,
    "creataIl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stanza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Squadra" (
    "id" TEXT NOT NULL,
    "stanzaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,

    CONSTRAINT "Squadra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lotto" (
    "id" TEXT NOT NULL,
    "stanzaId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "stato" "StatoLotto" NOT NULL DEFAULT 'APERTO',
    "offerta" INTEGER NOT NULL DEFAULT 0,
    "leaderId" TEXT,
    "apertoIl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lotto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rilancio" (
    "id" TEXT NOT NULL,
    "lottoId" TEXT NOT NULL,
    "squadraId" TEXT NOT NULL,
    "importo" INTEGER NOT NULL,
    "quando" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rilancio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acquisto" (
    "id" TEXT NOT NULL,
    "stanzaId" TEXT NOT NULL,
    "squadraId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "prezzo" INTEGER NOT NULL,
    "ruolo" "Role" NOT NULL,

    CONSTRAINT "Acquisto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stanza_codice_key" ON "Stanza"("codice");

-- CreateIndex
CREATE UNIQUE INDEX "Squadra_stanzaId_nome_key" ON "Squadra"("stanzaId", "nome");

-- CreateIndex
CREATE INDEX "Lotto_stanzaId_stato_idx" ON "Lotto"("stanzaId", "stato");

-- CreateIndex
CREATE INDEX "Lotto_playerId_idx" ON "Lotto"("playerId");

-- CreateIndex
CREATE INDEX "Rilancio_lottoId_quando_idx" ON "Rilancio"("lottoId", "quando");

-- CreateIndex
CREATE INDEX "Rilancio_squadraId_idx" ON "Rilancio"("squadraId");

-- CreateIndex
CREATE INDEX "Acquisto_squadraId_idx" ON "Acquisto"("squadraId");

-- CreateIndex
CREATE INDEX "Acquisto_playerId_idx" ON "Acquisto"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Acquisto_stanzaId_playerId_key" ON "Acquisto"("stanzaId", "playerId");

-- AddForeignKey
ALTER TABLE "Squadra" ADD CONSTRAINT "Squadra_stanzaId_fkey" FOREIGN KEY ("stanzaId") REFERENCES "Stanza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lotto" ADD CONSTRAINT "Lotto_stanzaId_fkey" FOREIGN KEY ("stanzaId") REFERENCES "Stanza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lotto" ADD CONSTRAINT "Lotto_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lotto" ADD CONSTRAINT "Lotto_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Squadra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rilancio" ADD CONSTRAINT "Rilancio_lottoId_fkey" FOREIGN KEY ("lottoId") REFERENCES "Lotto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rilancio" ADD CONSTRAINT "Rilancio_squadraId_fkey" FOREIGN KEY ("squadraId") REFERENCES "Squadra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acquisto" ADD CONSTRAINT "Acquisto_stanzaId_fkey" FOREIGN KEY ("stanzaId") REFERENCES "Stanza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acquisto" ADD CONSTRAINT "Acquisto_squadraId_fkey" FOREIGN KEY ("squadraId") REFERENCES "Squadra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acquisto" ADD CONSTRAINT "Acquisto_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
